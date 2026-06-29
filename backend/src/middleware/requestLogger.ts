import { NextFunction, Request, Response } from 'express';

/**
 * Minimal, dependency-free request logger. Logs method, path, status code and duration once the
 * response finishes — enough for local visibility without pulling in a logging library.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
  });
  next();
}
