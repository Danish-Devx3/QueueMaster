import { useCallback, useEffect, useState } from 'react';
import { ApiError, queueApi } from '../services/api';
import { QUEUE_UPDATED_EVENT, getSocket } from '../services/socket';
import { Customer, QueueStatus } from '../types/customer';

interface UseQueueResult {
  customers: Customer[];
  loading: boolean;
  error: string | null;
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
 *      every mutation, so this hook just replaces local state with each snapshot. That means
 *      every browser tab/device stays in sync, and even the acting client updates via the same
 *      path — no optimistic/merge logic to get wrong.
 *   3. Action methods issue REST commands; success is reflected by the broadcast above, failures
 *      surface through `error`.
 */
export function useQueue(): UseQueueResult {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const reportError = useCallback((err: unknown, fallback: string) => {
    setError(err instanceof ApiError ? err.message : fallback);
  }, []);

  // Initial load + live socket subscription.
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

    return () => {
      active = false;
      socket.off(QUEUE_UPDATED_EVENT, handleUpdate);
    };
  }, [reportError]);

  const addCustomer = useCallback(
    async (input: { name: string; phone?: string }): Promise<boolean> => {
      try {
        await queueApi.add(input);
        setError(null);
        return true;
      } catch (err) {
        reportError(err, 'Failed to add customer.');
        return false;
      }
    },
    [reportError],
  );

  const updateStatus = useCallback(
    async (id: string, status: QueueStatus): Promise<void> => {
      try {
        await queueApi.updateStatus(id, status);
        setError(null);
      } catch (err) {
        reportError(err, 'Failed to update customer.');
      }
    },
    [reportError],
  );

  const removeCustomer = useCallback(
    async (id: string): Promise<void> => {
      try {
        await queueApi.remove(id);
        setError(null);
      } catch (err) {
        reportError(err, 'Failed to remove customer.');
      }
    },
    [reportError],
  );

  return { customers, loading, error, clearError, addCustomer, updateStatus, removeCustomer };
}
