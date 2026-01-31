import { useEffect, useRef, useState } from 'react';

export interface AGUIMessage {
  type: string;
  payload: any;
  agentId?: string;
  requestId?: string;
}

export const useAGUI = (url = 'ws://localhost:8765') => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<AGUIMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('[AG-UI] Connected to WebSocket');
      setConnected(true);

      // Identify as visualization client
      socket.send(
        JSON.stringify({
          type: 'client.identify',
          payload: { role: 'visualization-hub' },
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[AG-UI] Received:', message);
        setMessages((prev) => [...prev, message]);
      } catch (err) {
        console.error('[AG-UI] Error parsing message:', err);
      }
    };

    socket.onclose = () => {
      console.log('[AG-UI] Disconnected from WebSocket');
      setConnected(false);
    };

    socket.onerror = (error) => {
      console.error('[AG-UI] WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const sendMessage = (message: AGUIMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[AG-UI] Cannot send message, socket not open');
    }
  };

  return { connected, messages, sendMessage };
};
