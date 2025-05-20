import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { Alert } from './ui/alert.js';
import { Button } from './ui/button.js';
import { useToast } from './ui/use-toast.js';

interface RealTimeConnectionProps {
  children: React.ReactNode;
  onConnectionChange?: (connected: boolean) => void;
}

export function RealTimeConnection({ children, onConnectionChange }: RealTimeConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'unknown'>('unknown');
  const { toast } = useToast();

  const { subscribe, send } = useWebSocket({
    onConnected: () => {
      setIsConnected(true);
      setHasError(false);
      setReconnectAttempt(0);
      setConnectionQuality('good');
      onConnectionChange?.(true);
      toast({
        title: 'Connected',
        description: 'Real-time connection established',
        variant: 'success'
      });
    },
    onDisconnected: () => {
      setIsConnected(false);
      setConnectionQuality('unknown');
      onConnectionChange?.(false);
      toast({
        title: 'Disconnected',
        description: 'Real-time connection lost',
        variant: 'warning'
      });
    },
    onError: (error) => {
      setHasError(true);
      setConnectionQuality('poor');
      toast({
        title: 'Connection Error',
        description: error.message,
        variant: 'destructive'
      });
    },
    onReconnectAttempt: (attempt) => {
      setReconnectAttempt(attempt);
      toast({
        title: 'Reconnecting',
        description: `Attempting to reconnect (${attempt}/5)`,
        variant: 'warning'
      });
    },
    onMaxReconnectAttempts: () => {
      setHasError(true);
      toast({
        title: 'Connection Failed',
        description: 'Maximum reconnection attempts reached',
        variant: 'destructive'
      });
    },
    autoReconnect: true
  });

  useEffect(() => {
    const unsubscribe = subscribe('session_error', () => {
      toast({
        title: 'Session Expired',
        description: 'Please log in again to continue',
        variant: 'destructive'
      });
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, toast]);

  // Monitor connection quality
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      const start = Date.now();
      send('ping').then(() => {
        const latency = Date.now() - start;
        setConnectionQuality(latency < 200 ? 'good' : 'poor');
      }).catch(() => {
        setConnectionQuality('poor');
      });
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected, send]);

  return (
    <>
      {hasError && (
        <Alert variant="destructive" className="mb-4">
          <p>Connection error occurred. Please check your internet connection.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Reload Page
          </Button>
        </Alert>
      )}
      
      {!isConnected && !hasError && reconnectAttempt > 0 && (
        <Alert variant="warning" className="mb-4">
          <p>Reconnecting to services... Attempt {reconnectAttempt}/5</p>
        </Alert>
      )}
      
      {!isConnected && !hasError && reconnectAttempt === 0 && (
        <Alert variant="warning" className="mb-4">
          <p>Connecting to real-time services...</p>
        </Alert>
      )}
      
      {isConnected && connectionQuality === 'poor' && (
        <Alert variant="warning" className="mb-4">
          <p>Poor connection quality detected. Some features may be delayed.</p>
        </Alert>
      )}
      
      {children}
    </>
  );
}