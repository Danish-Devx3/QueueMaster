import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { queueRouter } from './routes/queue.routes';

/**
 * Builds and configures the Express application (no network listening here).
 * Keeping app creation separate from `server.ts` makes the app importable in tests.
 */
export function createApp(): Application {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  // Liveness probe — handy for Docker/monitoring and a quick manual sanity check.
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/queue', queueRouter);

  // 404 then central error handler must be registered last.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
