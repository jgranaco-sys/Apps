import express from 'express';
import cors from 'cors';
import { Server as SocketServer } from 'socket.io';
import { createRoomsRouter } from './modules/rooms/rooms.router';

export function createApp(io: SocketServer) {
  const app = express();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  app.use(
    cors({
      origin: [frontendUrl, 'http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    })
  );
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Routes
  app.use('/api/rooms', createRoomsRouter(io));

  return app;
}
