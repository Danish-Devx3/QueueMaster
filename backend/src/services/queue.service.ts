import { randomUUID } from 'crypto';
import { AppError } from '../utils/AppError';
import {
  CreateCustomerInput,
  Customer,
  QueueStatus,
  UpdateCustomerInput,
} from '../types/customer';

/**
 * QueueService — the single source of truth for queue state and business rules.
 *
 * Storage is an in-memory Map keyed by customer id. The class exposes only domain operations
 * (list / add / updateStatus / remove) and never touches HTTP or sockets, so it stays pure and
 * trivially swappable for a database-backed repository later (see README "If I Had Another 3 Hours").
 */
class QueueService {
  private readonly customers = new Map<string, Customer>();

  /** Returns all customers in FIFO order (oldest first), optionally filtered by status. */
  list(status?: QueueStatus): Customer[] {
    const all = Array.from(this.customers.values()).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
    return status ? all.filter((c) => c.status === status) : all;
  }

  /** Adds a new waiting customer to the back of the queue. */
  add({ name, phone }: CreateCustomerInput): Customer {
    const now = new Date().toISOString();
    const customer: Customer = {
      id: randomUUID(),
      name: name.trim(),
      phone: phone?.trim() || undefined,
      status: 'waiting',
      createdAt: now,
      updatedAt: now,
    };
    this.customers.set(customer.id, customer);
    return customer;
  }

  /** Updates a customer's status. Throws 404 if the id is unknown. */
  updateStatus(id: string, { status }: UpdateCustomerInput): Customer {
    const customer = this.getOrThrow(id);
    const updated: Customer = {
      ...customer,
      status,
      updatedAt: new Date().toISOString(),
    };
    this.customers.set(id, updated);
    return updated;
  }

  /** Removes a customer from the queue. Throws 404 if the id is unknown. */
  remove(id: string): void {
    if (!this.customers.has(id)) {
      throw AppError.notFound(`Customer "${id}" not found.`, 'CUSTOMER_NOT_FOUND');
    }
    this.customers.delete(id);
  }

  private getOrThrow(id: string): Customer {
    const customer = this.customers.get(id);
    if (!customer) {
      throw AppError.notFound(`Customer "${id}" not found.`, 'CUSTOMER_NOT_FOUND');
    }
    return customer;
  }
}

// Exported as a singleton so all requests share one in-memory queue.
export const queueService = new QueueService();
