'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// ── Types ───────────────────────────────────────────────────
export interface OrderStatusUpdate {
  orderId: string;
  userId: string;
  previousStatus: string;
  status: string;
  updatedAt: string;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface UseOrderSyncReturn {
  /** Latest order status update received via WebSocket */
  latestUpdate: OrderStatusUpdate | null;
  /** Rolling log of all received updates (most recent first) */
  updates: OrderStatusUpdate[];
  /** Current WebSocket connection state */
  connectionState: ConnectionState;
  /** Human-readable error message, if any */
  error: string | null;
  /** Manually disconnect the socket */
  disconnect: () => void;
  /** Manually reconnect the socket */
  reconnect: () => void;
}

/**
 * useOrderSync
 *
 * Custom React hook that establishes a Socket.io connection to
 * the API Gateway's `/ws/v1` namespace, authenticates via JWT,
 * and listens for real-time `order_update` events.
 *
 * Usage:
 * ```tsx
 * const { latestUpdate, connectionState } = useOrderSync();
 * ```
 */
export function useOrderSync(): UseOrderSyncReturn {
  const socketRef = useRef<Socket | null>(null);
  const [latestUpdate, setLatestUpdate] = useState<OrderStatusUpdate | null>(null);
  const [updates, setUpdates] = useState<OrderStatusUpdate[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) {
      setConnectionState('disconnected');
      setError('No authentication token found');
      return;
    }

    // Tear down any existing connection
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    setConnectionState('connecting');
    setError(null);

    // Derive the WebSocket base URL from NEXT_PUBLIC_API_URL (e.g. http://api.cloudmart.local/api/v1)
    // URL.origin strips the path, giving us the bare origin: http://api.cloudmart.local
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const gatewayUrl = new URL(apiUrl, baseUrl).origin;

    const socket = io(`${gatewayUrl}/ws/v1`, {
      // Add this specific line to force the HTTP routing through your Ingress
      path: '/ws/socket.io/',
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    // ── Lifecycle events ──────────────────────────────────
    socket.on('connect', () => {
      console.log('[WS] Connected to gateway');
      setConnectionState('connected');
      setError(null);
    });

    socket.on('authenticated', (data: { userId: string; role: string }) => {
      console.log('[WS] Authenticated as', data.userId);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[WS] Disconnected:', reason);
      setConnectionState('disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('[WS] Connection error:', err.message);
      setConnectionState('error');
      setError(err.message);
    });

    socket.on('error', (payload: { message: string }) => {
      console.error('[WS] Server error:', payload.message);
      setConnectionState('error');
      setError(payload.message);
    });

    // ── Business event: order status update ────────────────
    socket.on('order_update', (data: OrderStatusUpdate) => {
      console.log('[WS] Order update received:', data);
      setLatestUpdate(data);
      setUpdates((prev) => [data, ...prev]);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnectionState('disconnected');
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    latestUpdate,
    updates,
    connectionState,
    error,
    disconnect,
    reconnect,
  };
}
