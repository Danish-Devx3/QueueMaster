import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, queueApi } from '../services/api';
import { openQueueStream } from '../services/stream';
import { Customer, QueueStatus } from '../types/customer';

interface UseQueueResult {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  /** Live SSE connection state, surfaced to the UI as a status indicator. */
  connected: boolean;
  clearError: () => void;
  addCustomer: (input: { name: string; phone?: string }) => Promise<boolean>;
  updateStatus: (id: string, status: QueueStatus) => Promise<void>;
  removeCustomer: (id: string) => Promise<void>;
}

/**
 * Single owner of all queue state — the only place in the app that talks to the network.
 *
 * Data flow:
 *   1. Initial REST GET populates the list (with loading + error handling).
 *   2. A Server-Sent Events stream keeps the list live: the server pushes the full queue on
 *      connect and after every mutation, so this hook just replaces local state with each
 *      snapshot. Because the server re-sends a snapshot on every (re)connection, reconnects
 *      self-heal automatically — no manual resync needed.
 *   3. Action methods issue REST commands; success is reflected by the stream above. As a safety
 *      net, if the stream is currently disconnected we refetch after a mutation.
 */
export function useQueue(): UseQueueResult {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  // Mirror of `connected` readable synchronously inside callbacks without re-creating them.
  const connectedRef = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const reportError = useCallback((err: unknown, fallback: string) => {
    setError(err instanceof ApiError ? err.message : fallback);
  }, []);

  const refetch = useCallback(async () => {
    try {
      setCustomers(await queueApi.list());
    } catch (err) {
      reportError(err, 'Failed to load the queue.');
    }
  }, [reportError]);

  // Initial load + live SSE subscription (queue updates + connection state).
  useEffect(() => {
    let active = true;

    queueApi
      .list()
      .then((data) => {
        if (active) setCustomers(data);
      })
      .catch((err) => {
        if (active) reportError(err, 'Failed to load the queue.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const stream = openQueueStream({
      onQueue: (data) => setCustomers(data),
      onConnectionChange: (isConnected) => {
        connectedRef.current = isConnected;
        setConnected(isConnected);
      },
    });

    return () => {
      active = false;
      stream.close();
    };
  }, [reportError]);

  /** Run a mutation, surface errors, and refetch as a fallback when the stream can't push. */
  const runMutation = useCallback(
    async (action: () => Promise<unknown>, fallbackMessage: string): Promise<boolean> => {
      try {
        await action();
        setError(null);
        if (!connectedRef.current) await refetch();
        return true;
      } catch (err) {
        reportError(err, fallbackMessage);
        return false;
      }
    },
    [refetch, reportError],
  );

  const addCustomer = useCallback(
    (input: { name: string; phone?: string }) =>
      runMutation(() => queueApi.add(input), 'Failed to add customer.'),
    [runMutation],
  );

  const updateStatus = useCallback(
    async (id: string, status: QueueStatus) => {
      await runMutation(() => queueApi.updateStatus(id, status), 'Failed to update customer.');
    },
    [runMutation],
  );

  const removeCustomer = useCallback(
    async (id: string) => {
      await runMutation(() => queueApi.remove(id), 'Failed to remove customer.');
    },
    [runMutation],
  );

  return {
    customers,
    loading,
    error,
    connected,
    clearError,
    addCustomer,
    updateStatus,
    removeCustomer,
  };
}
