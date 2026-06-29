interface ConnectionStatusProps {
  connected: boolean;
}

/**
 * Small live indicator for the SSE connection. Reassures the operator that the queue is
 * updating in real time — and makes it obvious when it isn't.
 */
export function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        connected ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
      }`}
      title={connected ? 'Real-time updates active' : 'Reconnecting…'}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          connected ? 'animate-pulse bg-green-500' : 'bg-slate-400'
        }`}
      />
      {connected ? 'Live' : 'Offline'}
    </span>
  );
}
