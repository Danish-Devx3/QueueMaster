import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

/** Catch-all for unmatched routes — produces a consistent 404 JSON shape. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found.`, 'ROUTE_NOT_FOUND'));
}

/**
 * Central error handler. Translates AppError (and anything unexpected) into a uniform
 * `{ error: { message, code } }` response. Unknown errors are logged and reported as 500
 * without leaking internals to the client.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 4-arg signature marks this as Express' error handler
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message, code: err.code } });
    return;
  }

  console.error('[unhandled error]', err);
  res.status(500).json({
    error: { message: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
  });
}
