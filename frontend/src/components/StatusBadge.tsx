import { STATUS_CONFIG } from '../lib/constants';
import { QueueStatus } from '../types/customer';

interface StatusBadgeProps {
  status: QueueStatus;
}

const DOT_CLASS: Record<QueueStatus, string> = {
  waiting: 'bg-blue-500',
  serving: 'bg-amber-500',
  completed: 'bg-green-500',
};

/** Small coloured pill (with a status dot) communicating a customer's current status. */
export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, badgeClass } = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[status]}`} />
      {label}
    </span>
  );
}
