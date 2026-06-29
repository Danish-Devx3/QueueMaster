import { API_BASE_URL } from '../lib/constants';
import { Customer } from '../types/customer';

/** Named SSE event carrying the full, current queue snapshot. */
export const QUEUE_UPDATED_EVENT = 'queue:updated';

interface QueueStreamHandlers {
  /** Called with the full queue on connect and after every server-side change. */
  onQueue: (customers: Customer[]) => void;
  /** Called when the live connection opens (true) or drops (false). */
  onConnectionChange: (connected: boolean) => void;
}

export interface QueueStream {
  close: () => void;
}

/**
 * Opens the Server-Sent Events stream to the backend.
 *
 * SSE is a great fit because the realtime channel is one-directional (server -> client). The native
 * `EventSource` handles reconnection automatically — and since the server re-sends a full snapshot
 * on every (re)connection, the client self-heals after a network blip with no extra code.
 */
export function openQueueStream({ onQueue, onConnectionChange }: QueueStreamHandlers): QueueStream {
  const source = new EventSource(`${API_BASE_URL}/api/queue/stream`);

  source.addEventListener('open', () => onConnectionChange(true));

  // Fires on disconnect; EventSource then retries on its own. Report the drop so the UI can react.
  source.addEventListener('error', () => onConnectionChange(false));

  source.addEventListener(QUEUE_UPDATED_EVENT, (event) => {
    try {
      onQueue(JSON.parse((event as MessageEvent).data) as Customer[]);
    } catch {
      // Ignore malformed frames rather than crashing the stream.
    }
  });

  return { close: () => source.close() };
}
