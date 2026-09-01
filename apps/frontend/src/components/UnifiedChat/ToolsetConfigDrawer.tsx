import { useApi } from '@/hooks/useApi';
import {
  AlertCircle,
  Database,
  ExternalLink,
  Loader2,
  RefreshCw,
  Shield,
  Wrench,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type McpServerRow = {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'error' | string;
  type?: string;
  tools?: number;
  resources?: number;
};

export const ToolsetConfigDrawer = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { api } = useApi();
  const [servers, setServers] = useState<McpServerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/mcp/servers');
      if (response?.success && Array.isArray(response.data)) {
        setServers(response.data);
      } else {
        setServers([]);
        setError('MCP server inventory is unavailable');
      }
    } catch {
      setServers([]);
      setError('MCP server inventory is unavailable');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (isOpen) fetchServers();
  }, [isOpen, fetchServers]);

  const toggleServer = async (server: McpServerRow) => {
    setBusyId(server.id);
    try {
      if (server.status === 'running') {
        await api.post(`/mcp/servers/${server.id}/stop`);
      } else {
        await api.post(`/mcp/servers/${server.id}/start`);
      }
      await fetchServers();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />
      )}

      <div
        className={`fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
          <h2 className="text-lg font-semibold flex items-center">
            <Wrench className="w-5 h-5 mr-2" />
            Toolset Configuration
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Active MCP Servers
            </h3>
            <button
              onClick={fetchServers}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">{error}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start the API, run <code className="font-mono">pnpm tnf:mcp:generate</code>, or
                    open{' '}
                    <Link to="/mcp" className="text-blue-600 underline" onClick={onClose}>
                      MCP Hub
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading && servers.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading MCP servers…
            </div>
          ) : (
            <div className="space-y-2">
              {servers.length === 0 && !error ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No MCP servers registered yet.
                </p>
              ) : (
                servers.map((server) => (
                  <div
                    key={server.id}
                    className="flex items-center justify-between p-3 border dark:border-gray-800 rounded-lg"
                  >
                    <div className="flex items-center min-w-0">
                      {server.type === 'remote' ? (
                        <Shield className="w-4 h-4 mr-2 text-green-500 shrink-0" />
                      ) : (
                        <Database className="w-4 h-4 mr-2 text-blue-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-medium">{server.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {server.status}
                          {typeof server.tools === 'number' ? ` · ${server.tools} tools` : ''}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={server.status === 'running'}
                      disabled={busyId === server.id}
                      onChange={() => toggleServer(server)}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Agent Capabilities
            </h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="checkbox checkbox-sm" />
                <span>Auto-execute safe commands</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="checkbox checkbox-sm" />
                <span>Web Search Context</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="checkbox checkbox-sm" />
                <span>Vision &amp; Image Generation</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-4 border-t dark:border-gray-800 space-y-2">
          <Link
            to="/mcp"
            onClick={onClose}
            className="w-full py-2 border border-blue-600/30 text-blue-600 hover:bg-blue-600/10 rounded-md font-medium flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open MCP Hub
          </Link>
        </div>
      </div>
    </>
  );
};
