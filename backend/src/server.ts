import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app';
import { setupSockets } from './sockets';
import prisma from './db';

const PORT = Number(process.env.PORT) || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

async function main() {
  const httpServer = http.createServer();

  const io = new SocketServer(httpServer, {
    cors: {
      // In production, frontend is served from the same origin so no CORS is needed for sockets.
      // In development, allow localhost origins.
      origin: process.env.NODE_ENV === 'production'
        ? [FRONTEND_URL]
        : [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const app = createApp(io);
  httpServer.on('request', app);

  setupSockets(io);

  await prisma.$connect();
  console.log('Database connected');

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    httpServer.close();
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
