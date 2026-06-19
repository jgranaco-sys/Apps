import { Server as SocketServer, Socket } from 'socket.io';

export function setupSockets(io: SocketServer): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Client joins a room channel by room code
    socket.on('join:room', (data: { code: string; userId?: string }) => {
      const { code } = data;
      if (code) {
        socket.join(code);
        console.log(`Socket ${socket.id} joined room channel: ${code}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
