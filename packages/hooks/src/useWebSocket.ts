import { useContext } from 'react';
import { WebSocketContext } from './types/index.js';

export const useWebSocket = (): any => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};