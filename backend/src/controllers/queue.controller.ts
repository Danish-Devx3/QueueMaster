import { Request, Response } from 'express';
import { queueService } from '../services/queue.service';
import { QUEUE_UPDATED_EVENT, formatEvent, sseHub } from '../realtime/sseHub';
import { QUEUE_STATUSES, QueueStatus } from '../types/customer';
import { AppError } from '../utils/AppError';

/** Push the latest queue to all connected SSE clients after a mutation. */
function broadcast(): void {
  sseHub.broadcastQueue(queueService.list());
}

/**
 * GET /api/queue/stream — Server-Sent Events stream.
 * Opens a long-lived `text/event-stream` response, sends the current queue snapshot immediately
 * (so reconnecting clients self-heal for free), then keeps the connection registered with the hub
 * until the client disconnects.
 */
export function streamQueue(req: Request, res: Response): void {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // disable proxy buffering (e.g. nginx) for immediate delivery
  });
  res.flushHeaders?.();

  // Initial snapshot to this client only.
  res.write(formatEvent(QUEUE_UPDATED_EVENT, queueService.list()));

  const deregister = sseHub.addClient(res);
  console.log(`[sse] client connected (${sseHub.clientCount} online)`);

  req.on('close', () => {
    deregister();
    console.log(`[sse] client disconnected (${sseHub.clientCount} online)`);
  });
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
  broadcast();
  res.status(201).json(customer);
}

/** PATCH /api/queue/:id — update a customer's status. */
export async function updateCustomer(req: Request, res: Response): Promise<void> {
  const customer = queueService.updateStatus(req.params.id, { status: req.body.status });
  broadcast();
  res.json(customer);
}

/** DELETE /api/queue/:id — remove a customer from the queue. */
export async function removeCustomer(req: Request, res: Response): Promise<void> {
  queueService.remove(req.params.id);
  broadcast();
  res.status(204).send();
}
