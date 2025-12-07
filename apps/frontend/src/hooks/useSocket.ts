import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../providers/AuthProvider';

interface SocketWithEvents extends Socket {
  emit: (event: string, data?: unknown) => Socket;
  on: (event: string, callback: (...args: unknown[]) => void) => Socket;
  off: (event: string, callback?: (...args: unknown[]) => void) => Socket;
}

// Null socket for when not connected
const nullSocket: SocketWithEvents = {
  emit: () => nullSocket,
  on: () => nullSocket,
  off: () => nullSocket,
} as SocketWithEvents;

export const useSocket = (): SocketWithEvents => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.VITE_API_URL || 'http://localhost:3000', {
        query: { userId: user.id },
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  return socket || nullSocket;
};

export default useSocket;
