/** Placeholder rows shown while the initial queue request is in flight. */
export function QueueSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
        >
          <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="h-2 w-1/5 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-7 w-16 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
