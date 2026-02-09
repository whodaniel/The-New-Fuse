import React, { useState, useEffect, useCallback, useRef } from 'react';

interface AIEndpoint {
  id: string;
  name: string;
  url: string;
  models: string[];
  loginRequired: boolean;
  status: 'loading' | 'active' | 'blocked' | 'error';
  memoryUsage?: number;
}

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

const AI_ENDPOINTS: Omit<AIEndpoint, 'status'>[] = [
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo AI',
    url: 'https://duckduckgo.com/aichat',
    models: ['GPT-4o mini', 'Claude 3 Haiku', 'Llama 3.1'],
    loginRequired: false,
  },
  {
    id: 'huggingchat',
    name: 'HuggingChat',
    url: 'https://huggingface.co/chat/',
    models: ['Llama 3', 'Mistral', 'Qwen'],
    loginRequired: false,
  },
  {
    id: 'venice',
    name: 'Venice AI',
    url: 'https://venice.ai/chat',
    models: ['Llama 3.1 70B'],
    loginRequired: false,
  },
  {
    id: 'blackbox',
    name: 'Blackbox AI',
    url: 'https://www.blackbox.ai/',
    models: ['Blackbox Coding'],
    loginRequired: false,
  },
  {
    id: 'lmsys',
    name: 'LMSYS Arena',
    url: 'https://chat.lmsys.org/',
    models: ['GPT-4', 'Claude 3.5', 'Gemini'],
    loginRequired: false,
  },
  {
    id: 'felo',
    name: 'Felo AI Search',
    url: 'https://felo.ai/search',
    models: ['Agentic Search'],
    loginRequired: false,
  },
  {
    id: 'genspark',
    name: 'Genspark',
    url: 'https://www.genspark.ai/',
    models: ['Multi-agent'],
    loginRequired: false,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    url: 'https://www.perplexity.ai/',
    models: ['Perplexity Pro'],
    loginRequired: false,
  },
  {
    id: 'you',
    name: 'You.com',
    url: 'https://you.com/',
    models: ['YouChat'],
    loginRequired: false,
  },
  {
    id: 'phind',
    name: 'Phind',
    url: 'https://www.phind.com/',
    models: ['Phind-70B'],
    loginRequired: false,
  },
];

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AICommandCenter: React.FC = () => {
  const [endpoints, setEndpoints] = useState<AIEndpoint[]>(
    AI_ENDPOINTS.map(ep => ({ ...ep, status: 'loading' as const }))
  );
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [layout, setLayout] = useState<'grid' | 'tabs' | 'single'>('grid');
  const [activeTab, setActiveTab] = useState<string>('duckduckgo');
  const [columns, setColumns] = useState(2);
  const [showBlocked, setShowBlocked] = useState(true);
  const iframeRefs = useRef<Map<string, HTMLIFrameElement>>(new Map());

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

  // Check iframe load status
  const handleIframeLoad = useCallback((id: string) => {
    setEndpoints(prev =>
      prev.map(ep =>
        ep.id === id ? { ...ep, status: 'active' as const } : ep
      )
    );
  }, []);

  const handleIframeError = useCallback((id: string) => {
    setEndpoints(prev =>
      prev.map(ep =>
        ep.id === id ? { ...ep, status: 'blocked' as const } : ep
      )
    );
  }, []);

  // Reload specific iframe
  const reloadIframe = (id: string) => {
    const iframe = iframeRefs.current.get(id);
    if (iframe) {
      setEndpoints(prev =>
        prev.map(ep =>
          ep.id === id ? { ...ep, status: 'loading' as const } : ep
        )
      );
      iframe.src = iframe.src;
    }
  };

  // Open in new tab
  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  // Clear memory (remove blocked iframes)
  const clearBlockedIframes = () => {
    setEndpoints(prev => prev.filter(ep => ep.status !== 'blocked'));
  };

  const activeEndpoints = showBlocked 
    ? endpoints 
    : endpoints.filter(ep => ep.status !== 'blocked');

  const memoryPercentage = memoryStats 
    ? (memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100 
    : 0;

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
                {activeEndpoints.filter(ep => ep.status === 'active').length} Active
              </span>
            </div>

            {/* Memory Monitor */}
            <div className="flex items-center gap-6">
              {memoryStats && (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-400">
                    Memory: {formatBytes(memoryStats.usedJSHeapSize)} / {formatBytes(memoryStats.jsHeapSizeLimit)}
                  </div>
                  <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        memoryPercentage > 80 ? 'bg-red-500' : 
                        memoryPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${memoryPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Layout Controls */}
              <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setLayout('grid')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    layout === 'grid' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setLayout('tabs')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    layout === 'tabs' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Tabs
                </button>
                <button
                  onClick={() => setLayout('single')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    layout === 'single' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
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

              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={showBlocked}
                  onChange={(e) => setShowBlocked(e.target.checked)}
                  className="rounded"
                />
                Show Blocked
              </label>

              <button
                onClick={clearBlockedIframes}
                className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all"
              >
                🧹 Clear Blocked
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <div className="bg-black/20 border-b border-white/5 px-4 py-2">
        <div className="max-w-[1920px] mx-auto flex items-center gap-4 text-sm">
          <span className="text-gray-400">
            Total: {endpoints.length} |
            Active: <span className="text-green-400">{endpoints.filter(ep => ep.status === 'active').length}</span> |
            Loading: <span className="text-yellow-400">{endpoints.filter(ep => ep.status === 'loading').length}</span> |
            Blocked: <span className="text-red-400">{endpoints.filter(ep => ep.status === 'blocked').length}</span>
          </span>
          <span className="text-gray-500">|</span>
          <span className="text-cyan-400">
            ⚡ Orchestrator Connected: Master Clock Active
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4">
        {/* Grid Layout */}
        {layout === 'grid' && (
          <div 
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {activeEndpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className={`rounded-xl overflow-hidden border transition-all ${
                  endpoint.status === 'active' ? 'border-green-500/50 shadow-lg shadow-green-500/10' :
                  endpoint.status === 'blocked' ? 'border-red-500/50' :
                  'border-white/10'
                }`}
              >
                {/* Iframe Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-black/40">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      endpoint.status === 'active' ? 'bg-green-500' :
                      endpoint.status === 'blocked' ? 'bg-red-500' :
                      'bg-yellow-500 animate-pulse'
                    }`} />
                    <span className="font-medium text-sm">{endpoint.name}</span>
                    <span className="text-xs text-gray-500">
                      {endpoint.models[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => reloadIframe(endpoint.id)}
                      className="p-1.5 hover:bg-white/10 rounded transition-colors"
                      title="Reload"
                    >
                      🔄
                    </button>
                    <button
                      onClick={() => openInNewTab(endpoint.url)}
                      className="p-1.5 hover:bg-white/10 rounded transition-colors"
                      title="Open in new tab"
                    >
                      ↗️
                    </button>
                  </div>
                </div>

                {/* Iframe Container */}
                <div className="relative" style={{ height: '400px' }}>
                  {endpoint.status === 'blocked' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20">
                      <span className="text-4xl mb-2">🚫</span>
                      <span className="text-red-400 font-medium">Blocked by X-Frame-Options</span>
                      <button
                        onClick={() => openInNewTab(endpoint.url)}
                        className="mt-3 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                      >
                        Open in New Tab ↗️
                      </button>
                    </div>
                  ) : (
                    <>
                      {endpoint.status === 'loading' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
                        </div>
                      )}
                      <iframe
                        ref={(el) => el && iframeRefs.current.set(endpoint.id, el)}
                        src={endpoint.url}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        onLoad={() => handleIframeLoad(endpoint.id)}
                        onError={() => handleIframeError(endpoint.id)}
                        title={endpoint.name}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs Layout */}
        {layout === 'tabs' && (
          <div>
            {/* Tab Bar */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
              {activeEndpoints.map((endpoint) => (
                <button
                  key={endpoint.id}
                  onClick={() => setActiveTab(endpoint.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    activeTab === endpoint.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    endpoint.status === 'active' ? 'bg-green-500' :
                    endpoint.status === 'blocked' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  {endpoint.name}
                </button>
              ))}
            </div>

            {/* Active Tab Content */}
            {activeEndpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className={`${activeTab === endpoint.id ? 'block' : 'hidden'}`}
              >
                <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: 'calc(100vh - 220px)' }}>
                  {endpoint.status === 'blocked' ? (
                    <div className="h-full flex flex-col items-center justify-center bg-red-900/20">
                      <span className="text-6xl mb-4">🚫</span>
                      <span className="text-xl text-red-400 font-medium">Site Blocked Iframe Embedding</span>
                      <button
                        onClick={() => openInNewTab(endpoint.url)}
                        className="mt-4 px-6 py-3 bg-purple-500 rounded-lg hover:bg-purple-600 transition-all"
                      >
                        Open {endpoint.name} in New Tab ↗️
                      </button>
                    </div>
                  ) : (
                    <iframe
                      ref={(el) => el && iframeRefs.current.set(endpoint.id, el)}
                      src={endpoint.url}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      onLoad={() => handleIframeLoad(endpoint.id)}
                      onError={() => handleIframeError(endpoint.id)}
                      title={endpoint.name}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Single Focus Layout */}
        {layout === 'single' && (
          <div className="flex gap-4" style={{ height: 'calc(100vh - 180px)' }}>
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 space-y-2 overflow-y-auto">
              {activeEndpoints.map((endpoint) => (
                <button
                  key={endpoint.id}
                  onClick={() => setActiveTab(endpoint.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === endpoint.id
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    endpoint.status === 'active' ? 'bg-green-500' :
                    endpoint.status === 'blocked' ? 'bg-red-500' :
                    'bg-yellow-500 animate-pulse'
                  }`} />
                  <div className="text-left">
                    <div className="font-medium">{endpoint.name}</div>
                    <div className="text-xs opacity-70">{endpoint.models[0]}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 rounded-xl overflow-hidden border border-white/10">
              {activeEndpoints.filter(ep => ep.id === activeTab).map((endpoint) => (
                endpoint.status === 'blocked' ? (
                  <div key={endpoint.id} className="h-full flex flex-col items-center justify-center bg-red-900/20">
                    <span className="text-8xl mb-6">🚫</span>
                    <span className="text-2xl text-red-400 font-medium mb-2">Iframe Embedding Blocked</span>
                    <span className="text-gray-500 mb-6">{endpoint.url}</span>
                    <button
                      onClick={() => openInNewTab(endpoint.url)}
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl text-lg font-medium hover:scale-105 transition-transform"
                    >
                      Open {endpoint.name} in New Tab ↗️
                    </button>
                  </div>
                ) : (
                  <iframe
                    key={endpoint.id}
                    ref={(el) => el && iframeRefs.current.set(endpoint.id, el)}
                    src={endpoint.url}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    onLoad={() => handleIframeLoad(endpoint.id)}
                    onError={() => handleIframeError(endpoint.id)}
                    title={endpoint.name}
                  />
                )
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Federation Status Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-white/10 px-4 py-2">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-green-400">● Master Clock: Active</span>
            <span className="text-gray-500">|</span>
            <span className="text-cyan-400">Session: ORCHESTRATOR-{Date.now()}</span>
          </div>
          <div className="text-gray-500">
            Press Ctrl+Shift+F in any AI chat to connect to Federation
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AICommandCenter;
