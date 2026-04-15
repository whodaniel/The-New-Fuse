// @ts-nocheck
import { BusinessEventType } from '@the-new-fuse/types';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface SSEConnectionOptions {
  eventTypes?: BusinessEventType[];
  filters?: Record<string, unknown>;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface SSEConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastEventTime: Date | null;
  error: string | null;
}

export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export function useSSEConnection(options: SSEConnectionOptions = {}) {
  const {
    eventTypes = [],
    filters = {},
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
  } = options;

  const [connectionState, setConnectionState] = useState<SSEConnectionState>({
    isConnected: false,
    isReconnecting: false,
    reconnectAttempts: 0,
    lastEventTime: null,
    error: null,
  });

  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<SSEEvent | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventListenersRef = useRef<Map<string, (event: SSEEvent) => void>>(new Map());

  const buildSSEUrl = useCallback(() => {
    const baseUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/webhooks/events/stream`;
    const params = new URLSearchParams();

    if (eventTypes.length > 0) {
      params.append('event_types', eventTypes.join(','));
    }

    if (Object.keys(filters).length > 0) {
      params.append('filters', JSON.stringify(filters));
    }

    return `${baseUrl}?${params.toString()}`;
  }, [eventTypes, filters]);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setConnectionState((prev) => ({
        ...prev,
        error: 'No authentication token available',
        isConnected: false,
      }));
      return;
    }

    try {
      const url = buildSSEUrl();
      const eventSource = new EventSource(url, {
        withCredentials: true,
      });

      // Set authorization header (note: EventSource doesn't support custom headers directly)
      // You may need to pass the token as a query parameter instead

      eventSource.onopen = () => {
        setConnectionState((prev) => ({
          ...prev,
          isConnected: true,
          isReconnecting: false,
          reconnectAttempts: 0,
          error: null,
        }));
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const sseEvent: SSEEvent = {
            type: data.type || 'message',
            data: data,
            timestamp: new Date(),
          };

          setEvents((prev) => [...prev.slice(-99), sseEvent]); // Keep last 100 events
          setLatestEvent(sseEvent);
          setConnectionState((prev) => ({
            ...prev,
            lastEventTime: new Date(),
          }));

          // Call any registered event listeners
          const listener = eventListenersRef.current.get(sseEvent.type);
          if (listener) {
            listener(sseEvent);
          }
        } catch (error) {
          console.error('Failed to parse SSE event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setConnectionState((prev) => ({
          ...prev,
          isConnected: false,
          error: 'Connection error occurred',
        }));

        if (autoReconnect && prev.reconnectAttempts < maxReconnectAttempts) {
          setConnectionState((prev) => ({
            ...prev,
            isReconnecting: true,
            reconnectAttempts: prev.reconnectAttempts + 1,
          }));

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      setConnectionState((prev) => ({
        ...prev,
        error: `Failed to establish connection: ${error}`,
        isConnected: false,
      }));
    }
  }, [buildSSEUrl, autoReconnect, maxReconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnectionState((prev) => ({
      ...prev,
      isConnected: false,
      isReconnecting: false,
    }));
  }, []);

  const addEventListener = useCallback((eventType: string, listener: (event: SSEEvent) => void) => {
    eventListenersRef.current.set(eventType, listener);

    return () => {
      eventListenersRef.current.delete(eventType);
    };
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLatestEvent(null);
  }, []);

  // Auto-connect on mount and when dependencies change
  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionState,
    events,
    latestEvent,
    connect,
    disconnect,
    addEventListener,
    clearEvents,
  };
}
