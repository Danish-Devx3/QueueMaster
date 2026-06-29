import { useEffect, useState } from 'react';

/**
 * Returns the current timestamp, refreshed on an interval so relative-time labels ("waiting 3m")
 * stay accurate without each component owning its own timer.
 */
export function useNow(intervalMs = 15000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
