import { Response } from 'express';
import { Customer } from '../types/customer';

/** Named SSE event clients listen on to receive the full, up-to-date queue. */
export const QUEUE_UPDATED_EVENT = 'queue:updated';

/**
 * SseHub — the realtime fan-out layer (Server-Sent Events).
 *
 * The queue's realtime traffic is one-directional (server -> client): clients send commands over
 * REST, and the server pushes the full queue to everyone after each change. SSE fits that exactly,
 * so the hub just holds the open client responses and writes events to them. It's transport-only
 * and knows nothing about HTTP routing or business logic.
 */
class SseHub {
  private readonly clients = new Set<Response>();

  /** Register an open SSE response and return a cleanup function to deregister it. */
  addClient(res: Response): () => void {
    this.clients.add(res);
    return () => {
      this.clients.delete(res);
    };
  }

  /** Number of currently connected clients (handy for logging). */
  get clientCount(): number {
    return this.clients.size;
  }

  /** Push the current queue to every connected client. */
  broadcastQueue(queue: Customer[]): void {
    const frame = formatEvent(QUEUE_UPDATED_EVENT, queue);
    for (const res of this.clients) {
      res.write(frame);
    }
  }

  /** Send a keep-alive comment so idle connections (and proxies) stay open. */
  ping(): void {
    for (const res of this.clients) {
      res.write(': ping\n\n');
    }
  }

  /** End every stream — used during graceful shutdown. */
  closeAll(): void {
    for (const res of this.clients) {
      res.end();
    }
    this.clients.clear();
  }
}

/** Serialise a named SSE event with a JSON payload into the wire format. */
export function formatEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// Singleton so all requests share one set of subscribers (mirrors the queueService pattern).
export const sseHub = new SseHub();
