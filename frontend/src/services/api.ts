import { API_BASE_URL } from '../lib/constants';
import { Customer, QueueStatus } from '../types/customer';

/**
 * Thin REST client around `fetch`. Centralises the base URL, JSON handling and — crucially —
 * error normalisation, so every caller (the useQueue hook) gets a predictable `Error` with a
 * human-friendly message regardless of whether the failure was network, HTTP or parse.
 */

/** Error carrying the backend's machine-readable code when available. */
export class ApiError extends Error {
  readonly code: string;
  constructor(message: string, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    // Network-level failure (server down, DNS, CORS preflight blocked, etc.).
    throw new ApiError('Cannot reach the server. Is the backend running?', 'NETWORK_ERROR');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message ?? 'Request failed. Please try again.';
    const code = payload?.error?.code ?? 'HTTP_ERROR';
    throw new ApiError(message, code);
  }

  return payload as T;
}

export const queueApi = {
  list: () => request<Customer[]>('/api/queue'),

  add: (input: { name: string; phone?: string }) =>
    request<Customer>('/api/queue', { method: 'POST', body: JSON.stringify(input) }),

  updateStatus: (id: string, status: QueueStatus) =>
    request<Customer>(`/api/queue/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  remove: (id: string) => request<void>(`/api/queue/${id}`, { method: 'DELETE' }),
};
