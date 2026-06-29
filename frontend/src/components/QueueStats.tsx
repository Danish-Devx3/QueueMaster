import { Customer } from '../types/customer';

interface QueueStatsProps {
  customers: Customer[];
}

const CARDS = [
  { key: 'waiting', label: 'Waiting', accent: 'text-blue-600' },
  { key: 'serving', label: 'Being Served', accent: 'text-amber-600' },
  { key: 'completed', label: 'Completed', accent: 'text-green-600' },
] as const;

/** At-a-glance count of customers in each status. */
export function QueueStats({ customers }: QueueStatsProps) {
  const counts = customers.reduce(
    (acc, c) => {
      acc[c.status] += 1;
      return acc;
    },
    { waiting: 0, serving: 0, completed: 0 },
  );

  return (
    <div className="grid grid-cols-3 gap-3">
      {CARDS.map(({ key, label, accent }) => (
        <div
          key={key}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm"
        >
          <p className={`text-2xl font-bold ${accent}`}>{counts[key]}</p>
          <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  );
}
