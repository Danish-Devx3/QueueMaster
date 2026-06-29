import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { createSocketServer } from './sockets/realtime';

/**
 * Composition root: wire the Express app and Socket.IO onto a single HTTP server, expose the
 * `io` instance to controllers via `app.set('io', ...)`, and start listening.
 */
function bootstrap(): void {
  const app = createApp();
  const httpServer = createServer(app);
  const io = createSocketServer(httpServer);

  // Controllers reach the socket server through `req.app.get('io')`, avoiding a global import cycle.
  app.set('io', io);

  httpServer.listen(env.port, () => {
    console.log(`[QueueMaster] API + WebSocket listening on http://localhost:${env.port}`);
    console.log(`[QueueMaster] Allowing CORS origin: ${env.corsOrigin}`);
  });
}

bootstrap();
