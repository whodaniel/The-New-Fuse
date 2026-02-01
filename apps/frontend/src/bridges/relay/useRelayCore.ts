import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ConnectionState,
  SubscriptionHandle,
  createConnectedState,
  createConnectingState,
  createConnectionErrorState,
  createInitialConnectionState,
  createSubscriptionHandle,
} from '../types/BridgeCommon';

export interface RelayMessage {
  type: string;
  source?: string;
  target?: string;
  payload: any;
  id?: string;
  timestamp?: string;
}

export interface UseRelayCoreReturn {
  connectionState: ConnectionState;
  sendMessage: (type: string, payload: unknown) => Promise<void>;
  subscribeToMessages: (
    filter: { messageType: string[] },
    callback: (message: RelayMessage) => void
  ) => SubscriptionHandle;
  connect: () => Promise<void>;
  disconnect: () => void;
  // Expose the raw socket for advanced use cases if needed
  socketRef: React.MutableRefObject<WebSocket | null>;
}

/**
 * Real implementation of the Relay Bridge hook.
 * Connects to the backend WebSocket server defined in VITE_WS_URL or port 3001.
 */
export function useRelayCore(): UseRelayCoreReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    createInitialConnectionState()
  );

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<
    Map<string, { filter: { messageType: string[] }; callback: (msg: RelayMessage) => void }>
  >(new Map());

  // Determine WebSocket URL
  const getWsUrl = () => {
    // Priority: Env Var -> Defaults
    // Note: Vite env vars are exposed via import.meta.env
    const url = import.meta.env.VITE_WS_URL || 'ws://localhost:3011';
    return url;
  };

  const connect = useCallback(async () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState(createConnectingState(reconnectAttemptsRef.current));

    // Cleanup existing socket
    if (socketRef.current) {
      socketRef.current.close();
    }

    const wsUrl = getWsUrl();
    console.log(`[RelayBridge] Connecting to ${wsUrl}...`);

    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('[RelayBridge] Connected');
        setConnectionState(createConnectedState(0)); // Latency measured via ping/pong later
        reconnectAttemptsRef.current = 0;

        // Start heartbeat / latency check if needed
        // Ideally, we listen for server pings or send our own
      };

      socket.onclose = (event) => {
        console.log('[RelayBridge] Disconnected', event.code, event.reason);
        setConnectionState(createInitialConnectionState());
        socketRef.current = null;

        // Auto-reconnect logic could go here
        // For now, we leave it manual or simple backoff
        if (reconnectAttemptsRef.current < 5) {
          const timeout = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 10000);
          reconnectAttemptsRef.current++;
          setTimeout(connect, timeout);
        }
      };

      socket.onerror = (error) => {
        console.error('[RelayBridge] Error:', error);
        setConnectionState(createConnectionErrorState(new Error('WebSocket connection failed')));
      };

      socket.onmessage = (event) => {
        try {
          const message: RelayMessage = JSON.parse(event.data);

          // Handle system messages (Welcome, Pong, etc.)
          if (message.type === 'WELCOME') {
            console.log('[RelayBridge] Registered with ID:', message.payload.clientId);
          }

          // Dispatch to subscribers
          subscriptionsRef.current.forEach((sub) => {
            if (
              sub.filter.messageType.includes(message.type) ||
              sub.filter.messageType.includes('*')
            ) {
              sub.callback(message);
            }
          });
        } catch (e) {
          console.error('[RelayBridge] Failed to parse message', e);
        }
      };
    } catch (e) {
      console.error('[RelayBridge] Connection failed immediately', e);
      setConnectionState(
        createConnectionErrorState(e instanceof Error ? e : new Error('Unknown error'))
      );
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setConnectionState(createInitialConnectionState());
  }, []);

  const sendMessage = useCallback(async (type: string, payload: unknown) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[RelayBridge] Cannot send message: Not connected');
      // Optional: Queue messages?
      return;
    }

    const message: RelayMessage = {
      type,
      payload,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    socketRef.current.send(JSON.stringify(message));
  }, []);

  const subscribeToMessages = useCallback(
    (
      filter: { messageType: string[] },
      callback: (message: RelayMessage) => void
    ): SubscriptionHandle => {
      const id = crypto.randomUUID();
      subscriptionsRef.current.set(id, { filter, callback });

      return createSubscriptionHandle(id, () => {
        subscriptionsRef.current.delete(id);
      });
    },
    []
  );

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionState,
    sendMessage,
    subscribeToMessages,
    connect,
    disconnect,
    socketRef,
  };
}
