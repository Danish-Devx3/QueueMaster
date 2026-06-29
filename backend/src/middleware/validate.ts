import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { QUEUE_STATUSES, QueueStatus } from '../types/customer';

const MAX_NAME_LENGTH = 80;
const MAX_PHONE_LENGTH = 30;

/**
 * Validates the POST /api/queue body.
 * Lightweight, hand-rolled validation keeps the 1-hour build dependency-free; the README notes
 * Zod as the next step for schema validation shared with the frontend.
 */
export function validateCreateCustomer(req: Request, _res: Response, next: NextFunction): void {
  const { name, phone } = req.body ?? {};

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw AppError.badRequest('Customer name is required.', 'INVALID_NAME');
  }
  if (name.trim().length > MAX_NAME_LENGTH) {
    throw AppError.badRequest(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`, 'INVALID_NAME');
  }
  if (phone !== undefined && (typeof phone !== 'string' || phone.trim().length > MAX_PHONE_LENGTH)) {
    throw AppError.badRequest(`Phone must be ${MAX_PHONE_LENGTH} characters or fewer.`, 'INVALID_PHONE');
  }

  next();
}

/** Validates the PATCH /api/queue/:id body — status must be one of the known values. */
export function validateUpdateCustomer(req: Request, _res: Response, next: NextFunction): void {
  const { status } = req.body ?? {};

  if (!QUEUE_STATUSES.includes(status as QueueStatus)) {
    throw AppError.badRequest(
      `Status must be one of: ${QUEUE_STATUSES.join(', ')}.`,
      'INVALID_STATUS',
    );
  }

  next();
}
