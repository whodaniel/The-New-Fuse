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
    id: 'duckduckgo',
    name: 'DuckDuckGo AI',
    url: 'https://duckduckgo.com/aichat',
    models: ['GPT-4o mini', 'Claude 3 Haiku', 'Llama 3.1'],
    loginRequired: false,
    streamingEnabled: true,
  },
  {
    id: 'huggingchat',
    name: 'HuggingChat',
    url: 'https://huggingface.co/chat/',
    models: ['Llama 3', 'Mistral', 'Qwen'],
    loginRequired: false,
    streamingEnabled: true,
  },
  {
    id: 'venice',
    name: 'Venice AI',
    url: 'https://venice.ai/chat',
    models: ['Llama 3.1 70B'],
    loginRequired: false,
    streamingEnabled: true,
  },
  {
    id: 'blackbox',
    name: 'Blackbox AI',
    url: 'https://www.blackbox.ai/',
    models: ['Blackbox Coding'],
    loginRequired: false,
    streamingEnabled: true,
  },
  {
    id: 'lmsys',
    name: 'LMSYS Arena',
    url: 'https://chat.lmsys.org/',
    models: ['GPT-4', 'Claude 3.5', 'Gemini'],
    loginRequired: false,
    streamingEnabled: true,
  },
  {
    id: 'felo',
    name: 'Felo AI Search',
    url: 'https://felo.ai/search',
    models: ['Agentic Search'],
    loginRequired: false,
    streamingEnabled: true,
  },
  {
    id: 'genspark',
    name: 'Genspark',
    url: 'https://www.genspark.ai/',
    models: ['Multi-agent'],
    loginRequired: false,
    streamingEnabled: true,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    url: 'https://www.perplexity.ai/',
    models: ['Perplexity Pro'],
    loginRequired: false,
    streamingEnabled: true,
  },
  {
    id: 'you',
    name: 'You.com',
    url: 'https://you.com/',
    models: ['YouChat'],
    loginRequired: false,
    streamingEnabled: true,
  },
  {
    id: 'claude',
    name: 'Claude 4.5',
    url: 'https://claude.ai/new',
    models: ['Claude Opus 4.5', 'Claude Sonnet 4.5'],
    loginRequired: false,
    streamingEnabled: true,
  },
];

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AICommandCenterStreaming: React.FC = () => {
  const { sessions, loading, createSession, stopSession, broadcast } = useBrowserStreaming();

  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [layout, setLayout] = useState<'grid' | 'tabs' | 'single'>('grid');
  const [activeTab, setActiveTab] = useState<string>('duckduckgo');
  const [columns, setColumns] = useState(2);
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
            await createSession(endpoint.id, endpoint.name, endpoint.url, 800, 600);
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
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header with Memory Stats */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="max-w-[1920px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                🎛️ AI Command Center
              </h1>
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium animate-pulse">
                {runningCount} Active
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
                🚀 Browser Streaming
              </span>
            </div>

            {/* Memory Monitor */}
            <div className="flex items-center gap-6">
              {memoryStats && (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-400">
                    Memory: {formatBytes(memoryStats.usedJSHeapSize)} /{' '}
                    {formatBytes(memoryStats.jsHeapSizeLimit)}
                  </div>
                  <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        memoryPercentage > 80
                          ? 'bg-red-500'
                          : memoryPercentage > 60
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${memoryPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Master Clock Button */}
              <button
                onClick={() => setShowOrchestratorPanel(!showOrchestratorPanel)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg font-medium hover:scale-105 transition-transform"
              >
                ⚡ Master Clock
              </button>

              {/* Layout Controls */}
              <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setLayout('grid')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    layout === 'grid'
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setLayout('tabs')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    layout === 'tabs'
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Tabs
                </button>
                <button
                  onClick={() => setLayout('single')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    layout === 'single'
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Single
                </button>
              </div>

              {layout === 'grid' && (
                <select
                  value={columns}
                  onChange={(e) => setColumns(Number(e.target.value))}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm"
                >
                  <option value={1}>1 Column</option>
                  <option value={2}>2 Columns</option>
                  <option value={3}>3 Columns</option>
                  <option value={4}>4 Columns</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Master Clock Orchestrator Panel */}
      {showOrchestratorPanel && (
        <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border-b border-white/10 px-4 py-4">
          <div className="max-w-[1920px] mx-auto">
            <h2 className="text-lg font-bold mb-3 text-cyan-400">⚡ Master Clock Orchestrator</h2>
            <p className="text-sm text-gray-400 mb-3">
              Send a synchronized message to all AI sessions simultaneously.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={orchestratorMessage}
                onChange={(e) => setOrchestratorMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBroadcast()}
                placeholder="Enter your query to send to all AI models..."
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleBroadcast}
                disabled={!orchestratorMessage.trim() || loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Broadcasting...' : '🚀 Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-black/20 border-b border-white/5 px-4 py-2">
        <div className="max-w-[1920px] mx-auto flex items-center gap-4 text-sm">
          <span className="text-gray-400">
            Total: {AI_ENDPOINTS.length} | Active:{' '}
            <span className="text-green-400">{runningCount}</span> | Loading:{' '}
            <span className="text-yellow-400">
              {sessions.filter((s) => s.status === 'initializing').length}
            </span>{' '}
            | Error:{' '}
            <span className="text-red-400">
              {sessions.filter((s) => s.status === 'error').length}
            </span>
          </span>
          <span className="text-gray-500">|</span>
          <span className="text-cyan-400">⚡ Browser-as-a-Service: Active</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4">
        {/* Grid Layout */}
        {layout === 'grid' && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {AI_ENDPOINTS.filter((ep) => ep.streamingEnabled).map((endpoint) => (
              <div
                key={endpoint.id}
                className="rounded-xl overflow-hidden border border-white/10 shadow-lg"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-black/40">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{endpoint.name}</span>
                    <span className="text-xs text-gray-500">{endpoint.models[0]}</span>
                  </div>
                  <button
                    onClick={() => stopSession(endpoint.id)}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors text-xs"
                    title="Stop session"
                  >
                    ⏹️
                  </button>
                </div>

                {/* Browser Stream */}
                <div style={{ height: '400px' }}>
                  <BrowserStreamCanvas
                    sessionId={endpoint.id}
                    name={endpoint.name}
                    url={endpoint.url}
                    width={800}
                    height={600}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs and Single layouts can be implemented similarly */}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-white/10 px-4 py-2">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-green-400">● Master Clock: Active</span>
            <span className="text-gray-500">|</span>
            <span className="text-cyan-400">Session: ORCHESTRATOR-{Date.now()}</span>
          </div>
          <div className="text-gray-500">Press Ctrl+Shift+F for Master Clock hotkey</div>
        </div>
      </footer>
    </div>
  );
};

export default AICommandCenterStreaming;
