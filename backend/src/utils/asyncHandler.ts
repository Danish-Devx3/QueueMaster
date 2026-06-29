import { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps an async controller so any thrown/rejected error is forwarded to Express'
 * error-handling middleware instead of crashing the process. Keeps controllers free of
 * repetitive try/catch boilerplate.
 */
export const asyncHandler =
  (handler: AsyncRouteHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
