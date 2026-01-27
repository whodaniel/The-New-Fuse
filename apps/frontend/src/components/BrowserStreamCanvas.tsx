/**
 * Browser Stream Canvas
 *
 * Renders a live browser session stream from the backend
 * Uses canvas to display frames received via WebSocket
 */

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface BrowserStreamCanvasProps {
  sessionId: string;
  name: string;
  url: string;
  width?: number;
  height?: number;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

interface StreamFrame {
  sessionId: string;
  frame: string; // Base64 image
  timestamp: number;
  width: number;
  height: number;
}

export const BrowserStreamCanvas: React.FC<BrowserStreamCanvasProps> = ({
  sessionId,
  name,
  url,
  width = 800,
  height = 600,
  onStatusChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>(
    'connecting'
  );
  const [fps, setFps] = useState(0);
  const [lastFrameTime, setLastFrameTime] = useState(0);

  // Update status and notify parent
  const updateStatus = (newStatus: typeof status) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  useEffect(() => {
    // Get backend URL from env or default
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    // Connect to WebSocket
    const socket = io(`${backendUrl}/browser-streaming`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log(`[BrowserStream] Connected to ${sessionId}`);
      updateStatus('connected');

      // Subscribe to this session's stream
      socket.emit('subscribe', { sessionId });
    });

    socket.on('disconnect', () => {
      console.log(`[BrowserStream] Disconnected from ${sessionId}`);
      updateStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error(`[BrowserStream] Connection error:`, error);
      updateStatus('error');
    });

    // Frame handler
    socket.on('frame', (frameData: StreamFrame) => {
      if (frameData.sessionId !== sessionId) return;

      renderFrame(frameData);

      // Calculate FPS
      const now = Date.now();
      if (lastFrameTime > 0) {
        const frameDuration = now - lastFrameTime;
        const currentFps = 1000 / frameDuration;
        setFps(Math.round(currentFps * 10) / 10);
      }
      setLastFrameTime(now);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unsubscribe', { sessionId });
        socketRef.current.disconnect();
      }
    };
  }, [sessionId]);

  /**
   * Render a frame to the canvas
   */
  const renderFrame = (frameData: StreamFrame) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    img.src = `data:image/jpeg;base64,${frameData.frame}`;
  };

  /**
   * Send a command to the backend
   */
  const sendCommand = async (type: string, payload: any) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    try {
      const response = await fetch(
        `${backendUrl}/api/browser-streaming/sessions/${sessionId}/command`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, payload }),
        }
      );

      const result = await response.json();
      console.log('[BrowserStream] Command result:', result);
    } catch (error) {
      console.error('[BrowserStream] Command failed:', error);
    }
  };

  return (
    <div className="relative group">
      {/* Status Indicator */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full text-xs">
        <span
          className={`w-2 h-2 rounded-full ${
            status === 'connected'
              ? 'bg-green-500'
              : status === 'connecting'
                ? 'bg-yellow-500 animate-pulse'
                : status === 'error'
                  ? 'bg-red-500'
                  : 'bg-gray-500'
          }`}
        />
        <span className="text-white font-medium">
          {status === 'connected' ? `Live • ${fps} FPS` : status}
        </span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full border-0 bg-gray-900"
        style={{ imageRendering: 'auto' }}
      />

      {/* Loading Overlay */}
      {status !== 'connected' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          {status === 'connecting' && (
            <>
              <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-4" />
              <span className="text-white text-lg">Launching Browser...</span>
              <span className="text-gray-400 text-sm mt-2">{name}</span>
            </>
          )}
          {status === 'error' && (
            <>
              <span className="text-6xl mb-4">⚠️</span>
              <span className="text-red-400 text-lg font-medium">Stream Error</span>
              <span className="text-gray-400 text-sm mt-2">
                Unable to connect to browser session
              </span>
            </>
          )}
          {status === 'disconnected' && (
            <>
              <span className="text-6xl mb-4">🔌</span>
              <span className="text-yellow-400 text-lg font-medium">Disconnected</span>
              <span className="text-gray-400 text-sm mt-2">Reconnecting...</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
