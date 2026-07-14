import React, { useEffect, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import { GoogleDriveWizard } from '../components/mcp/GoogleDriveWizard';
import { resolveWebAppBaseUrl, webSurfaceUrl } from '../config/webSurfaces';
import { useModalA11y } from '../hooks/useModalA11y';
import { openExternal } from '../lib/openExternal';
import { apiService } from '../services/api';
import { useSettingsStore } from '../stores/settingsStore';
import type { MCPServer } from '../types';

interface Plugin extends MCPServer {
  type: 'skill' | 'mcp' | 'agent' | 'bundle';
  capabilities?: string[];
}

/**
 * MCP Marketplace Page
 * Browse and install MCP servers and tools
 */
const MCPMarketplace: React.FC = () => {
  const { environment } = useSettingsStore();
  const webMcpUrl = webSurfaceUrl(resolveWebAppBaseUrl(environment), '/mcp-hub');
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiOffline, setApiOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showDriveWizard, setShowDriveWizard] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const closeInstallModal = () => setShowInstallModal(false);
  const installDialogRef = useModalA11y(showInstallModal, closeInstallModal);

  const categories = [
    { id: 'all', label: 'All', icon: '📦' },
    { id: 'data', label: 'Data', icon: '📊' },
    { id: 'web', label: 'Web', icon: '🌐' },
    { id: 'code', label: 'Code', icon: '💻' },
    { id: 'ai', label: 'AI', icon: '🤖' },
    { id: 'file', label: 'Files', icon: '📁' },
    { id: 'database', label: 'Database', icon: '🗄️' },
    { id: 'skills', label: 'Skills', icon: '🧠' },
  ];

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    setLoading(true);
    const response = await apiService.getMCPServers();
    if (response.success && response.data && response.data.length > 0) {
      const mapped: Plugin[] = response.data.map((server) => ({
        id: server.id,
        name: server.name,
        description: server.description || 'MCP server',
        category: server.category || 'ai',
        version: server.version || '1.0.0',
        author: server.author || 'TNF',
        installed: server.installed,
        enabled: server.enabled,
        type: 'mcp' as const,
        tools: server.tools || [],
        capabilities: server.tools?.map((tool) => tool.name) || [],
      }));
      setPlugins(mapped);
      setApiOffline(false);
    } else {
      setPlugins([]);
      setApiOffline(true);
    }
    setLoading(false);
  };

  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch =
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const installedPlugins = plugins.filter((s) => s.installed);

  const handleInstall = async (server: MCPServer) => {
    if (server.id === 'google-drive') {
      setShowDriveWizard(true);
      setShowInstallModal(false);
      return;
    }

    if (server.id === 'claude-skills') {
      // For skills, we just enable it immediately since it's local
      setPlugins((prev) =>
        prev.map((s) => (s.id === server.id ? { ...s, installed: true, enabled: true } : s))
      );
      setShowInstallModal(false);
      return;
    }

    const response = await apiService.installMCPServer(server.id);
    if (response.success) {
      setInstallError(null);
      setPlugins((prev) =>
        prev.map((s) => (s.id === server.id ? { ...s, installed: true, enabled: true } : s))
      );
    } else {
      setInstallError(
        'Install failed — REST API offline. Start the TNF API on port 3001 to enable installs.'
      );
    }
    setShowInstallModal(false);
    setSelectedPlugin(null);
  };

  const handleUninstall = async (serverId: string) => {
    await apiService.uninstallMCPServer(serverId);
    setPlugins((prev) =>
      prev.map((s) => (s.id === serverId ? { ...s, installed: false, enabled: false } : s))
    );
  };

  const handleToggleEnabled = (serverId: string) => {
    setPlugins((prev) => prev.map((s) => (s.id === serverId ? { ...s, enabled: !s.enabled } : s)));
  };

  const handleWizardComplete = () => {
    setPlugins((prev) =>
      prev.map((s) => (s.id === 'google-drive' ? { ...s, installed: true, enabled: true } : s))
    );
    setShowDriveWizard(false);
  };

  return (
    <PageShell
      title="MCP Store"
      subtitle="Extend TNF with Skills, MCP servers, and agent tool bundles"
      actions={
        <>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void openExternal(webMcpUrl)}
          >
            Web MCP Hub
          </button>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-value">{installedPlugins.length}</span>
              <span className="stat-label">Installed</span>
            </div>
            <div className="stat">
              <span className="stat-value">{installedPlugins.filter((s) => s.enabled).length}</span>
              <span className="stat-label">Active</span>
            </div>
          </div>
        </>
      }
      banner={
        <>
          {apiOffline ? (
            <div className="offline-banner" role="status">
              REST API offline — catalog empty until port 3001 is reachable. Browse the web MCP hub
              for full catalog.
            </div>
          ) : null}
          {installError ? (
            <div className="offline-banner" role="alert">
              {installError}
            </div>
          ) : null}
        </>
      }
    >
      <SynergyStatusBar />

      {/* Search and Filter */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search plugins..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="search-icon">🔍</span>
      </div>

      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Installed Servers Section */}
      {installedPlugins.length > 0 && selectedCategory === 'all' && !searchQuery && (
        <section className="section">
          <h2 className="section-title">✅ Installed Plugins</h2>
          <div className="server-grid">
            {installedPlugins.map((server) => (
              <div key={server.id} className="server-card installed">
                <div className="card-header">
                  <span className="server-icon">{getCategoryIcon(server.category)}</span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={server.enabled}
                      onChange={() => handleToggleEnabled(server.id)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <h3 className="server-name">{server.name}</h3>
                <p className="server-description">{server.description}</p>
                <div className="server-meta">
                  <span className="version">v{server.version}</span>
                  <span className="author">by {server.author}</span>
                </div>
                <div className="server-tools">
                  <span className="tools-label">{server.tools.length} tools</span>
                  <div className="tool-names">
                    {server.tools.slice(0, 3).map((tool) => (
                      <span key={tool.name} className="tool-tag">
                        {tool.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    className="configure-btn"
                    onClick={() => setSelectedPlugin(server as Plugin)}
                  >
                    ⚙️ Configure
                  </button>
                  <button className="uninstall-btn" onClick={() => handleUninstall(server.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available Servers */}
      <section className="section">
        <h2 className="section-title">
          {selectedCategory === 'all' && !searchQuery
            ? '📦 Available Plugins'
            : `Results (${filteredPlugins.filter((s) => !s.installed).length})`}
        </h2>
        {loading ? (
          <div className="loading-state">Loading plugins...</div>
        ) : (
          <div className="server-grid">
            {filteredPlugins
              .filter((s) => !s.installed)
              .map((server) => (
                <div key={server.id} className="server-card">
                  <div className="card-header">
                    <span className="server-icon">{getCategoryIcon(server.category)}</span>
                    <span className="category-badge">{server.category}</span>
                  </div>
                  <h3 className="server-name">{server.name}</h3>
                  <p className="server-description">{server.description}</p>
                  <div className="server-meta">
                    <span className="version">v{server.version}</span>
                    <span className="author">by {server.author}</span>
                  </div>
                  <div className="server-tools">
                    <span className="tools-label">{server.tools.length} tools</span>
                    <div className="tool-names">
                      {server.tools.slice(0, 3).map((tool) => (
                        <span key={tool.name} className="tool-tag">
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="install-btn"
                    onClick={() => {
                      setSelectedPlugin(server as Plugin);
                      setShowInstallModal(true);
                    }}
                  >
                    Install
                  </button>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Install Modal */}
      {showInstallModal && selectedPlugin && (
        <div className="modal-overlay" onClick={closeInstallModal} role="presentation">
          <div
            ref={installDialogRef}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-plugin-title"
          >
            <div className="modal-header">
              <h2 id="install-plugin-title">Install {selectedPlugin.name}</h2>
              <button
                type="button"
                className="close-btn"
                onClick={closeInstallModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="install-description">{selectedPlugin.description}</p>

              <div className="tools-list">
                <h4>Available Tools:</h4>
                {selectedPlugin.tools.map((tool) => (
                  <div key={tool.name} className="tool-item">
                    <span className="tool-name">🔧 {tool.name}</span>
                    <span className="tool-desc">{tool.description}</span>
                  </div>
                ))}
              </div>

              <div className="install-warning">
                <span>⚠️</span>
                <span>This server will have access to the capabilities defined in its tools.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-btn" onClick={closeInstallModal}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => handleInstall(selectedPlugin)}
              >
                Install Server
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Wizard */}
      {showDriveWizard && (
        <GoogleDriveWizard
          onClose={() => setShowDriveWizard(false)}
          onComplete={handleWizardComplete}
        />
      )}

      <style>{`
        .page-container {
          padding: 32px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .page-title {
          font-family: var(--tnf-font-heading);
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #10b981, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-subtitle {
          color: var(--tnf-text-muted);
          margin: 4px 0 0;
        }

        .offline-banner {
          margin-bottom: 16px;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fcd34d;
        }

        .header-stats {
          display: flex;
          gap: 24px;
        }

        .header-stats .stat {
          text-align: center;
        }

        .header-stats .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: var(--tnf-primary-light);
        }

        .header-stats .stat-label {
          font-size: 12px;
          color: var(--tnf-text-muted);
        }

        /* Search Bar */
        .search-bar {
          position: relative;
          margin-bottom: 20px;
        }

        .search-bar input {
          width: 100%;
          padding: 16px 20px 16px 50px;
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 12px;
          color: var(--tnf-text-primary);
          font-size: 15px;
        }

        .search-bar input:focus {
          outline: none;
          border-color: var(--tnf-primary);
        }

        .search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 18px;
        }

        /* Category Tabs */
        .category-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .category-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 20px;
          color: var(--tnf-text-muted);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .category-tab:hover {
          background: var(--tnf-surface-hover);
        }

        .category-tab.active {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2));
          border-color: #10b981;
          color: var(--tnf-text-primary);
        }

        /* Sections */
        .section {
          margin-bottom: 40px;
        }

        .section-title {
          font-family: var(--tnf-font-heading);
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 20px;
        }

        /* Server Grid */
        .server-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .server-card {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s;
        }

        .server-card:hover {
          background: var(--tnf-surface-hover);
          border-color: var(--tnf-border-hover);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
        }

        .server-card.installed {
          border-color: rgba(16, 185, 129, 0.3);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .server-icon {
          font-size: 32px;
        }

        .category-badge {
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          font-size: 11px;
          color: var(--tnf-text-muted);
          text-transform: capitalize;
        }

        .server-name {
          font-family: var(--tnf-font-heading);
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px;
        }

        .server-description {
          font-size: 13px;
          color: var(--tnf-text-muted);
          margin: 0 0 12px;
          line-height: 1.5;
        }

        .server-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: var(--tnf-text-muted);
          margin-bottom: 12px;
        }

        .server-tools {
          margin-bottom: 16px;
        }

        .tools-label {
          font-size: 11px;
          color: var(--tnf-text-muted);
          display: block;
          margin-bottom: 8px;
        }

        .tool-names {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tool-tag {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          padding: 3px 8px;
          border-radius: 8px;
          font-size: 11px;
        }

        .install-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #10b981, #06b6d4);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .install-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .card-actions {
          display: flex;
          gap: 8px;
        }

        .configure-btn {
          flex: 1;
          padding: 10px;
          background: var(--tnf-surface-hover);
          border: 1px solid var(--tnf-border);
          border-radius: 8px;
          color: var(--tnf-text-primary);
          cursor: pointer;
        }

        .uninstall-btn {
          padding: 10px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          cursor: pointer;
        }

        /* Toggle Switch */
        .toggle {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle .slider {
          position: absolute;
          inset: 0;
          background: var(--tnf-surface-active);
          border-radius: 24px;
          transition: 0.3s;
          cursor: pointer;
        }

        .toggle .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background: white;
          border-radius: 50%;
          transition: 0.3s;
        }

        .toggle input:checked + .slider {
          background: #10b981;
        }

        .toggle input:checked + .slider:before {
          transform: translateX(20px);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--tnf-obsidian);
          border: 1px solid var(--tnf-border);
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--tnf-border);
        }

        .modal-header h2 {
          margin: 0;
          font-family: var(--tnf-font-heading);
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--tnf-text-muted);
          font-size: 24px;
          cursor: pointer;
        }

        .modal-body {
          padding: 24px;
        }

        .install-description {
          margin: 0 0 20px;
          color: var(--tnf-text-muted);
        }

        .tools-list h4 {
          margin: 0 0 12px;
          font-size: 14px;
        }

        .tool-item {
          display: flex;
          flex-direction: column;
          padding: 12px;
          background: var(--tnf-surface);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .tool-name {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .tool-desc {
          font-size: 12px;
          color: var(--tnf-text-muted);
        }

        .install-warning {
          display: flex;
          gap: 8px;
          padding: 12px;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 8px;
          font-size: 13px;
          margin-top: 16px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid var(--tnf-border);
        }

        .secondary-btn {
          padding: 10px 20px;
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 8px;
          color: var(--tnf-text-primary);
          cursor: pointer;
        }

        .primary-btn {
          padding: 10px 20px;
          background: linear-gradient(135deg, #10b981, #06b6d4);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .loading-state {
          text-align: center;
          padding: 40px;
          color: var(--tnf-text-muted);
        }
      `}</style>
    </PageShell>
  );
};

// Helper function
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    data: '📊',
    web: '🌐',
    code: '💻',
    ai: '🤖',
    file: '📁',
    database: '🗄️',
    skills: '🧠',
  };
  return icons[category] || '📦';
};

export default MCPMarketplace;
