import { createContext } from 'react';

export interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);
