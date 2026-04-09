import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getWebSocketService,
  WebSocketEventType,
  WebSocketMessage,
} from '../services/WebSocketService';

export function useWebSocket() {
  const { isAuthenticated } = useAuth();
  const wsService = getWebSocketService();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !wsService.isConnected && !isConnectedRef.current) {
      isConnectedRef.current = true;
      wsService.connect().catch((error) => {
        console.warn('WebSocket connection failed:', error);
        isConnectedRef.current = false;
      });
    } else if (!isAuthenticated && wsService.isConnected) {
      wsService.disconnect();
      isConnectedRef.current = false;
    }

    return () => {
      // Don't disconnect on unmount, keep connection for the session
    };
  }, [isAuthenticated, wsService]);

  const subscribe = useCallback(
    (eventType: WebSocketEventType | '*', handler: (message: WebSocketMessage) => void) => {
      return wsService.subscribe(eventType as WebSocketEventType, handler);
    },
    [wsService]
  );

  const send = useCallback(
    (type: WebSocketEventType, payload: any) => {
      wsService.send(type, payload);
    },
    [wsService]
  );

  return {
    subscribe,
    send,
    isConnected: wsService.isConnected,
  };
}
