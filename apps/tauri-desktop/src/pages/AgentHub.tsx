import React, { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  type: 'claude' | 'gemini' | 'gpt' | 'perplexity' | 'custom';
  status: 'active' | 'idle' | 'error';
  tasks: number;
  lastActive: string;
}

/**
 * Agent Hub Page - The New Fuse Desktop
 * Manage and monitor your AI agents
 */
const AgentHub: React.FC = () => {
  const [agents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Research Assistant',
      type: 'perplexity',
      status: 'active',
      tasks: 15,
      lastActive: 'Now',
    },
    {
      id: '2',
      name: 'Code Reviewer',
      type: 'claude',
      status: 'idle',
      tasks: 42,
      lastActive: '5 min ago',
    },
    {
      id: '3',
      name: 'Content Writer',
      type: 'gpt',
      status: 'active',
      tasks: 28,
      lastActive: 'Now',
    },
    {
      id: '4',
      name: 'Data Analyst',
      type: 'gemini',
      status: 'error',
      tasks: 7,
      lastActive: '1 hour ago',
    },
  ]);

  const getTypeIcon = (type: Agent['type']) => {
    const icons = { claude: '🧠', gemini: '💎', gpt: '🤖', perplexity: '🔍', custom: '⚙️' };
    return icons[type];
  };

  const getStatusColor = (status: Agent['status']) => {
    const colors = { active: '#10b981', idle: '#f59e0b', error: '#ef4444' };
    return colors[status];
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Agent Hub</h1>
          <p className="page-subtitle">Manage your AI agent swarm</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button">Import Agent</button>
          <button className="primary-button">+ Create Agent</button>
        </div>
      </header>

      {/* Agent Stats */}
      <div className="agent-stats">
        <div className="stat-pill">
          <span className="stat-dot active"></span>
          <span>{agents.filter((a) => a.status === 'active').length} Active</span>
        </div>
        <div className="stat-pill">
          <span className="stat-dot idle"></span>
          <span>{agents.filter((a) => a.status === 'idle').length} Idle</span>
        </div>
        <div className="stat-pill">
          <span className="stat-dot error"></span>
          <span>{agents.filter((a) => a.status === 'error').length} Error</span>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="agent-grid">
        {agents.map((agent) => (
          <div key={agent.id} className="agent-card">
            <div className="agent-header">
              <span className="agent-type-icon">{getTypeIcon(agent.type)}</span>
              <div
                className="agent-status-indicator"
                style={{ background: getStatusColor(agent.status) }}
              ></div>
            </div>
            <h3 className="agent-name">{agent.name}</h3>
            <div className="agent-meta">
              <span className="agent-type">
                {agent.type.charAt(0).toUpperCase() + agent.type.slice(1)}
              </span>
              <span className="agent-tasks">{agent.tasks} tasks</span>
            </div>
            <div className="agent-footer">
              <span className="last-active">Last active: {agent.lastActive}</span>
              <div className="agent-actions">
                <button className="icon-button" title="Configure">
                  ⚙️
                </button>
                <button className="icon-button" title="Pause">
                  ⏸️
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Agent Card */}
        <button className="agent-card add-card">
          <span className="add-icon">+</span>
          <span className="add-label">Add New Agent</span>
        </button>
      </div>

      <style>{`
        .page-container {
          padding: 32px;
          max-width: 1400px;
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
          border-color: var(--tnf-border-hover);
        }

        /* Agent Stats */
        .agent-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
        }

        .stat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .stat-dot.active { background: #10b981; box-shadow: 0 0 8px #10b981; }
        .stat-dot.idle { background: #f59e0b; }
        .stat-dot.error { background: #ef4444; }

        /* Agent Grid */
        .agent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .agent-card {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s;
          backdrop-filter: blur(24px);
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
          font-size: 28px;
        }

        .agent-status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          box-shadow: 0 0 8px currentColor;
        }

        .agent-name {
          font-family: var(--tnf-font-heading);
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 12px;
        }

        .agent-meta {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--tnf-text-muted);
          margin-bottom: 16px;
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

        .icon-button {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .icon-button:hover {
          background: var(--tnf-surface-active);
        }

        /* Add Card */
        .add-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          border-style: dashed;
          min-height: 200px;
        }

        .add-card:hover {
          border-color: var(--tnf-primary);
          background: rgba(99, 102, 241, 0.05);
        }

        .add-icon {
          font-size: 36px;
          color: var(--tnf-text-muted);
        }

        .add-label {
          font-size: 14px;
          color: var(--tnf-text-muted);
        }
      `}</style>
    </div>
  );
};

export default AgentHub;
