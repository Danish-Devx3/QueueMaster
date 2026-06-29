/**
 * Domain types shared across the backend.
 * Kept dependency-free so services, controllers and sockets all reference one source of truth.
 */

/** Lifecycle of a customer in the queue: waiting -> serving -> completed. */
export type QueueStatus = 'waiting' | 'serving' | 'completed';

/** All valid statuses, used for runtime validation of PATCH payloads. */
export const QUEUE_STATUSES: readonly QueueStatus[] = ['waiting', 'serving', 'completed'];

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  status: QueueStatus;
  /** ISO timestamp — also the FIFO ordering key. */
  createdAt: string;
  updatedAt: string;
}

/** Payload accepted when adding a customer to the queue. */
export interface CreateCustomerInput {
  name: string;
  phone?: string;
}

/** Payload accepted when updating a customer (currently status-only). */
export interface UpdateCustomerInput {
  status: QueueStatus;
}
