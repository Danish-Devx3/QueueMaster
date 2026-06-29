import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../lib/constants';

/** Event the server emits with the full, current queue snapshot. */
export const QUEUE_UPDATED_EVENT = 'queue:updated';

/**
 * Single shared Socket.IO connection for the app. Created lazily so a module import never opens a
 * socket as a side effect, and reused across re-renders/components. socket.io-client handles
 * automatic reconnection with backoff out of the box.
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

/**
 * Subscribe to connection state changes. Invokes `onChange` immediately with the current state,
 * then on every connect/disconnect, and returns an unsubscribe function for cleanup.
 */
export function onConnectionChange(onChange: (connected: boolean) => void): () => void {
  const s = getSocket();
  const handleConnect = () => onChange(true);
  const handleDisconnect = () => onChange(false);

  s.on('connect', handleConnect);
  s.on('disconnect', handleDisconnect);
  onChange(s.connected);

  return () => {
    s.off('connect', handleConnect);
    s.off('disconnect', handleDisconnect);
  };
}
