interface EmptyStateProps {
  message: string;
}

/** Neutral placeholder shown when a section (or the whole queue) has no customers. */
export function EmptyState({ message }: EmptyStateProps) {
  return (
    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
      {message}
    </p>
  );
}
