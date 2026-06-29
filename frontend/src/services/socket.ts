import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../lib/constants';

/** Event the server emits with the full, current queue snapshot. */
export const QUEUE_UPDATED_EVENT = 'queue:updated';

/**
 * Single shared Socket.IO connection for the app. Created lazily so a module import never opens a
 * socket as a side effect, and reused across re-renders/components.
 */
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}
