import { useMemo } from 'react';
import { QueueSection } from './QueueSection';
import { EmptyState } from './EmptyState';
import { SECTION_ORDER } from '../lib/constants';
import { Customer, QueueStatus } from '../types/customer';

interface QueueListProps {
  customers: Customer[];
  loading: boolean;
  onUpdateStatus: (id: string, status: QueueStatus) => void;
  onRemove: (id: string) => void;
}

/**
 * Renders the queue as status sections (Being Served -> Waiting -> Completed). Groups the flat
 * customer list by status once via useMemo; ordering within each group is preserved (the API
 * returns FIFO order).
 */
export function QueueList({ customers, loading, onUpdateStatus, onRemove }: QueueListProps) {
  const grouped = useMemo(() => {
    const groups: Record<QueueStatus, Customer[]> = { serving: [], waiting: [], completed: [] };
    for (const customer of customers) {
      groups[customer.status].push(customer);
    }
    return groups;
  }, [customers]);

  if (loading) {
    return <EmptyState message="Loading queue…" />;
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
          onUpdateStatus={onUpdateStatus}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
