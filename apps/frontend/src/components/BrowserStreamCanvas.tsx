/**
 * Browser Stream Canvas Component
 *
 * Renders a live browser session stream on a canvas element
 */

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWebSocketUrl } from '../config/ports';

const BACKEND_URL = getWebSocketUrl();

interface BrowserStreamCanvasProps {
  sessionId: string;
  name: string;
  url: string;
  width: number;
  height: number;
  onStatusChange?: (status: string) => void;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export const BrowserStreamCanvas: React.FC<BrowserStreamCanvasProps> = ({
  sessionId,
  name,
  url,
  width,
  height,
  onStatusChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());

  useEffect(() => {
    console.log(`[BrowserStream] Initializing for session: ${sessionId}`);
    console.log(`[BrowserStream] Connecting to WebSocket: ${BACKEND_URL}`);

    // Create Socket.IO connection
    // Removed explicit transports to allow default negotiation (polling -> websocket)
    // This improves connectivity in restricted environments
    const socket = io(BACKEND_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[BrowserStream] Connected for ${sessionId}`);
      setStatus('connected');
      onStatusChange?.('connected');

      // Subscribe to this session's frames
      socket.emit('subscribe', { sessionId });
    });

    socket.on('disconnect', () => {
      console.log(`[BrowserStream] Disconnected for ${sessionId}`);
      setStatus('disconnected');
      onStatusChange?.('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error(`[BrowserStream] Connection error:`, error);
      setStatus('error');
      onStatusChange?.('error');
    });

    socket.on('frame', (data: any) => {
      if (data.sessionId !== sessionId) return;

      // Draw frame on canvas
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Update FPS
        frameCountRef.current++;
        const now = Date.now();
        if (now - lastFpsUpdateRef.current >= 1000) {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
          lastFpsUpdateRef.current = now;
        }
      };

      img.src = `data:image/jpeg;base64,${data.frame}`;
    });

    return () => {
      console.log(`[BrowserStream] Cleaning up ${sessionId}`);
      socket.emit('unsubscribe', { sessionId });
      socket.disconnect();
    };
  }, [sessionId, onStatusChange]);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full object-contain"
      />

      {/* Status Overlay */}
      <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs">
        <div
          className={`w-2 h-2 rounded-full ${getStatusColor()} ${status === 'connecting' ? 'animate-pulse' : ''}`}
        />
        <span className="text-white">{getStatusText()}</span>
        {status === 'connected' && fps > 0 && (
          <>
            <span className="text-gray-400">|</span>
            <span className="text-green-400">{fps} FPS</span>
          </>
        )}
      </div>

      {/* Error/Disconnected Message */}
      {(status === 'error' || status === 'disconnected') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
          <div className="text-red-400 text-4xl mb-2">⚠️</div>
          <div className="text-lg font-medium mb-1">
            {status === 'error' ? 'Stream Error' : 'Stream Disconnected'}
          </div>
          <div className="text-sm text-gray-400 text-center max-w-md">
            {status === 'error'
              ? 'Unable to connect to browser session. Check backend connection.'
              : 'Connection to browser session lost. Attempting to reconnect...'}
          </div>
          <div className="text-xs text-gray-600 mt-2 font-mono">
            {BACKEND_URL}
          </div>
        </div>
      )}

      {/* Loading State */}
      {status === 'connecting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-3" />
          <div className="text-sm">Connecting to {name}...</div>
        </div>
      )}
    </div>
  );
};
