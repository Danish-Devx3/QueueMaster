import { StatusBadge } from './StatusBadge';
import { Customer, QueueStatus } from '../types/customer';

interface CustomerItemProps {
  customer: Customer;
  /** 1-based position shown for waiting customers; omitted for other statuses. */
  position?: number;
  onUpdateStatus: (id: string, status: QueueStatus) => void;
  onRemove: (id: string) => void;
}

/**
 * A single queue row: position + name + phone + status, with the action buttons relevant to the
 * customer's current status (waiting -> Serve, serving -> Complete, plus Remove everywhere).
 */
export function CustomerItem({ customer, position, onUpdateStatus, onRemove }: CustomerItemProps) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      {position !== undefined && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          {position}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-800">{customer.name}</p>
        {customer.phone && <p className="truncate text-xs text-slate-400">{customer.phone}</p>}
      </div>

      <StatusBadge status={customer.status} />

      <div className="flex shrink-0 items-center gap-2">
        {customer.status === 'waiting' && (
          <button
            type="button"
            onClick={() => onUpdateStatus(customer.id, 'serving')}
            className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-600"
          >
            Serve
          </button>
        )}

        {customer.status === 'serving' && (
          <button
            type="button"
            onClick={() => onUpdateStatus(customer.id, 'completed')}
            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
          >
            Complete
          </button>
        )}

        <button
          type="button"
          onClick={() => onRemove(customer.id)}
          aria-label={`Remove ${customer.name}`}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          Remove
        </button>
      </div>
    </li>
  );
}
