// @ts-nocheck
import { useEffect, useRef, useState } from 'react';

/**
 * Live View Page - Shows real-time AI browser activity from the Cloud Sandbox
 * This page connects to the TNF Cloud Sandbox WebSocket to display live screenshots
 * and activity logs as AI agents interact with the browser.
 */
export default function LiveViewPage() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [logs, setLogs] = useState<Array<{ time: string; action: string; details?: string }>>([]);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cloud Sandbox URL - this should match your Railway deployment
  const CLOUD_SANDBOX_URL = 'https://tnf-cloud-sandbox-v2-production.up.railway.app';
  /**
   * IMPORTANT: We use Socket.IO with polling as the primary transport because
   * Railway's edge proxy often drops or fails to upgrade WebSocket connections directly.
   * This ensures a reliable connection is established.
   */

  const addLog = (action: string, details?: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ time, action, details }, ...prev.slice(0, 99)]);
  };

  const connect = async () => {
    // Dynamically import socket.io-client to avoid SSR issues if any
    const { io } = await import('socket.io-client');

    if (wsRef.current?.connected) return;

    addLog('System', `Connecting to Cloud Sandbox (Socket.IO)...`);
    setStatus('connecting');

    try {
      const socket = io(CLOUD_SANDBOX_URL, {
        path: '/socket.io/',
        // CRITICAL: Force polling to bypass Railway WebSocket handshake failures
        transports: ['polling'],
        upgrade: false, // Disable upgrade to WebSocket to avoid console errors
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      // Store socket instance in ref (casting to any to avoid strict type checks momentarily)
      wsRef.current = socket as any;

      socket.on('connect', () => {
        setStatus('connected');
        addLog('System', `Connected to Cloud Sandbox via ${socket.io.engine.transport.name}`);

        // Register as a monitor
        socket.emit('register_monitor', {
          id: 'web-viewer-' + Math.random().toString(36).substr(2, 9),
        });
      });

      socket.io.engine.on('upgrade', (transport) => {
        addLog('System', `Transport upgraded to ${transport.name}`);
      });

      socket.on('disconnect', (reason) => {
        setStatus('disconnected');
        addLog('System', `Disconnected: ${reason}`);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket error:', error);
        // Only log if we aren't already disconnected to avoid spam
        if (status !== 'disconnected') {
          addLog('Error', `Connection error: ${error.message}`);
        }
      });

      socket.on('screenshot', (data) => {
        if (data && data.image) {
          setScreenshot(data.image);
          addLog('Screenshot', `Updated from ${data.action || 'agent action'}`);
        }
      });

      socket.on('activity', (data) => {
        addLog('Activity', data.message || JSON.stringify(data));
      });
    } catch (error) {
      console.error('Connection setup error:', error);
      setStatus('disconnected');
      addLog('Error', 'Failed to setup connection');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        // Safe disconnection
        (wsRef.current as any).disconnect();
      }
    };
  }, []);

  const statusColors = {
    connecting: 'bg-yellow-500',
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
  };

  const statusLabels = {
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
          <div>
            <h1 className="text-2xl font-bold">AI Browser Live View</h1>
            <p className="text-gray-400 text-sm">Real-time view of AI agent browser activity</p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${statusColors[status]} ${status === 'connected' ? 'animate-pulse' : ''}`}
            />
            <span className="text-sm text-gray-300">{statusLabels[status]}</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Browser View */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-md overflow-hidden shadow-none border border-gray-700">
              <div className="bg-gray-700 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-gray-400 text-sm ml-2">AI Browser View</span>
              </div>
              <div className="aspect-video bg-black flex items-center justify-center">
                {screenshot ? (
                  <img
                    src={screenshot}
                    alt="Live Browser View"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 opacity-50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <p>Waiting for AI agent activity...</p>
                    <p className="text-sm mt-2 text-muted-foreground">
                      Screenshots will appear here when an AI interacts with the browser
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-md border border-gray-700 h-full flex flex-col">
              <div className="px-4 py-2 border-b border-gray-700">
                <h2 className="font-semibold">Activity Log</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[500px] font-mono text-sm">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-2">No activity yet</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="border-b border-gray-700/50 pb-2">
                      <span className="text-muted-foreground">{log.time}</span>
                      <span className="text-blue-400 ml-2 font-bold">{log.action}</span>
                      {log.details && <span className="text-gray-400 ml-2">{log.details}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-gray-800/50 rounded-md p-4 border border-gray-700">
          <h3 className="font-semibold mb-2">About Live View</h3>
          <p className="text-gray-400 text-sm">
            This page shows real-time screenshots of AI agents interacting with web browsers in the
            TNF Cloud Sandbox. When an agent navigates, clicks, types, or takes any browser action,
            a screenshot is captured and streamed here.
          </p>
        </div>
      </div>
    </div>
  );
}
