import { useEffect, useCallback, useRef } from 'react';
import { webSocketService } from '../services/websocket.service.js';
import { useSession } from '@your-org/security/react';

interface WebSocketOptions {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onReconnectAttempt?: (attempt: number) => void;
  onMaxReconnectAttempts?: () => void;
  autoReconnect?: boolean;
}

export function useWebSocket(options: WebSocketOptions = {}): any {
  const { session } = useSession();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const subscribe = useCallback((event: string, handler: (data: any) => void) => {
    webSocketService.on(event, handler);
    return () => {
      webSocketService.off(event, handler);
    };
  }, []);

  const send = useCallback((type: string, payload?: any) => {
    try {
      webSocketService.send(type, payload);
      return Promise.resolve();
    } catch (error) {
      optionsRef.current.onError?.(error as Error);
      return Promise.reject(error);
    }
  }, []);

  useEffect(() => {
    if (!session) return;

    const handleConnect = (): any => {
      optionsRef.current.onConnected?.();
    };

    const handleDisconnect = (): any => {
      optionsRef.current.onDisconnected?.();
    };

    const handleError = (error: Error): any => {
      optionsRef.current.onError?.(error);
    };

    const handleReconnectAttempt = (attempt: number): any => {
      optionsRef.current.onReconnectAttempt?.(attempt);
    };

    const handleMaxReconnectAttempts = (): any => {
      optionsRef.current.onMaxReconnectAttempts?.();
    };

    webSocketService.on('connected', handleConnect);
    webSocketService.on('disconnected', handleDisconnect);
    webSocketService.on('error', handleError);
    webSocketService.on('reconnect_attempt', handleReconnectAttempt);
    webSocketService.on('max_reconnect_attempts', handleMaxReconnectAttempts);

    webSocketService.connect().catch(handleError);

    return () => {
      webSocketService.off('connected', handleConnect);
      webSocketService.off('disconnected', handleDisconnect);
      webSocketService.off('error', handleError);
      webSocketService.off('reconnect_attempt', handleReconnectAttempt);
      webSocketService.off('max_reconnect_attempts', handleMaxReconnectAttempts);
      
      if (!optionsRef.current.autoReconnect) {
        webSocketService.disconnect();
      }
    };
  }, [session]);

  return {
    subscribe,
    send,
    disconnect: webSocketService.disconnect.bind(webSocketService)
  };
}
