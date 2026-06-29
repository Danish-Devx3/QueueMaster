import { CustomerItem } from './CustomerItem';
import { EmptyState } from './EmptyState';
import { STATUS_CONFIG } from '../lib/constants';
import { Customer, QueueStatus } from '../types/customer';

interface QueueSectionProps {
  status: QueueStatus;
  customers: Customer[];
  now: number;
  onUpdateStatus: (id: string, status: QueueStatus) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

/**
 * One status group (e.g. "Waiting"): a heading with a live count and the matching customer rows.
 * Waiting customers get a 1-based position number; other statuses do not.
 */
export function QueueSection({ status, customers, now, onUpdateStatus, onRemove }: QueueSectionProps) {
  const { sectionTitle } = STATUS_CONFIG[status];

  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {sectionTitle}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {customers.length}
        </span>
      </h2>

      {customers.length === 0 ? (
        <EmptyState message={`No ${sectionTitle.toLowerCase()} customers.`} compact />
      ) : (
        <ul className="flex flex-col gap-2">
          {customers.map((customer, index) => (
            <CustomerItem
              key={customer.id}
              customer={customer}
              position={status === 'waiting' ? index + 1 : undefined}
              now={now}
              onUpdateStatus={onUpdateStatus}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
