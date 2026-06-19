import { Request, Response } from 'express';
import { Server as SocketServer } from 'socket.io';
import prisma from '../../db';
import { generateRoomCode, buildScorePool, calculateCapacity } from '../../utils/scorePool';
import { v4 as uuidv4 } from 'uuid';

// Safe room snapshot (no private assignments)
function roomSnapshot(room: any) {
  return {
    id: room.id,
    code: room.code,
    status: room.status,
    maxLocalScore: room.maxLocalScore,
    maxVisitScore: room.maxVisitScore,
    allowDuplicates: room.allowDuplicates,
    maxRepetitionsPerScore: room.maxRepetitionsPerScore,
    capacity: calculateCapacity(
      room.maxLocalScore,
      room.maxVisitScore,
      room.allowDuplicates,
      room.maxRepetitionsPerScore
    ),
    userCount: room._count?.users ?? 0,
    createdAt: room.createdAt,
  };
}

export function createRoomsController(io: SocketServer) {
  return {
    // POST /api/rooms
    async createRoom(req: Request, res: Response) {
      try {
        const {
          nickname,
          maxLocalScore,
          maxVisitScore,
          allowDuplicates = false,
          maxRepetitionsPerScore = 1,
        } = req.body;

        if (!nickname || maxLocalScore == null || maxVisitScore == null) {
          return res.status(400).json({ error: 'nickname, maxLocalScore, maxVisitScore are required' });
        }
        if (maxLocalScore < 0 || maxVisitScore < 0) {
          return res.status(400).json({ error: 'Score limits must be >= 0' });
        }
        if (maxRepetitionsPerScore < 1) {
          return res.status(400).json({ error: 'maxRepetitionsPerScore must be >= 1' });
        }

        // Generate unique room code
        let code = generateRoomCode();
        while (await prisma.room.findUnique({ where: { code } })) {
          code = generateRoomCode();
        }

        const adminId = uuidv4();

        const room = await prisma.$transaction(async (tx) => {
          const newRoom = await tx.room.create({
            data: {
              code,
              adminUserId: adminId,
              maxLocalScore: Number(maxLocalScore),
              maxVisitScore: Number(maxVisitScore),
              allowDuplicates: Boolean(allowDuplicates),
              maxRepetitionsPerScore: Number(maxRepetitionsPerScore),
            },
          });

          const admin = await tx.user.create({
            data: {
              id: adminId,
              roomId: newRoom.id,
              nickname,
              isAdmin: true,
            },
          });

          // Assign a score to admin too
          const pool = buildScorePool(
            newRoom.maxLocalScore,
            newRoom.maxVisitScore,
            newRoom.allowDuplicates,
            newRoom.maxRepetitionsPerScore
          );

          const [localScore, visitScore] = pool[0];
          await tx.assignment.create({
            data: {
              roomId: newRoom.id,
              userId: admin.id,
              localScore,
              visitScore,
            },
          });

          return newRoom;
        });

        const fullRoom = await prisma.room.findUnique({
          where: { id: room.id },
          include: { _count: { select: { users: true } } },
        });

        return res.status(201).json({
          room: roomSnapshot(fullRoom),
          userId: adminId,
          nickname,
          isAdmin: true,
        });
      } catch (err) {
        console.error('createRoom error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
    },

    // POST /api/rooms/:code/join
    async joinRoom(req: Request, res: Response) {
      try {
        const { code } = req.params;
        const { nickname } = req.body;

        if (!nickname) {
          return res.status(400).json({ error: 'nickname is required' });
        }

        const room = await prisma.room.findUnique({
          where: { code },
          include: {
            users: true,
            assignments: true,
            _count: { select: { users: true } },
          },
        });

        if (!room) {
          return res.status(404).json({ error: 'Room not found' });
        }
        if (room.status !== 'WAITING') {
          return res.status(400).json({ error: 'Room is no longer accepting players' });
        }

        const capacity = calculateCapacity(
          room.maxLocalScore,
          room.maxVisitScore,
          room.allowDuplicates,
          room.maxRepetitionsPerScore
        );

        if (room._count.users >= capacity) {
          return res.status(400).json({ error: 'Room is full' });
        }

        // Build pool and find used scores
        const usedScores = room.assignments.map(
          (a) => `${a.localScore}-${a.visitScore}`
        );

        const pool = buildScorePool(
          room.maxLocalScore,
          room.maxVisitScore,
          room.allowDuplicates,
          room.maxRepetitionsPerScore
        );

        // Find an available score not yet used (respect repetition limits)
        const scoreUsageCount: Record<string, number> = {};
        for (const s of usedScores) {
          scoreUsageCount[s] = (scoreUsageCount[s] ?? 0) + 1;
        }

        let assignedPair: [number, number] | null = null;
        for (const [x, y] of pool) {
          const key = `${x}-${y}`;
          const used = scoreUsageCount[key] ?? 0;
          const maxAllowed = room.allowDuplicates ? room.maxRepetitionsPerScore : 1;
          if (used < maxAllowed) {
            assignedPair = [x, y];
            break;
          }
        }

        if (!assignedPair) {
          return res.status(400).json({ error: 'Room is full (no available scores)' });
        }

        const userId = uuidv4();

        const newUser = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              id: userId,
              roomId: room.id,
              nickname,
              isAdmin: false,
            },
          });

          await tx.assignment.create({
            data: {
              roomId: room.id,
              userId: user.id,
              localScore: assignedPair![0],
              visitScore: assignedPair![1],
            },
          });

          return user;
        });

        const updatedRoom = await prisma.room.findUnique({
          where: { id: room.id },
          include: { _count: { select: { users: true } } },
        });

        // Broadcast join event to room
        io.to(code).emit('room:joined', {
          userId: newUser.id,
          nickname: newUser.nickname,
          room: roomSnapshot(updatedRoom),
        });

        return res.status(200).json({
          room: roomSnapshot(updatedRoom),
          userId: newUser.id,
          nickname: newUser.nickname,
          isAdmin: false,
        });
      } catch (err) {
        console.error('joinRoom error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
    },

    // GET /api/rooms/:code
    async getRoom(req: Request, res: Response) {
      try {
        const { code } = req.params;
        const room = await prisma.room.findUnique({
          where: { code },
          include: { _count: { select: { users: true } } },
        });

        if (!room) {
          return res.status(404).json({ error: 'Room not found' });
        }

        return res.json({ room: roomSnapshot(room) });
      } catch (err) {
        console.error('getRoom error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
    },

    // POST /api/rooms/:code/reveal-open
    async revealOpen(req: Request, res: Response) {
      try {
        const { code } = req.params;
        const { userId } = req.body;

        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        const room = await prisma.room.findUnique({ where: { code } });
        if (!room) {
          return res.status(404).json({ error: 'Room not found' });
        }

        if (room.adminUserId !== userId) {
          return res.status(403).json({ error: 'Only the admin can open reveal phase' });
        }

        if (room.status !== 'WAITING') {
          return res.status(400).json({ error: 'Room is not in WAITING state' });
        }

        const updated = await prisma.room.update({
          where: { code },
          data: { status: 'REVEAL_OPEN' },
          include: { _count: { select: { users: true } } },
        });

        io.to(code).emit('room:status_changed', {
          status: 'REVEAL_OPEN',
          room: roomSnapshot(updated),
        });

        return res.json({ room: roomSnapshot(updated) });
      } catch (err) {
        console.error('revealOpen error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
    },

    // POST /api/rooms/:code/reveal-me
    async revealMe(req: Request, res: Response) {
      try {
        const { code } = req.params;
        const { userId } = req.body;

        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        const room = await prisma.room.findUnique({ where: { code } });
        if (!room) {
          return res.status(404).json({ error: 'Room not found' });
        }

        if (room.status !== 'REVEAL_OPEN') {
          return res.status(400).json({ error: 'Reveal phase is not open yet' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.roomId !== room.id) {
          return res.status(404).json({ error: 'User not found in this room' });
        }

        const assignment = await prisma.assignment.findUnique({
          where: { userId },
        });

        if (!assignment) {
          return res.status(404).json({ error: 'Assignment not found' });
        }

        if (assignment.revealed) {
          // Already revealed, just return
          return res.json({
            localScore: assignment.localScore,
            visitScore: assignment.visitScore,
            score: `${assignment.localScore} - ${assignment.visitScore}`,
          });
        }

        const updated = await prisma.assignment.update({
          where: { userId },
          data: { revealed: true, revealedAt: new Date() },
        });

        // Broadcast summary update
        const summary = await getSummary(room.id);
        io.to(code).emit('summary:updated', { summary });

        return res.json({
          localScore: updated.localScore,
          visitScore: updated.visitScore,
          score: `${updated.localScore} - ${updated.visitScore}`,
        });
      } catch (err) {
        console.error('revealMe error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
    },

    // GET /api/rooms/:code/summary
    async getSummaryHandler(req: Request, res: Response) {
      try {
        const { code } = req.params;
        const room = await prisma.room.findUnique({ where: { code } });
        if (!room) {
          return res.status(404).json({ error: 'Room not found' });
        }

        const summary = await getSummary(room.id);
        return res.json({ summary });
      } catch (err) {
        console.error('getSummary error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
    },
  };
}

async function getSummary(roomId: string) {
  const users = await prisma.user.findMany({
    where: { roomId },
    include: { assignment: true },
    orderBy: { joinedAt: 'asc' },
  });

  return users.map((u) => ({
    userId: u.id,
    nickname: u.nickname,
    isAdmin: u.isAdmin,
    revealed: u.assignment?.revealed ?? false,
    score: u.assignment?.revealed
      ? `${u.assignment.localScore} - ${u.assignment.visitScore}`
      : null,
    revealedAt: u.assignment?.revealedAt ?? null,
  }));
}
