import { Request, Response } from 'express';
import { Server as IOServer } from 'socket.io';
import { queueService } from '../services/queue.service';
import { emitQueueUpdated } from '../sockets/realtime';
import { QUEUE_STATUSES, QueueStatus } from '../types/customer';
import { AppError } from '../utils/AppError';

/** Pull the shared Socket.IO instance stashed on the Express app in server.ts. */
function getIO(req: Request): IOServer {
  return req.app.get('io') as IOServer;
}

/** Broadcast the latest queue to all connected clients after a mutation. */
function broadcast(req: Request): void {
  emitQueueUpdated(getIO(req), queueService.list());
}

/** GET /api/queue — list customers (optionally filtered by ?status=). */
export async function listCustomers(req: Request, res: Response): Promise<void> {
  const status = req.query.status as string | undefined;
  if (status !== undefined && !QUEUE_STATUSES.includes(status as QueueStatus)) {
    throw AppError.badRequest(
      `Unknown status filter. Use one of: ${QUEUE_STATUSES.join(', ')}.`,
      'INVALID_STATUS_FILTER',
    );
  }
  res.json(queueService.list(status as QueueStatus | undefined));
}

/** POST /api/queue — add a customer to the back of the queue. */
export async function addCustomer(req: Request, res: Response): Promise<void> {
  const customer = queueService.add({ name: req.body.name, phone: req.body.phone });
  broadcast(req);
  res.status(201).json(customer);
}

/** PATCH /api/queue/:id — update a customer's status. */
export async function updateCustomer(req: Request, res: Response): Promise<void> {
  const customer = queueService.updateStatus(req.params.id, { status: req.body.status });
  broadcast(req);
  res.json(customer);
}

/** DELETE /api/queue/:id — remove a customer from the queue. */
export async function removeCustomer(req: Request, res: Response): Promise<void> {
  queueService.remove(req.params.id);
  broadcast(req);
  res.status(204).send();
}
