import { STATUS_CONFIG } from '../lib/constants';
import { QueueStatus } from '../types/customer';

interface StatusBadgeProps {
  status: QueueStatus;
}

/** Small coloured pill communicating a customer's current status. */
export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, badgeClass } = STATUS_CONFIG[status];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>{label}</span>
  );
}
