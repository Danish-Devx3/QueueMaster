import { useMemo } from 'react';
import { QueueSection } from './QueueSection';
import { QueueSkeleton } from './QueueSkeleton';
import { EmptyState } from './EmptyState';
import { useNow } from '../hooks/useNow';
import { SECTION_ORDER } from '../lib/constants';
import { Customer, QueueStatus } from '../types/customer';

interface QueueListProps {
  customers: Customer[];
  loading: boolean;
  onUpdateStatus: (id: string, status: QueueStatus) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

/**
 * Renders the queue as status sections (Being Served -> Waiting -> Completed). Groups the flat
 * customer list by status once via useMemo; ordering within each group is preserved (the API
 * returns FIFO order). Owns the shared "now" ticker that keeps time-in-queue labels fresh.
 */
export function QueueList({ customers, loading, onUpdateStatus, onRemove }: QueueListProps) {
  const now = useNow();

  const grouped = useMemo(() => {
    const groups: Record<QueueStatus, Customer[]> = { serving: [], waiting: [], completed: [] };
    for (const customer of customers) {
      groups[customer.status].push(customer);
    }
    return groups;
  }, [customers]);

  if (loading) {
    return <QueueSkeleton />;
  }

  if (customers.length === 0) {
    return <EmptyState message="The queue is empty. Add your first customer above." />;
  }

  return (
    <div className="flex flex-col gap-6">
      {SECTION_ORDER.map((status) => (
        <QueueSection
          key={status}
          status={status}
          customers={grouped[status]}
          now={now}
          onUpdateStatus={onUpdateStatus}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
