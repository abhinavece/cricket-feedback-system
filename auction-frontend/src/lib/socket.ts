/**
 * Socket.IO client setup for auction real-time features.
 * Connects to the /auction namespace on the backend.
 */

import { io, Socket } from 'socket.io-client';
import { siteConfig } from './constants';

const SOCKET_URL = siteConfig.apiUrl;

export type AuctionRole = 'admin' | 'team' | 'spectator';

interface ConnectOptions {
  auctionId: string;
  token?: string;      // User JWT for admin auth
  teamToken?: string;  // Team JWT for team auth
}

let socket: Socket | null = null;

export function connectToAuction(options: ConnectOptions): Socket {
  // Disconnect existing connection if any
  if (socket?.connected) {
    socket.disconnect();
  }

  socket = io(`${SOCKET_URL}/auction`, {
    auth: {
      auctionId: options.auctionId,
      token: options.token,
      teamToken: options.teamToken,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to auction:', options.auctionId);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
