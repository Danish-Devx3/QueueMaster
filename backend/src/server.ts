import { createApp } from './app';
import { env } from './config/env';
import { sseHub } from './realtime/sseHub';

/** Interval between SSE keep-alive pings (ms). */
const PING_INTERVAL_MS = 25000;

/**
 * Composition root: start the Express app, run a keep-alive ping for SSE clients, and wire up
 * graceful shutdown that closes open streams cleanly.
 */
function bootstrap(): void {
  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`[QueueMaster] API + SSE listening on http://localhost:${env.port}`);
    console.log(`[QueueMaster] Allowing CORS origin: ${env.corsOrigin}`);
  });

  // Keep idle SSE connections (and any proxies) from timing out.
  const pingTimer = setInterval(() => sseHub.ping(), PING_INTERVAL_MS);
  pingTimer.unref();

  // Graceful shutdown so `docker compose down` / Ctrl-C close streams cleanly.
  const shutdown = (signal: string) => {
    console.log(`\n[QueueMaster] ${signal} received — shutting down…`);
    clearInterval(pingTimer);
    sseHub.closeAll();
    server.close(() => {
      console.log('[QueueMaster] closed. Bye 👋');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
