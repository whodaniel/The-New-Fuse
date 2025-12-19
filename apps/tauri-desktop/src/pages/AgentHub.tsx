import React, { useEffect, useState } from 'react';
import { useAgentStore } from '../stores/agentStore';
import type { Agent } from '../types';

/**
 * Agent Hub Page - Full Featured
 * Manage and monitor your AI agent swarm
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

  const handleStartStop = async (agent: Agent) => {
    if (agent.status === 'active') {
      await stopAgent(agent.id);
    } else {
      await startAgent(agent.id);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Agent Hub</h1>
          <p className="page-subtitle">Manage your AI agent swarm</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={() => fetchAgents()}>
            🔄 Refresh
          </button>
          <button className="primary-button" onClick={() => setShowCreateModal(true)}>
            + Create Agent
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {(['all', 'active', 'idle', 'error'] as const).map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' && '📊 All'}
            {f === 'active' && '🟢 Active'}
            {f === 'idle' && '🟡 Idle'}
            {f === 'error' && '🔴 Error'}
            <span className="tab-count">
              {f === 'all' ? agents.length : agents.filter((a) => a.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Agent Stats */}
      <div className="agent-stats">
        <div className="stat-card mini">
          <span className="stat-value">{agents.filter((a) => a.status === 'active').length}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card mini">
          <span className="stat-value">{agents.reduce((sum, a) => sum + a.tasks, 0)}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
        <div className="stat-card mini">
          <span className="stat-value">{agents.length}</span>
          <span className="stat-label">Agents</span>
        </div>
      </div>

      {/* Agent Grid */}
      {loading ? (
        <div className="loading-state">Loading agents...</div>
      ) : (
        <div className="agent-grid">
          {filteredAgents.map((agent) => (
            <div key={agent.id} className="agent-card" onClick={() => setSelectedAgent(agent)}>
              <div className="agent-header">
                <span className="agent-type-icon">{getTypeIcon(agent.type)}</span>
                <div
                  className="agent-status-indicator"
                  style={{ backgroundColor: getStatusColor(agent.status) }}
                  title={agent.status}
                />
              </div>
              <h3 className="agent-name">{agent.name}</h3>
              <p className="agent-description">{agent.description}</p>
              <div className="agent-meta">
                <span className="agent-type">{agent.type}</span>
                <span className="agent-tasks">{agent.tasks} tasks</span>
              </div>
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
              <div className="agent-footer">
                <span className="last-active">Last: {agent.lastActive}</span>
                <div className="agent-actions">
                  <button
                    className={`action-btn ${agent.status === 'active' ? 'stop' : 'start'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartStop(agent);
                    }}
                    title={agent.status === 'active' ? 'Stop' : 'Start'}
                  >
                    {agent.status === 'active' ? '⏹️' : '▶️'}
                  </button>
                  <button
                    className="action-btn config"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAgent(agent);
                    }}
                    title="Configure"
                  >
                    ⚙️
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Agent Card */}
          <button className="agent-card add-card" onClick={() => setShowCreateModal(true)}>
            <span className="add-icon">+</span>
            <span className="add-label">Add New Agent</span>
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
          font-family: var(--tnf-font-heading, 'Outfit', sans-serif);
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-subtitle {
          color: var(--tnf-text-muted, #64748b);
          margin: 4px 0 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .primary-button {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
          color: white;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .secondary-button {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          color: var(--tnf-text-primary);
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .secondary-button:hover {
          background: var(--tnf-surface-hover);
        }

        /* Filter Tabs */
        .filter-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 20px;
          color: var(--tnf-text-muted);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .filter-tab:hover {
          background: var(--tnf-surface-hover);
        }

        .filter-tab.active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(118, 75, 162, 0.2));
          border-color: var(--tnf-primary);
          color: var(--tnf-text-primary);
        }

        .tab-count {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
        }

        /* Agent Stats */
        .agent-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card.mini {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 12px;
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-card.mini .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--tnf-primary-light);
        }

        .stat-card.mini .stat-label {
          font-size: 12px;
          color: var(--tnf-text-muted);
        }

        /* Agent Grid */
        .agent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .agent-card {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s;
          cursor: pointer;
        }

        .agent-card:hover {
          background: var(--tnf-surface-hover);
          border-color: var(--tnf-border-hover);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
        }

        .agent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .agent-type-icon {
          font-size: 32px;
        }

        .agent-status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          box-shadow: 0 0 8px currentColor;
        }

        .agent-name {
          font-family: var(--tnf-font-heading);
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px;
        }

        .agent-description {
          font-size: 13px;
          color: var(--tnf-text-muted);
          margin: 0 0 12px;
          line-height: 1.5;
        }

        .agent-meta {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--tnf-text-muted);
          margin-bottom: 12px;
        }

        .agent-capabilities {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }

        .capability-tag {
          background: rgba(99, 102, 241, 0.15);
          color: var(--tnf-primary-light);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
        }

        .capability-tag.more {
          background: rgba(255, 255, 255, 0.05);
          color: var(--tnf-text-muted);
        }

        .agent-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid var(--tnf-border);
        }

        .last-active {
          font-size: 12px;
          color: var(--tnf-text-muted);
        }

        .agent-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          background: var(--tnf-surface-hover);
          border: none;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: var(--tnf-surface-active);
        }

        .action-btn.start:hover { background: rgba(16, 185, 129, 0.2); }
        .action-btn.stop:hover { background: rgba(239, 68, 68, 0.2); }

        /* Add Card */
        .add-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border-style: dashed;
          min-height: 280px;
        }

        .add-card:hover {
          border-color: var(--tnf-primary);
          background: rgba(99, 102, 241, 0.05);
        }

        .add-icon {
          font-size: 40px;
          color: var(--tnf-text-muted);
        }

        .add-label {
          font-size: 14px;
          color: var(--tnf-text-muted);
        }

        .loading-state {
          text-align: center;
          padding: 60px;
          color: var(--tnf-text-muted);
        }
      `}</style>
    </div>
  );
};

// Agent Detail Modal Component
const AgentDetailModal: React.FC<{
  agent: Agent;
  onClose: () => void;
  onDelete: () => void;
}> = ({ agent, onClose, onDelete }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{agent.name}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="detail-section">
            <label>Status</label>
            <span className={`status-badge ${agent.status}`}>{agent.status}</span>
          </div>
          <div className="detail-section">
            <label>Type</label>
            <span>{agent.type}</span>
          </div>
          <div className="detail-section">
            <label>Model</label>
            <span>{agent.config.model}</span>
          </div>
          <div className="detail-section">
            <label>Description</label>
            <p>{agent.description}</p>
          </div>
          <div className="detail-section">
            <label>Capabilities</label>
            <div className="tags">
              {agent.capabilities.map((cap) => (
                <span key={cap} className="tag">
                  {cap}
                </span>
              ))}
            </div>
          </div>
          <div className="detail-section">
            <label>Tools</label>
            <div className="tags">
              {agent.config.tools.map((tool) => (
                <span key={tool} className="tag tool">
                  {tool}
                </span>
              ))}
            </div>
          </div>
          <div className="detail-section">
            <label>System Prompt</label>
            <pre className="system-prompt">{agent.config.systemPrompt}</pre>
          </div>
        </div>
        <div className="modal-footer">
          <button className="delete-btn" onClick={onDelete}>
            Delete Agent
          </button>
          <button className="primary-button" onClick={onClose}>
            Close
          </button>
        </div>
        <style>{`
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
            background: var(--tnf-obsidian, #0f172a);
            border: 1px solid var(--tnf-border);
            border-radius: 16px;
            width: 90%;
            max-width: 600px;
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
          .detail-section {
            margin-bottom: 20px;
          }
          .detail-section label {
            display: block;
            font-size: 12px;
            color: var(--tnf-text-muted);
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-badge.active { background: rgba(16, 185, 129, 0.2); color: #10b981; }
          .status-badge.idle { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
          .status-badge.error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
          .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .tag {
            background: rgba(99, 102, 241, 0.15);
            color: var(--tnf-primary-light);
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
          }
          .tag.tool {
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
          }
          .system-prompt {
            background: rgba(0, 0, 0, 0.3);
            padding: 12px;
            border-radius: 8px;
            font-size: 13px;
            white-space: pre-wrap;
            margin: 0;
          }
          .modal-footer {
            display: flex;
            justify-content: space-between;
            padding: 20px 24px;
            border-top: 1px solid var(--tnf-border);
          }
          .delete-btn {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
          }
          .delete-btn:hover {
            background: rgba(239, 68, 68, 0.25);
          }
          .primary-button {
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  );
};

// Create Agent Modal Component
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Agent</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Research Assistant"
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as Agent['type'])}>
              <option value="claude">🧠 Claude</option>
              <option value="gpt">🤖 GPT</option>
              <option value="gemini">💎 Gemini</option>
              <option value="perplexity">🔍 Perplexity</option>
              <option value="custom">⚙️ Custom</option>
              <option value="local">🏠 Local</option>
            </select>
          </div>
          <div className="form-group">
            <label>Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g., claude-3-sonnet"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              rows={3}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" onClick={handleCreate} disabled={!name}>
            Create Agent
          </button>
        </div>
        <style>{`
          .form-group {
            margin-bottom: 20px;
          }
          .form-group label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 8px;
          }
          .form-group input,
          .form-group select,
          .form-group textarea {
            width: 100%;
            padding: 12px;
            background: var(--tnf-surface);
            border: 1px solid var(--tnf-border);
            border-radius: 8px;
            color: var(--tnf-text-primary);
            font-size: 14px;
          }
          .form-group input:focus,
          .form-group select:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: var(--tnf-primary);
          }
          .secondary-button {
            background: var(--tnf-surface);
            border: 1px solid var(--tnf-border);
            color: var(--tnf-text-primary);
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AgentHub;
