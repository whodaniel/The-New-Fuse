import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from './useAuth.js';

interface WebSocketState {
  isConnected: boolean;
  isReconnecting: boolean;
  error: Error | null;
}

interface WebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  auth?: Record<string, any>;
}

const DEFAULT_OPTIONS: WebSocketOptions = {
  url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001",
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
};

export const useWebSocket = (options: WebSocketOptions = {}): {
  socket: Socket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  emit: <T = any>(event: string, data?: unknown, callback?: (response: T) => void) => void;
  on: <T = any>(event: string, callback: (data: T) => void) => void;
  off: (event: string, callback?: (data: unknown) => void) => void;
} => {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isReconnecting: false,
    error: null,
  });

  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const opts: WebSocketOptions = { ...DEFAULT_OPTIONS, ...options };

  // Initialize socket connection
  const initSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    const socket = io(opts.url!, {
      autoConnect: false,
      auth: {
        token: user?.token,
        ...opts.auth,
      },
      transports: ["websocket"],
      reconnection: false, // We'll handle reconnection manually
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
        error: null,
      }));
      reconnectAttemptsRef.current = 0;
    });

    socket.on("disconnect", (reason) => {
      setState((prev) => ({
        ...prev,
        isConnected: false,
      }));

      if (reason === "io server disconnect") {
        // Server initiated disconnect, don't reconnect
        return;
      }

      handleReconnect();
    });

    socket.on("connect_error", (error) => {
      setState((prev) => ({
        ...prev,
        error,
        isConnected: false,
      }));
      handleReconnect();
    });

    socket.on("error", (error) => {
      setState((prev) => ({
        ...prev,
        error,
      }));
    });

    if (opts.autoConnect) {
      socket.connect();
    }

    return socket;
  }, [opts.url, opts.autoConnect, opts.auth, user?.token]);

  // Handle reconnection
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= (opts.reconnectionAttempts || 5)) {
      setState((prev) => ({
        ...prev,
        error: new Error("Maximum reconnection attempts reached"),
        isReconnecting: false,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isReconnecting: true,
    }));

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      socketRef.current?.connect();
    }, opts.reconnectionDelay);
  }, [opts.reconnectionAttempts, opts.reconnectionDelay]);

  // Connect to the WebSocket
  const connect = useCallback(() => {
    socketRef.current?.connect();
  }, []);

  // Disconnect from the WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    socketRef.current?.disconnect();
  }, []);

  // Emit an event to the WebSocket
  const emit = useCallback(
    <T = any>(event: string, data?: unknown, callback?: (response: T) => void) => {
      if (!socketRef.current?.connected) {
        throw new Error("Socket not connected");
      }

      if (callback) {
        socketRef.current.emit(event, data, callback);
      } else {
        socketRef.current.emit(event, data);
      }
    },
    []
  );

  // Listen for an event from the WebSocket
  const on = useCallback(
    <T = any>(event: string, callback: (data: T) => void) => {
      socketRef.current?.on(event, callback);
      return () => {
        socketRef.current?.off(event, callback);
      };
    },
    []
  );

  // Stop listening for an event
  const off = useCallback((event: string, callback?: (data: unknown) => void) => {
    if (callback) {
      socketRef.current?.off(event, callback);
    } else {
      socketRef.current?.off(event);
    }
  }, []);

  // Initialize socket on mount and cleanup on unmount
  useEffect(() => {
    const socket = initSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socket.disconnect();
    };
  }, [initSocket]);

  return {
    socket: socketRef.current,
    ...state,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
};
