/**
 * AI Command Center - Browser Streaming Edition
 *
 * Uses headless browser streaming instead of iframes to avoid X-Frame-Options blocking.
 * Includes Master Clock orchestration for synchronized multi-AI queries.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { BrowserStreamCanvas } from '../../components/BrowserStreamCanvas';
import { useBrowserStreaming } from '../../hooks/useBrowserStreaming';

interface AIEndpoint {
  id: string;
  name: string;
  url: string;
  models: string[];
  loginRequired: boolean;
  streamingEnabled: boolean;
}

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

const AI_ENDPOINTS: AIEndpoint[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/app',
    models: ['Gemini Advanced'],
    loginRequired: true,
    streamingEnabled: true,
  },
];

const AICommandCenterStreaming: React.FC = () => {
  const { sessions, loading, createSession, stopSession, broadcast } = useBrowserStreaming();

  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [orchestratorMessage, setOrchestratorMessage] = useState('');
  const [showOrchestratorPanel, setShowOrchestratorPanel] = useState(false);

  // Memory monitoring
  useEffect(() => {
    const updateMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryStats({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 2000);
    return () => clearInterval(interval);
  }, []);

  // Initialize browser sessions for all endpoints
  const initializeSessions = useCallback(async () => {
    for (const endpoint of AI_ENDPOINTS) {
      if (endpoint.streamingEnabled) {
        // Check if session already exists
        const existingSession = sessions.find((s) => s.id === endpoint.id);
        if (!existingSession) {
          try {
            console.log(`Initializing session for ${endpoint.name}`);
            await createSession(endpoint.id, endpoint.name, endpoint.url, 1280, 800);
          } catch (error) {
            console.error(`Failed to initialize ${endpoint.name}:`, error);
          }
        }
      }
    }
  }, [sessions, createSession]);

  // Initialize on mount
  useEffect(() => {
    initializeSessions();
  }, [initializeSessions]);

  // Master Clock: Broadcast message to all AI sessions
  const handleBroadcast = async () => {
    if (!orchestratorMessage.trim()) return;

    console.log(`📡 Master Clock: Broadcasting to all sessions`);
    try {
      await broadcast(orchestratorMessage);
      setOrchestratorMessage('');
      setShowOrchestratorPanel(false);
    } catch (error) {
      console.error('Broadcast failed:', error);
    }
  };

  const memoryPercentage = memoryStats
    ? (memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100
    : 0;

  const runningCount = sessions.filter((s) => s.status === 'running').length;

  return (
    <div className="min-h-screen bg-[#050510] text-slate-200 selection:bg-cyan-500/30 font-display">
      {/* Dynamic Background Noise/Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/5">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <span className="text-white text-xl">🎛️</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  AI Command<span className="text-cyan-400 underline decoration-cyan-400/30 underline-offset-4"> Center</span>
                </h1>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <div className={`w-2 h-2 rounded-full ${runningCount > 0 ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-600'}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {runningCount > 0 ? 'Engine Active' : 'System Idle'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-5">
              {/* Memory Monitor with stylized progress */}
              {memoryStats && (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Neural Heap Memory
                    <span className="text-slate-300">{Math.round(memoryPercentage)}%</span>
                  </div>
                  <div className="w-40 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full transition-all duration-1000 ease-out shadow-[0_0_10px] ${
                        memoryPercentage > 80
                          ? 'bg-red-500 shadow-red-500/50'
                          : memoryPercentage > 60
                            ? 'bg-amber-400 shadow-amber-400/50'
                            : 'bg-cyan-400 shadow-cyan-400/50'
                      }`}
                      style={{ width: `${memoryPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowOrchestratorPanel(!showOrchestratorPanel)}
                className={`relative px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                  showOrchestratorPanel
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                ⚡ Master Clock
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Orchestrator Panel */}
      {showOrchestratorPanel && (
        <div className="relative overflow-hidden bg-white/[0.02] border-b border-white/5 py-8 animate-in slide-in-from-top duration-500">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-500">Universal Broadcast</h2>
              <div className="relative group">
                <input
                  type="text"
                  value={orchestratorMessage}
                  onChange={(e) => setOrchestratorMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBroadcast()}
                  placeholder="Inject prompt into all active neural sessions..."
                  className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all text-lg font-light italic"
                />
                <button
                  onClick={handleBroadcast}
                  disabled={!orchestratorMessage.trim() || loading}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-cyan-500 text-black rounded-xl font-bold text-sm uppercase tracking-wider hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                >
                  {loading ? 'Transmitting...' : 'Execute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-8 max-w-[1600px] mx-auto mb-20">
        {AI_ENDPOINTS.filter((ep) => ep.streamingEnabled).map((endpoint) => {
          const session = sessions.find(s => s.id === endpoint.id);
          const isError = session?.status === 'error';

          return (
            <div
              key={endpoint.id}
              className="group relative flex flex-col bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden shadow-2xl transition-all hover:border-white/10"
              style={{ minHeight: 'calc(100vh - 400px)' }}
            >
              {/* Session Glow Effect */}
              {session?.status === 'running' && (
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-t from-cyan-500/5 to-transparent shadow-[inset_0_0_40px_rgba(6,182,212,0.1)]" />
              )}

              {/* Window Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/40" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/40" />
                    <div className="w-3 h-3 rounded-full bg-green-500/40" />
                  </div>
                  <div className="h-4 w-px bg-white/10 mx-2" />
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm uppercase tracking-widest text-slate-100">{endpoint.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-500 uppercase tracking-tighter">
                      {endpoint.models[0]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mr-4">
                    Neural Bridge: <span className={session?.status === 'running' ? 'text-cyan-400' : isError ? 'text-red-400' : 'text-slate-600'}>
                      {session?.status || 'idle'}
                    </span>
                  </div>
                  <button
                    onClick={() => stopSession(endpoint.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                    title="Terminate Session"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Viewport Area */}
              <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
                {isError ? (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 text-3xl">⚠️</div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Neural Link Failure</h3>
                      <p className="text-slate-400 max-w-sm">Failed to establish a secure bridge to {endpoint.name}. Google may be blocking the automated connection.</p>
                      <button
                        onClick={() => createSession(endpoint.id, endpoint.name, endpoint.url, 1280, 800)}
                        className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                      >
                        Retry Connection
                      </button>
                    </div>
                  </div>
                ) : (
                  <BrowserStreamCanvas
                    sessionId={endpoint.id}
                    name={endpoint.name}
                    url={endpoint.url}
                    width={1280}
                    height={800}
                  />
                )}
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between px-6 py-2 bg-black/40 border-t border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                <div className="flex items-center gap-4">
                  <span>Stream Quality: High (JPEG 70)</span>
                  <span className="text-slate-800">|</span>
                  <span>Latency: Optimized</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${session?.status === 'running' ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'}`} />
                  Real-time Neural Stream
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/60 border-t border-white/5 px-6 py-3">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-500/80">Master Clock Core: Online</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[9px]">Uptime: </span>
              <span className="text-slate-300">{Math.floor(Date.now() / 1000) % 10000}s</span>
            </div>
          </div>
          <div className="text-slate-400 flex items-center gap-3">
            <span className="text-slate-600 font-light">The New Fuse OS</span>
            <div className="h-3 w-px bg-white/10" />
            <span className="text-cyan-500/60 transition-opacity hover:opacity-100 cursor-default">v4.5-LTS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AICommandCenterStreaming;
