import { createContext } from 'react';
import * as WebSocket from 'ws';

export interface WebSocketContextType {
  connect: (url: string) => WebSocket;
  sendMessage: (message: string) => void;
  closeConnection: () => void;
}

// Create a WebSocketContext with default values
export const WebSocketContext = createContext<WebSocketContextType>({
  connect: (_url: string) => null as unknown as WebSocket,
  sendMessage: () => {},
  closeConnection: () => {}
});
