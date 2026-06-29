import { QueueStatus } from '../types/customer';

/** Base URL for the backend REST API + SSE stream. Baked at build time by Vite. */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/** Display config per status: section heading + colour classes for the badge. */
export const STATUS_CONFIG: Record<
  QueueStatus,
  { label: string; sectionTitle: string; badgeClass: string }
> = {
  serving: {
    label: 'Being Served',
    sectionTitle: 'Being Served',
    badgeClass: 'bg-amber-100 text-amber-800',
  },
  waiting: {
    label: 'Waiting',
    sectionTitle: 'Waiting',
    badgeClass: 'bg-blue-100 text-blue-800',
  },
  completed: {
    label: 'Completed',
    sectionTitle: 'Completed',
    badgeClass: 'bg-green-100 text-green-800',
  },
};

/** Order the status sections appear in the UI: active work first, history last. */
export const SECTION_ORDER: QueueStatus[] = ['serving', 'waiting', 'completed'];
