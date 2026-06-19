import { Router } from 'express';
import { Server as SocketServer } from 'socket.io';
import { createRoomsController } from './rooms.controller';

export function createRoomsRouter(io: SocketServer): Router {
  const router = Router();
  const ctrl = createRoomsController(io);

  router.post('/', ctrl.createRoom);
  router.post('/:code/join', ctrl.joinRoom);
  router.get('/:code', ctrl.getRoom);
  router.post('/:code/reveal-open', ctrl.revealOpen);
  router.post('/:code/reveal-me', ctrl.revealMe);
  router.get('/:code/summary', ctrl.getSummaryHandler);

  return router;
}
