/**
 * Frontend mirror of the backend domain model. Kept in sync manually for this 1-hour build;
 * the README notes extracting a shared package (or generating types) as a future improvement.
 */
export type QueueStatus = 'waiting' | 'serving' | 'completed';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  status: QueueStatus;
  createdAt: string;
  updatedAt: string;
}
