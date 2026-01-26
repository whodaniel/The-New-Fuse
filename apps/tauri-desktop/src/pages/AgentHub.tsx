import React, { useEffect, useState } from 'react';
import { useAgentStore } from '../stores/agentStore';
import type { Agent } from '../types';

/**
 * Agent Hub Page - Deep Space Edition
 * Manage and monitor your AI agent swarm with premium aesthetics
 */
const AgentHub: React.FC = () => {
  const { agents, loading, fetchAgents, startAgent, stopAgent, deleteAgent, createAgent } =
    useAgentStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'idle' | 'error'>('all');

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const filteredAgents = agents.filter((agent) => {
    if (filter === 'all') return true;
    return agent.status === filter;
  });

  const getTypeIcon = (type: Agent['type']) => {
    const icons: Record<string, string> = {
      claude: '🧠',
      gemini: '💎',
      gpt: '🤖',
      perplexity: '🔍',
      custom: '⚙️',
      local: '🏠',
    };
    return icons[type] || '🤖';
  };

  const getStatusColor = (status: Agent['status']) => {
    const colors: Record<string, string> = {
      active: '#10b981',
      idle: '#f59e0b',
      error: '#ef4444',
      offline: '#64748b',
    };
    return colors[status] || '#64748b';
  };

  const handleStartStop = async (e: React.MouseEvent, agent: Agent) => {
    e.stopPropagation();
    if (agent.status === 'active') {
      await stopAgent(agent.id);
    } else {
      await startAgent(agent.id);
    }
  };

  return (
    <div className="hub-container">
      <header className="hub-header">
        <div className="header-content">
          <h1 className="page-title">Neural Swarm</h1>
          <p className="page-subtitle">Orchestrate your autonomous agent network</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={() => fetchAgents()}>
            🔄 Sync
          </button>
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>
            <span className="plus-icon">+</span> Deploy Agent
          </button>
        </div>
      </header>

      {/* Stats Rail */}
      <div className="stats-rail">
        <div className="stat-card">
          <span className="stat-label">Active Nodes</span>
          <span className="stat-value active">
            {agents.filter((a) => a.status === 'active').length}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Load</span>
          <span className="stat-value">{agents.reduce((sum, a) => sum + a.tasks, 0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Network Size</span>
          <span className="stat-value">{agents.length}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-bar">
        {(['all', 'active', 'idle', 'error'] as const).map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            <span className="tab-label">
              {f === 'all' && 'All Nodes'}
              {f === 'active' && 'Active'}
              {f === 'idle' && 'Idle'}
              {f === 'error' && 'Errors'}
            </span>
            <span className="tab-count">
              {f === 'all' ? agents.length : agents.filter((a) => a.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Agent Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Establishing link to swarm...</span>
        </div>
      ) : (
        <div className="agent-grid">
          {filteredAgents.map((agent) => (
            <div key={agent.id} className="agent-card" onClick={() => setSelectedAgent(agent)}>
              <div className="card-bg-glow" style={{ background: getStatusColor(agent.status) }} />

              <div className="agent-header">
                <div className="agent-icon-wrapper">
                  <span className="agent-type-icon">{getTypeIcon(agent.type)}</span>
                </div>
                <div className={`status-badge ${agent.status}`}>
                  <span className="status-dot"></span>
                  {agent.status}
                </div>
              </div>

              <div className="agent-body">
                <h3 className="agent-name">{agent.name}</h3>
                <div className="agent-model-tag">{agent.config.model}</div>
                <p className="agent-description">{agent.description}</p>

                <div className="agent-capabilities">
                  {agent.capabilities.slice(0, 3).map((cap) => (
                    <span key={cap} className="capability-tag">
                      {cap}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span className="capability-tag more">+{agent.capabilities.length - 3}</span>
                  )}
                </div>
              </div>

              <div className="agent-footer">
                <div className="metrics">
                  <span className="metric-label">Tasks</span>
                  <span className="metric-value">{agent.tasks}</span>
                </div>
                <div className="actions">
                  <button
                    className={`control-btn ${agent.status === 'active' ? 'stop' : 'start'}`}
                    onClick={(e) => handleStartStop(e, agent)}
                    title={agent.status === 'active' ? 'Stop Agent' : 'Start Agent'}
                  >
                    {agent.status === 'active' ? '⏹' : '▶'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Agent Card */}
          <button className="add-agent-card" onClick={() => setShowCreateModal(true)}>
            <div className="add-content">
              <span className="add-icon">+</span>
              <span className="add-label">Deploy New Node</span>
            </div>
          </button>
        </div>
      )}

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onDelete={() => {
            deleteAgent(selectedAgent.id);
            setSelectedAgent(null);
          }}
        />
      )}

      {/* Create Agent Modal */}
      {showCreateModal && (
        <CreateAgentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (agent) => {
            await createAgent(agent);
            setShowCreateModal(false);
          }}
        />
      )}

      <style>{`
        .hub-container {
          padding: 32px;
          height: 100%;
          overflow-y: auto;
          background: var(--tnf-obsidian);
          color: #f1f5f9;
        }

        .hub-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .page-title {
          font-family: 'Outfit', sans-serif;
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }

        .page-subtitle {
          color: #64748b;
          margin: 4px 0 0;
          font-size: 14px;
        }

        .header-actions {
            display: flex;
            gap: 12px;
        }

        .create-btn {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
            transition: all 0.2s;
        }
        .create-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.5); }

        .refresh-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            color: #94a3b8;
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .refresh-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

        /* Stats Rail */
        .stats-rail {
            display: flex;
            gap: 16px;
            margin-bottom: 32px;
        }

        .stat-card {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 16px 24px;
            min-width: 160px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 24px; font-weight: 700; color: #f1f5f9; font-family: 'Outfit', sans-serif; }
        .stat-value.active { color: #10b981; }

        /* Filter Bar */
        .filter-bar {
            display: flex;
            gap: 8px;
            margin-bottom: 24px;
            padding: 4px;
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
            width: fit-content;
        }

        .filter-tab {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: transparent;
            border: none;
            border-radius: 8px;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 13px;
            font-weight: 500;
        }

        .filter-tab.active {
            background: rgba(255,255,255,0.08);
            color: #f1f5f9;
        }

        .tab-count {
            background: rgba(0,0,0,0.3);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
        }

        /* Agent Grid */
        .agent-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 24px;
        }

        .agent-card {
            background: rgba(30, 41, 59, 0.4);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 16px;
            padding: 24px;
            position: relative;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .agent-card:hover {
            transform: translateY(-4px);
            border-color: rgba(99, 102, 241, 0.3);
            box-shadow: 0 12px 30px rgba(0,0,0,0.3);
        }

        .card-bg-glow {
            position: absolute;
            top: 0;
            right: 0;
            width: 150px;
            height: 150px;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.1;
            transform: translated(30%, -30%);
            pointer-events: none;
        }

        .agent-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .agent-icon-wrapper {
            font-size: 32px;
            filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
        }

        .status-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            border: 1px solid transparent;
        }

        .status-badge.active { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.2); }
        .status-badge.idle { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.2); }
        .status-badge.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2); }

        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

        .agent-body {
            flex: 1;
        }

        .agent-name {
            margin: 0 0 4px;
            font-size: 18px;
            font-weight: 600;
            color: #f8fafc;
        }

        .agent-model-tag {
            display: inline-block;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: #94a3b8;
            background: rgba(0,0,0,0.2);
            padding: 2px 6px;
            border-radius: 4px;
            margin-bottom: 12px;
        }

        .agent-description {
            font-size: 14px;
            color: #94a3b8;
            line-height: 1.5;
            margin: 0 0 16px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .agent-capabilities {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .capability-tag {
            font-size: 11px;
            padding: 4px 8px;
            background: rgba(255,255,255,0.05);
            border-radius: 4px;
            color: #cbd5e1;
        }
        .capability-tag.more { background: transparent; color: #64748b; }

        .agent-footer {
            padding-top: 16px;
            border-top: 1px solid rgba(255,255,255,0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .metrics {
            display: flex;
            gap: 6px;
            font-size: 12px;
        }
        .metric-label { color: #64748b; }
        .metric-value { color: #f1f5f9; font-weight: 600; }

        .control-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 16px;
        }

        .control-btn.start { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .control-btn.start:hover { background: #10b981; color: white; }

        .control-btn.stop { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .control-btn.stop:hover { background: #ef4444; color: white; }

        /* Add New Card */
        .add-agent-card {
            background: rgba(255,255,255,0.02);
            border: 2px dashed rgba(255,255,255,0.1);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            min-height: 280px;
        }

        .add-agent-card:hover {
            border-color: #6366f1;
            background: rgba(99, 102, 241, 0.05);
        }

        .add-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            color: #64748b;
        }

        .add-icon { font-size: 32px; font-weight: 300; }
        .add-label { font-size: 14px; font-weight: 500; }

        /* Loading */
        .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 300px;
            color: #64748b;
            gap: 16px;
        }
        .spinner {
            width: 40px; height: 40px;
            border: 3px solid rgba(255,255,255,0.1);
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ==========================================
// MODALS (Internal Components)
// ==========================================

const AgentDetailModal: React.FC<{
  agent: Agent;
  onClose: () => void;
  onDelete: () => void;
}> = ({ agent, onClose, onDelete }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{agent.name}</h2>
            <span className="modal-id">ID: {agent.id}</span>
          </div>
          <button className="close-icon" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content-scroll">
          <div className="detail-row">
            <div className="detail-group">
              <label>Status</label>
              <span className={`status-tag ${agent.status}`}>{agent.status}</span>
            </div>
            <div className="detail-group">
              <label>Architecture</label>
              <span className="info-text">{agent.type}</span>
            </div>
            <div className="detail-group">
              <label>Model Core</label>
              <span className="info-text code-font">{agent.config.model}</span>
            </div>
          </div>

          <div className="detail-section">
            <label>Description</label>
            <p className="description-text">{agent.description}</p>
          </div>

          <div className="detail-section">
            <label>System Directive</label>
            <div className="code-block">
              {agent.config.systemPrompt || '// No system prompt configured'}
            </div>
          </div>

          <div className="detail-section">
            <label>Capabilities</label>
            <div className="tag-cloud">
              {agent.capabilities.map((c) => (
                <span key={c} className="tag">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <label>Toolchain</label>
            <div className="tag-cloud">
              {agent.config.tools.map((t) => (
                <span key={t} className="tag tool">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="danger-btn" onClick={onDelete}>
            Terminate Agent
          </button>
          <button className="primary-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
      <style>{`
        .modal-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(8px);
            z-index: 100;
            display: flex; align-items: center; justify-content: center;
        }
        .modal-glass {
            width: 600px;
            max-height: 85vh;
            background: #0f172a;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            display: flex; flex-direction: column;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .modal-header {
            padding: 24px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex; justify-content: space-between; align-items: flex-start;
            background: rgba(255,255,255,0.02);
        }
        .modal-title { margin: 0; font-size: 20px; font-weight: 600; color: #f8fafc; }
        .modal-id { font-size: 11px; color: #64748b; font-family: monospace; }
        .close-icon { background: none; border: none; color: #94a3b8; font-size: 24px; cursor: pointer; }

        .modal-content-scroll { padding: 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 24px; }

        .detail-row { display: flex; gap: 32px; }
        .detail-group label, .detail-section label {
            display: block; font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; font-weight: 600;
        }
        .info-text { font-size: 14px; color: #e2e8f0; }
        .code-font { font-family: 'JetBrains Mono', monospace; color: #f1f5f9; background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; }

        .status-tag { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status-tag.active { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .status-tag.idle { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .status-tag.error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

        .description-text { margin: 0; font-size: 14px; color: #cbd5e1; line-height: 1.6; }

        .code-block {
            background: #1e293b;
            padding: 12px;
            border-radius: 8px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: #bef264;
            white-space: pre-wrap;
            border: 1px solid rgba(255,255,255,0.05);
        }

        .tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
        .tag { background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px; font-size: 12px; color: #e2e8f0; border: 1px solid rgba(255,255,255,0.05); }
        .tag.tool { border-color: rgba(59, 130, 246, 0.3); color: #93c5fd; background: rgba(59, 130, 246, 0.1); }

        .modal-footer {
            padding: 16px 24px;
            border-top: 1px solid rgba(255,255,255,0.05);
            display: flex; justify-content: space-between;
            background: rgba(255,255,255,0.02);
        }

        .primary-btn { background: #6366f1; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .primary-btn:hover { background: #4f46e5; }
        .danger-btn { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
        .danger-btn:hover { background: rgba(239, 68, 68, 0.2); }
      `}</style>
    </div>
  );
};

const CreateAgentModal: React.FC<{
  onClose: () => void;
  onCreate: (agent: Partial<Agent>) => void;
}> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<Agent['type']>('custom');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState('');

  const handleCreate = () => {
    onCreate({
      name,
      type,
      description,
      capabilities: [],
      config: {
        model,
        temperature: 0.7,
        maxTokens: 4096,
        systemPrompt: '',
        tools: [],
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Deploy New Agent</h2>
          <button className="close-icon" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-content-scroll">
          <div className="form-group">
            <label>Agent Designation</label>
            <input
              type="text"
              className="glass-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nexus-7"
            />
          </div>
          <div className="form-group">
            <label>Architecture Type</label>
            <select
              className="glass-input"
              value={type}
              onChange={(e) => setType(e.target.value as Agent['type'])}
            >
              <option value="custom">⚙️ Custom Architecture</option>
              <option value="claude">🧠 Anthropic Claude</option>
              <option value="gpt">🤖 OpenAI GPT</option>
              <option value="gemini">💎 Google Gemini</option>
            </select>
          </div>
          <div className="form-group">
            <label>Model Core</label>
            <input
              type="text"
              className="glass-input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. claude-3-opus-20240229"
            />
          </div>
          <div className="form-group">
            <label>Mission Parameters</label>
            <textarea
              className="glass-input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Define primary objectives..."
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="text-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleCreate} disabled={!name}>
            Initialize
          </button>
        </div>
      </div>
      <style>{`
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 8px; }
        .glass-input {
            width: 100%;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
            padding: 12px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
        }
        .glass-input:focus { outline: none; border-color: #6366f1; background: rgba(0,0,0,0.5); }
        .text-btn { background: transparent; color: #cbd5e1; border: none; padding: 10px 20px; cursor: pointer; }
        .text-btn:hover { color: white; }
      `}</style>
    </div>
  );
};

export default AgentHub;
