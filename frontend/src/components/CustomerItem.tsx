import { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { CheckIcon, ClockIcon, PlayIcon, TrashIcon } from './icons';
import { formatElapsed } from '../lib/time';
import { Customer, QueueStatus } from '../types/customer';

interface CustomerItemProps {
  customer: Customer;
  /** 1-based position shown for waiting customers; omitted for other statuses. */
  position?: number;
  /** Current timestamp, supplied by the parent so the "waiting Xm" label stays fresh. */
  now: number;
  onUpdateStatus: (id: string, status: QueueStatus) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

/**
 * A single queue row: position + name + phone + time-in-queue + status, with the action buttons
 * relevant to the current status. Tracks its own in-flight state to disable buttons during a
 * request, and uses a two-step inline confirm for removal to prevent accidental deletes.
 */
export function CustomerItem({ customer, position, now, onUpdateStatus, onRemove }: CustomerItemProps) {
  const [pending, setPending] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setPending(true);
    try {
      await action();
    } finally {
      setPending(false);
    }
  };

  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300">
      {position !== undefined && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          {position}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-800">{customer.name}</p>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {customer.phone && <span className="truncate">{customer.phone}</span>}
          {customer.phone && customer.status !== 'completed' && <span>·</span>}
          {customer.status !== 'completed' && (
            <span className="inline-flex items-center gap-1">
              <ClockIcon width={12} height={12} />
              {formatElapsed(customer.createdAt, now)}
            </span>
          )}
        </div>
      </div>

      <StatusBadge status={customer.status} />

      <div className="flex shrink-0 items-center gap-2">
        {customer.status === 'waiting' && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => onUpdateStatus(customer.id, 'serving'))}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
          >
            <PlayIcon width={13} height={13} />
            Serve
          </button>
        )}

        {customer.status === 'serving' && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => onUpdateStatus(customer.id, 'completed'))}
            className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            <CheckIcon width={13} height={13} />
            Complete
          </button>
        )}

        {confirmingRemove ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => onRemove(customer.id))}
              className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmingRemove(false)}
              className="rounded-md px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            aria-label={`Remove ${customer.name}`}
            title="Remove"
            className="rounded-md border border-slate-200 p-1.5 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <TrashIcon width={15} height={15} />
          </button>
        )}
      </div>
    </li>
  );
}
