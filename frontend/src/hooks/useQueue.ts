import { useCallback, useEffect, useState } from 'react';
import { ApiError, queueApi } from '../services/api';
import { QUEUE_UPDATED_EVENT, getSocket, onConnectionChange } from '../services/socket';
import { Customer, QueueStatus } from '../types/customer';

interface UseQueueResult {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  /** Live WebSocket connection state, surfaced to the UI as a status indicator. */
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
 *   2. A Socket.IO subscription keeps the list live: the server broadcasts the full queue after
 *      every mutation, so this hook just replaces local state with each snapshot. Every browser
 *      tab/device therefore stays in sync, and even the acting client updates via the same path —
 *      no optimistic/merge logic to get wrong.
 *   3. Action methods issue REST commands; success is reflected by the broadcast above. As a
 *      safety net, if the socket is disconnected we refetch after a mutation, and we always
 *      refetch on (re)connect so the UI self-heals after a network blip.
 */
export function useQueue(): UseQueueResult {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const reportError = useCallback((err: unknown, fallback: string) => {
    setError(err instanceof ApiError ? err.message : fallback);
  }, []);

  const refetch = useCallback(async () => {
    try {
      const data = await queueApi.list();
      setCustomers(data);
    } catch (err) {
      reportError(err, 'Failed to load the queue.');
    }
  }, [reportError]);

  // Initial load + live socket subscription (queue updates + connection state).
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

    const socket = getSocket();
    const handleUpdate = (data: Customer[]) => setCustomers(data);
    socket.on(QUEUE_UPDATED_EVENT, handleUpdate);

    // Track connectivity and resync whenever the socket (re)connects.
    const unsubscribe = onConnectionChange((isConnected) => {
      setConnected(isConnected);
      if (isConnected) void refetch();
    });

    return () => {
      active = false;
      socket.off(QUEUE_UPDATED_EVENT, handleUpdate);
      unsubscribe();
    };
  }, [reportError, refetch]);

  /** Run a mutation, surface errors, and refetch as a fallback when the socket can't push. */
  const runMutation = useCallback(
    async (action: () => Promise<unknown>, fallbackMessage: string): Promise<boolean> => {
      try {
        await action();
        setError(null);
        if (!getSocket().connected) await refetch();
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
