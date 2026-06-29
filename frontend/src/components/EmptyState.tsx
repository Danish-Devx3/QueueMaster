import { UsersIcon } from './icons';

interface EmptyStateProps {
  message: string;
  /** Compact variant for per-section emptiness (no icon, tighter padding). */
  compact?: boolean;
}

/** Neutral placeholder shown when a section (or the whole queue) has no customers. */
export function EmptyState({ message, compact = false }: EmptyStateProps) {
  if (compact) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-400">
        {message}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <UsersIcon width={22} height={22} />
      </span>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
