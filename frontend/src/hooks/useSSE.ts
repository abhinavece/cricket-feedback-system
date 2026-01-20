import { useEffect, useRef, useCallback, useState } from 'react';

// Get API base URL from environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

interface SSEEvent {
  type: string;
  topic?: string;
  timestamp?: string;
  [key: string]: any;
}

interface UseSSEOptions {
  /** Topics to subscribe to (e.g., ['match:123', 'payments']) */
  subscriptions: string[];
  /** Callback when an event is received */
  onEvent: (event: SSEEvent) => void;
  /** Callback when connection is established */
  onConnect?: () => void;
  /** Callback when connection errors occur */
  onError?: (error: Event) => void;
  /** Whether to enable the SSE connection (default: true) */
  enabled?: boolean;
  /** Reconnection delay in ms (default: 5000) */
  reconnectDelay?: number;
}

interface UseSSEReturn {
  /** Whether the SSE connection is open */
  isConnected: boolean;
  /** Manually close the connection */
  close: () => void;
  /** Manually reconnect */
  reconnect: () => void;
  /** Connection status: 'connecting' | 'connected' | 'disconnected' | 'error' */
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

/**
 * React hook for Server-Sent Events (SSE) real-time updates
 *
 * @example
 * ```tsx
 * const { isConnected, status } = useSSE({
 *   subscriptions: [`match:${matchId}`],
 *   onEvent: (event) => {
 *     if (event.type === 'availability:update') {
 *       // Handle availability update
 *     }
 *   },
 *   onConnect: () => console.log('SSE connected'),
 *   onError: (error) => console.error('SSE error:', error)
 * });
 * ```
 */
export function useSSE({
  subscriptions,
  onEvent,
  onConnect,
  onError,
  enabled = true,
  reconnectDelay = 5000
}: UseSSEOptions): UseSSEReturn {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  // Memoize callbacks to prevent unnecessary reconnections
  const onEventRef = useRef(onEvent);
  const onConnectRef = useRef(onConnect);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const close = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const connect = useCallback(() => {
    // Don't connect if disabled or already connecting/connected
    if (!enabled) return;
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;
    if (eventSourceRef.current?.readyState === EventSource.CONNECTING) return;

    // Get auth token (stored as 'authToken' in this app)
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('SSE: No auth token found, skipping connection');
      setStatus('disconnected');
      return;
    }

    // Build SSE URL with subscriptions and token
    const baseUrl = API_BASE_URL.replace('/api', ''); // Remove /api suffix if present
    const url = new URL('/api/events', baseUrl || window.location.origin);
    url.searchParams.set('subscribe', subscriptions.join(','));
    url.searchParams.set('token', token);

    setStatus('connecting');
    // console.log(`📡 SSE: Connecting to ${url.pathname}...`);

    const eventSource = new EventSource(url.toString());

    eventSource.onopen = () => {
      // console.log('📡 SSE: Connected');
      setStatus('connected');
      onConnectRef.current?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent;

        // Ignore heartbeat events
        if (data.type === 'heartbeat') {
          return;
        }

        // Ignore connection confirmation (unless you want to handle it)
        if (data.type === 'connected') {
          // console.log(`📡 SSE: Client ID: ${data.clientId}`);
          return;
        }

        // Pass event to handler
        onEventRef.current(data);
      } catch (err) {
        console.error('📡 SSE: Failed to parse event:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('📡 SSE: Connection error', error);
      setStatus('error');
      onErrorRef.current?.(error);

      // Close current connection
      eventSource.close();
      eventSourceRef.current = null;

      // Attempt to reconnect after delay
      // console.log(`📡 SSE: Reconnecting in ${reconnectDelay / 1000}s...`);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, reconnectDelay);
    };

    eventSourceRef.current = eventSource;
  }, [enabled, subscriptions.join(','), reconnectDelay]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      close();
    };
  }, [enabled, connect, close]);

  const reconnect = useCallback(() => {
    close();
    connect();
  }, [close, connect]);

  return {
    isConnected: status === 'connected',
    status,
    close,
    reconnect
  };
}

export default useSSE;
