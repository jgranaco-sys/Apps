import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import type { RoomData, SummaryEntry } from '../api';
import { connectSocket, disconnectSocket, getSocket } from '../socket';
import AdminPanel from '../components/AdminPanel';
import PlayerPanel from '../components/PlayerPanel';
import SummaryBoard from '../components/SummaryBoard';

interface Props {
  userId: string;
  nickname: string;
  roomCode: string;
  isAdmin: boolean;
  onLeave: () => void;
}

export default function Room({ userId, nickname, roomCode, isAdmin, onLeave }: Props) {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [summary, setSummary] = useState<SummaryEntry[]>([]);
  const [myScore, setMyScore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.getRoom(roomCode);
      setRoom(res.room);
    } catch {
      setError('Failed to load room');
    }
  }, [roomCode]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.getSummary(roomCode);
      setSummary(res.summary);

      // Check if my score is already revealed
      const me = res.summary.find((e) => e.userId === userId);
      if (me?.revealed && me.score) {
        setMyScore(me.score);
      }
    } catch {
      // silently ignore summary errors
    }
  }, [roomCode, userId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchRoom();
      await fetchSummary();
      setLoading(false);
    }
    init();
  }, [fetchRoom, fetchSummary]);

  useEffect(() => {
    const socket = connectSocket(roomCode, userId);

    socket.on('room:joined', (data: { room: RoomData }) => {
      setRoom(data.room);
      fetchSummary();
    });

    socket.on('room:status_changed', (data: { status: string; room: RoomData }) => {
      setRoom(data.room);
    });

    socket.on('summary:updated', (data: { summary: SummaryEntry[] }) => {
      setSummary(data.summary);
      const me = data.summary.find((e) => e.userId === userId);
      if (me?.revealed && me.score) {
        setMyScore(me.score);
      }
    });

    return () => {
      const s = getSocket();
      s.off('room:joined');
      s.off('room:status_changed');
      s.off('summary:updated');
      disconnectSocket();
    };
  }, [roomCode, userId, fetchSummary]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading room…</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="error-screen">
        <p>{error || 'Room not found'}</p>
        <button className="btn-secondary" onClick={onLeave}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="room-container">
      <header className="room-header">
        <div className="room-header-left">
          <h2 className="room-title">Room: <span className="room-code-display">{room.code}</span></h2>
          <span className={`status-badge status-${room.status.toLowerCase()}`}>
            {room.status === 'WAITING' && '⏳ Waiting'}
            {room.status === 'REVEAL_OPEN' && '🎲 Reveal Open'}
            {room.status === 'FINISHED' && '✅ Finished'}
          </span>
        </div>
        <button className="btn-leave" onClick={onLeave}>Leave Room</button>
      </header>

      <div className="room-content">
        <div className="room-panels">
          {isAdmin ? (
            <AdminPanel
              room={room}
              userId={userId}
              onRevealOpened={(updatedRoom) => setRoom(updatedRoom)}
            />
          ) : (
            <PlayerPanel
              room={room}
              userId={userId}
              nickname={nickname}
              myScore={myScore}
              onScoreRevealed={(score) => setMyScore(score)}
            />
          )}

          {isAdmin && room.status === 'REVEAL_OPEN' && myScore === null && (
            <PlayerPanel
              room={room}
              userId={userId}
              nickname={nickname}
              myScore={myScore}
              onScoreRevealed={(score) => setMyScore(score)}
            />
          )}
        </div>

        <SummaryBoard summary={summary} roomStatus={room.status} />
      </div>
    </div>
  );
}
