import { useCallback, useEffect, useRef } from 'react';
import { webSocketService } from '../services/websocket';
import { useAuth } from './useAuth';

interface WebSocketOptions {
  onConnected?: () => void;
  onDisconnected?: (event?: CloseEvent) => void;
  onError?: (error: Error | Event) => void;
  onReconnectAttempt?: (attempt: number) => void;
  onMaxReconnectAttempts?: () => void;
  autoReconnect?: boolean;
}

interface UseWebSocketReturn {
  subscribe: <T = any>(event: string, handler: (data: T) => void) => () => void;
  send: <T = any>(type: string, payload?: T) => Promise<void>;
  disconnect: () => void;
}

export function useWebSocket(options: WebSocketOptions = {}): UseWebSocketReturn {
  const { user } = useAuth();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const subscribe = useCallback(<T = any>(event: string, handler: (data: T) => void) => {
    webSocketService.on(event, handler);
    return () => {
      webSocketService.off(event, handler);
    };
  }, []);

  const send = useCallback(<T = any>(type: string, payload?: T) => {
    try {
      webSocketService.send(type, payload);
      return Promise.resolve();
    } catch (error) {
      optionsRef.current.onError?.(error as Error);
      return Promise.reject(error);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const handleConnect = (): void => {
      optionsRef.current.onConnected?.();
    };

    const handleDisconnect = (event: CloseEvent): void => {
      optionsRef.current.onDisconnected?.(event);
    };

    const handleError = (error: Error | Event): void => {
      optionsRef.current.onError?.(error);
    };

    // Note: The websocket.ts service emits these specific event names
    webSocketService.on('connected', handleConnect);
    webSocketService.on('connection_closed', handleDisconnect);
    webSocketService.on('connection_error', handleError);

    return () => {
      webSocketService.off('connected', handleConnect);
      webSocketService.off('connection_closed', handleDisconnect);
      webSocketService.off('connection_error', handleError);

      // We don't automatically disconnect here because the service is a singleton
      // and other components might still be using it.
    };
  }, [user]);

  return {
    subscribe,
    send,
    disconnect: () => {
      // Manual disconnect is currently not exposed via a public method on the singleton
      // but can be implemented if needed.
    },
  };
}
