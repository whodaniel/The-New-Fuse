import React, { useState } from 'react';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import { resolveWebAppBaseUrl, webSurfaceUrl } from '../config/webSurfaces';
import { useOperatorSynergy } from '../hooks/useOperatorSynergy';
import { openExternal } from '../lib/openExternal';
import type { TopologyNode } from '../services/operatorSynergy/types';
import { useSettingsStore } from '../stores/settingsStore';

interface MemoryIndexEntry {
  agentId: string;
  agentName: string;
  channelCount: number;
  lastActive: string;
  status: string;
}

const KnowledgeHub: React.FC = () => {
  const { state: synergy } = useOperatorSynergy();
  const { environment } = useSettingsStore();
  const webPkgUrl = webSurfaceUrl(resolveWebAppBaseUrl(environment), '/knowledge-hub');
  const [activeTab, setActiveTab] = useState<'topology' | 'relay-clusters' | 'memory-index'>(
    'topology'
  );
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

  const memoryIndex: MemoryIndexEntry[] = synergy.unifiedAgents.map((agent) => ({
    agentId: agent.id,
    agentName: agent.name,
    channelCount: agent.capabilities.length,
    lastActive: agent.status,
    status: agent.status,
  }));

  const getNodeColor = (node: TopologyNode): string => {
    const colors: Record<string, string> = {
      online: '#10b981',
      offline: '#ef4444',
      active: '#6366f1',
      idle: '#f59e0b',
    };
    return colors[node.status] || '#64748b';
  };

  const getGroupIcon = (group: string): string => {
    const icons: Record<string, string> = {
      local: '💻',
      cloud: '☁️',
      agent: '🤖',
      relay: '📡',
    };
    return icons[group] || '❓';
  };

  return (
    <PageShell
      title="Knowledge Hub"
      subtitle={`Agent topology · ${synergy.topology.nodes.length} nodes · ${synergy.channelCount} relay clusters · relay ${synergy.relayRegistered ? 'registered' : synergy.relayConnected ? 'connected' : 'offline'}`}
      actions={
        <>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void openExternal(webPkgUrl)}
          >
            Web PKG
          </button>
          <span className={`env-badge ${synergy.relayRegistered ? 'local' : 'offline'}`}>
            {synergy.federatedAgentCount} federated
          </span>
        </>
      }
    >
      <SynergyStatusBar />

      {/* Tab Navigation */}
      <div className="tab-nav">
        {(['topology', 'relay-clusters', 'memory-index'] as const).map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'topology' && '🔌'}
            {tab === 'relay-clusters' && '📡'}
            {tab === 'memory-index' && '🧠'}
            <span className="tab-label">
              {tab === 'relay-clusters'
                ? 'Relay Clusters'
                : tab === 'memory-index'
                  ? 'Memory Index'
                  : 'Topology'}
            </span>
          </button>
        ))}
      </div>

      {/* Topology Tab */}
      {activeTab === 'topology' && (
        <div className="kh-topology">
          <div className="topology-visual">
            <svg viewBox="0 0 600 500" className="topology-svg">
              {/* Render links */}
              {synergy.topology.links.map((link, i) => {
                const sourceNode = synergy.topology.nodes.find((n) => n.id === link.source);
                const targetNode = synergy.topology.nodes.find((n) => n.id === link.target);
                if (!sourceNode || !targetNode) return null;

                const sourcePos = getNodePosition(sourceNode.id);
                const targetPos = getNodePosition(targetNode.id);
                const isActive = link.active;

                return (
                  <line
                    key={`link-${i}`}
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={isActive ? '#6366f1' : '#334155'}
                    strokeWidth={isActive ? Math.max(1, link.value) : 1}
                    strokeOpacity={isActive ? 0.7 : 0.3}
                    strokeDasharray={isActive ? 'none' : '6,4'}
                  />
                );
              })}

              {/* Render nodes */}
              {synergy.topology.nodes.map((node) => {
                const pos = getNodePosition(node.id);
                const color = getNodeColor(node);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => setSelectedNode(node)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      r={node.group === 'relay' ? 22 : 16}
                      fill={color}
                      fillOpacity={0.2}
                      stroke={color}
                      strokeWidth={2}
                    />
                    <text textAnchor="middle" dy="4" fill="#f8fafc" fontSize={10} fontWeight={600}>
                      {getGroupIcon(node.group)}
                    </text>
                    <text textAnchor="middle" dy={28} fill="#94a3b8" fontSize={10}>
                      {node.label.length > 16 ? `${node.label.slice(0, 14)}…` : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="topology-legend">
            <h3>Legend</h3>
            {synergy.topology.nodes.map((node) => (
              <div
                key={node.id}
                className={`legend-item ${selectedNode?.id === node.id ? 'selected' : ''}`}
                onClick={() => setSelectedNode(node)}
              >
                <span className="legend-dot" style={{ backgroundColor: getNodeColor(node) }} />
                <span className="legend-label">{node.label}</span>
                <span className="legend-status">{node.status}</span>
              </div>
            ))}
          </div>

          {selectedNode && (
            <div className="node-detail-card">
              <h4>{selectedNode.label}</h4>
              <div className="node-detail-grid">
                <div>
                  <span className="detail-label">ID</span>
                  <span className="detail-value">{selectedNode.id}</span>
                </div>
                <div>
                  <span className="detail-label">Group</span>
                  <span className="detail-value">{selectedNode.group}</span>
                </div>
                <div>
                  <span className="detail-label">Status</span>
                  <span className={`detail-status ${selectedNode.status}`}>
                    {selectedNode.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Relay Clusters Tab */}
      {activeTab === 'relay-clusters' && (
        <div className="kh-relay">
          <div className="relay-stats-grid">
            <div className="relay-stat-card">
              <span className="relay-stat-value">{synergy.channelCount}</span>
              <span className="relay-stat-label">Channels</span>
            </div>
            <div className="relay-stat-card">
              <span className="relay-stat-value">{synergy.federatedAgentCount}</span>
              <span className="relay-stat-label">Federated Agents</span>
            </div>
            <div className="relay-stat-card">
              <span className="relay-stat-value">
                {synergy.relayHealth ? `${Math.round(synergy.relayHealth.uptime)}s` : '—'}
              </span>
              <span className="relay-stat-label">Uptime</span>
            </div>
            <div className="relay-stat-card">
              <span
                className={`relay-stat-value ${synergy.relayHealth?.status === 'ok' ? 'green' : 'red'}`}
              >
                {synergy.relayHealth?.status === 'ok' ? 'OK' : 'DOWN'}
              </span>
              <span className="relay-stat-label">Relay Status</span>
            </div>
          </div>

          <div className="relay-channel-list">
            <h3>Relay Clusters</h3>
            {synergy.unifiedAgents.filter((a) => a.source === 'federation').length === 0 ? (
              <div className="empty-state">
                {synergy.relayConnected
                  ? 'No federated agents registered. Agent registration completes via relay.'
                  : 'Relay not connected. Start the standalone relay (common ports: 3000, 3007).'}
              </div>
            ) : (
              <div className="channel-table">
                <div className="channel-table-head">
                  <span>Agent</span>
                  <span>Platform</span>
                  <span>Status</span>
                  <span>Capabilities</span>
                </div>
                {synergy.unifiedAgents
                  .filter((a) => a.source === 'federation')
                  .map((agent) => (
                    <div key={agent.id} className="channel-row">
                      <span className="channel-agent-name">{agent.name}</span>
                      <span className="channel-platform">{agent.platform}</span>
                      <span className={`channel-status ${agent.status}`}>{agent.status}</span>
                      <span className="channel-caps">{agent.capabilities.length} caps</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="relay-activity">
            <div className="activity-header">
              <h3>Relay Activity</h3>
              <span className="activity-count">{synergy.activityLog.length} events</span>
            </div>
            <div className="activity-scroll">
              {synergy.activityLog.length === 0 ? (
                <div className="empty-state small">No activity yet.</div>
              ) : (
                synergy.activityLog.slice(0, 50).map((line, i) => (
                  <div key={i} className="activity-line">
                    <span className="activity-ts">{line.split(']')[0]}]</span>
                    <span className="activity-msg">
                      {line.split(']').slice(1).join(']').trim()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Memory Index Tab */}
      {activeTab === 'memory-index' && (
        <div className="kh-memory">
          <div className="memory-stats">
            <div className="mem-stat">
              <span className="mem-stat-value">{memoryIndex.length}</span>
              <span className="mem-stat-label">Agents Indexed</span>
            </div>
            <div className="mem-stat">
              <span className="mem-stat-value">
                {memoryIndex.filter((m) => m.status === 'active').length}
              </span>
              <span className="mem-stat-label">Active</span>
            </div>
            <div className="mem-stat">
              <span className="mem-stat-value">
                {synergy.relayHealth ? `${Math.round(synergy.relayHealth.uptime / 60)}m` : '—'}
              </span>
              <span className="mem-stat-label">Sync Duration</span>
            </div>
          </div>

          <div className="memory-index-table">
            <div className="memory-table-head">
              <span>Agent</span>
              <span>Channels</span>
              <span>Status</span>
              <span>Last Active</span>
            </div>
            {memoryIndex.length === 0 ? (
              <div className="empty-state">
                No agents in memory index. Connect relay and register agents.
              </div>
            ) : (
              memoryIndex.map((entry) => (
                <div key={entry.agentId} className="memory-row">
                  <span className="mem-agent-name">{entry.agentName}</span>
                  <span className="mem-channels">{entry.channelCount}</span>
                  <span className={`channel-status ${entry.status}`}>{entry.status}</span>
                  <span className="mem-last-active">{entry.lastActive}</span>
                </div>
              ))
            )}
          </div>

          <div className="memory-sync-info">
            <h3>Sync State</h3>
            <div className="sync-details">
              <div className="sync-row">
                <span>Last Sync</span>
                <span>
                  {synergy.lastSyncAt ? new Date(synergy.lastSyncAt).toLocaleTimeString() : 'Never'}
                </span>
              </div>
              <div className="sync-row">
                <span>Relay Connection</span>
                <span className={synergy.relayConnected ? 'text-green' : 'text-red'}>
                  {synergy.relayConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="sync-row">
                <span>Federation Registration</span>
                <span className={synergy.relayRegistered ? 'text-green' : 'text-yellow'}>
                  {synergy.relayRegistered ? 'Registered' : 'Pending'}
                </span>
              </div>
              <div className="sync-row">
                <span>API Status</span>
                <span className={synergy.apiOnline ? 'text-green' : 'text-red'}>
                  {synergy.apiOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="sync-row">
                <span>Topology Nodes</span>
                <span>{synergy.topology.nodes.length}</span>
              </div>
              <div className="sync-row">
                <span>Topology Links</span>
                <span>{synergy.topology.links.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .kh-container {
          padding: 24px;
          max-width: 1600px;
          margin: 0 auto;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .kh-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-shrink: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .env-badge {
          padding: 4px 12px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
        }
        .env-badge.local { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .env-badge.cloud { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .env-badge.offline { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

        .tab-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-shrink: 0;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .tab-btn.active {
          background: rgba(99, 102, 241, 0.15);
          border-color: #6366f1;
          color: #f8fafc;
        }

        .tab-label {
          font-weight: 500;
        }

        /* ===== Topology Tab ===== */
        .kh-topology {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: 1fr 220px;
          grid-template-rows: 1fr auto;
          gap: 16px;
        }

        .topology-visual {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .topology-svg {
          width: 100%;
          height: 100%;
          max-height: 420px;
        }

        .topology-legend {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .topology-legend h3 {
          margin: 0 0 8px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 12px;
        }

        .legend-item:hover,
        .legend-item.selected {
          background: rgba(99, 102, 241, 0.1);
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-label {
          flex: 1;
          color: #e2e8f0;
        }

        .legend-status {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
        }

        .node-detail-card {
          grid-column: 1 / -1;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 12px;
          padding: 16px;
        }

        .node-detail-card h4 {
          margin: 0 0 12px;
          font-size: 16px;
          color: #f8fafc;
        }

        .node-detail-grid {
          display: flex;
          gap: 24px;
        }

        .node-detail-grid > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
        }

        .detail-value {
          font-size: 14px;
          color: #e2e8f0;
        }

        .detail-status {
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }
        .detail-status.online { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .detail-status.offline { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .detail-status.active { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
        .detail-status.idle { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }

        /* ===== Relay Clusters Tab ===== */
        .kh-relay {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .relay-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .relay-stat-card {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .relay-stat-value {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: #f8fafc;
        }

        .relay-stat-value.green { color: #10b981; }
        .relay-stat-value.red { color: #ef4444; }

        .relay-stat-label {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-top: 6px;
        }

        .relay-channel-list {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 20px;
        }

        .relay-channel-list h3 {
          margin: 0 0 16px;
          font-size: 16px;
          color: #f8fafc;
        }

        .channel-table {
          display: flex;
          flex-direction: column;
        }

        .channel-table-head {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 12px;
          padding: 10px 12px;
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .channel-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          font-size: 13px;
          align-items: center;
        }

        .channel-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .channel-agent-name {
          color: #f8fafc;
          font-weight: 500;
        }

        .channel-platform {
          color: #94a3b8;
          font-size: 12px;
        }

        .channel-status {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          width: fit-content;
        }
        .channel-status.active { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .channel-status.idle { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .channel-status.offline { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .channel-status.online { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }

        .channel-caps {
          color: #64748b;
          font-size: 12px;
        }

        .relay-activity {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 20px;
          max-height: 280px;
          display: flex;
          flex-direction: column;
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .activity-header h3 {
          margin: 0;
          font-size: 16px;
          color: #f8fafc;
        }

        .activity-count {
          font-size: 12px;
          color: #64748b;
        }

        .activity-scroll {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .activity-line {
          padding: 4px 8px;
          font-size: 12px;
          font-family: monospace;
          color: #94a3b8;
          border-radius: 4px;
        }

        .activity-line:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .activity-ts {
          color: #64748b;
          margin-right: 6px;
        }

        /* ===== Memory Index Tab ===== */
        .kh-memory {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .memory-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .mem-stat {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .mem-stat-value {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: #f8fafc;
        }

        .mem-stat-label {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-top: 6px;
        }

        .memory-index-table {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 20px;
        }

        .memory-table-head {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 12px;
          padding: 10px 12px;
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .memory-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          font-size: 13px;
          align-items: center;
        }

        .memory-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .mem-agent-name {
          color: #f8fafc;
          font-weight: 500;
        }

        .mem-channels {
          color: #94a3b8;
        }

        .mem-last-active {
          color: #64748b;
          font-size: 12px;
        }

        .memory-sync-info {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 20px;
        }

        .memory-sync-info h3 {
          margin: 0 0 16px;
          font-size: 16px;
          color: #f8fafc;
        }

        .sync-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sync-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          font-size: 13px;
        }

        .sync-row span:first-child {
          color: #94a3b8;
        }

        .sync-row span:last-child {
          color: #f8fafc;
          font-weight: 500;
        }

        .text-green { color: #10b981 !important; }
        .text-red { color: #ef4444 !important; }
        .text-yellow { color: #f59e0b !important; }

        /* Shared */
        .empty-state {
          padding: 32px;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }

        .empty-state.small {
          padding: 16px;
        }

        .page-title {
          font-family: 'Outfit', sans-serif;
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-subtitle {
          color: #94a3b8;
          margin: 4px 0 0;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .kh-topology {
            grid-template-columns: 1fr;
          }
          .relay-stats-grid,
          .memory-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </PageShell>
  );
};

function getNodePosition(id: string): { x: number; y: number } {
  const positions: Record<string, { x: number; y: number }> = {
    desktop: { x: 100, y: 100 },
    relay: { x: 300, y: 80 },
    extension: { x: 100, y: 300 },
    api: { x: 500, y: 100 },
  };
  if (positions[id]) return positions[id];
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return {
    x: 320 + (hash % 240),
    y: 200 + (hash % 160),
  };
}

export default KnowledgeHub;
