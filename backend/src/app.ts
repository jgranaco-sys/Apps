import express from 'express';
import cors from 'cors';
import path from 'path';
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

  // In production, serve the built React frontend and handle client-side routing
  if (process.env.NODE_ENV === 'production') {
    const publicPath = path.join(__dirname, '..', 'public');
    app.use(express.static(publicPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  }

  return app;
}
