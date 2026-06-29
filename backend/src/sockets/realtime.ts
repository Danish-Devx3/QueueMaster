import { Server as HttpServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { env } from '../config/env';
import { Customer } from '../types/customer';
import { queueService } from '../services/queue.service';

/** Event name clients listen on to receive the full, up-to-date queue. */
export const QUEUE_UPDATED_EVENT = 'queue:updated';

/**
 * Creates and configures the Socket.IO server.
 * On connect, a client immediately receives the current queue snapshot so its first paint is
 * correct even before the REST fetch resolves.
 */
export function createSocketServer(httpServer: HttpServer): IOServer {
  const io = new IOServer(httpServer, {
    cors: { origin: env.corsOrigin, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    // Send the current snapshot immediately so a new client paints correct state at once.
    socket.emit(QUEUE_UPDATED_EVENT, queueService.list());
    console.log(`[socket] client connected (${io.engine.clientsCount} online)`);

    socket.on('disconnect', () => {
      console.log(`[socket] client disconnected (${io.engine.clientsCount} online)`);
    });
  });

  return io;
}

/**
 * Broadcasts the full current queue to every connected client.
 * Called by controllers after a successful mutation — the server is the single source of truth,
 * so every tab/device converges on the same state.
 */
export function emitQueueUpdated(io: IOServer, queue: Customer[]): void {
  io.emit(QUEUE_UPDATED_EVENT, queue);
}
