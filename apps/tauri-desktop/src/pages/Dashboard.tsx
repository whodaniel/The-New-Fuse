import React from 'react';

/**
 * Dashboard Page - The New Fuse Desktop
 * "World Class or Nothing"
 */
const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Active Agents', value: '12', color: 'agents', icon: '🤖' },
    { label: 'Workflows', value: '8', color: 'tools', icon: '⚡' },
    { label: 'Tasks Today', value: '47', color: 'prompts', icon: '📋' },
    { label: 'Success Rate', value: '98%', color: 'logic', icon: '📈' },
  ];

  const recentActivity = [
    {
      agent: 'Research Bot',
      action: 'Completed web scraping task',
      time: '2 min ago',
      status: 'success',
    },
    {
      agent: 'Code Assistant',
      action: 'Fixed 3 TypeScript errors',
      time: '15 min ago',
      status: 'success',
    },
    {
      agent: 'Data Analyzer',
      action: 'Processing dataset...',
      time: 'In progress',
      status: 'pending',
    },
    { agent: 'Content Writer', action: 'Drafted blog post', time: '1 hour ago', status: 'success' },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening.</p>
        </div>
        <button className="primary-button">
          <span>+ New Agent</span>
        </button>
      </header>

      {/* Stats Grid */}
      <section className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card stat-${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Recent Activity */}
      <section className="activity-section">
        <h2 className="section-title">Recent Activity</h2>
        <div className="activity-list">
          {recentActivity.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-dot" data-status={activity.status}></div>
              <div className="activity-content">
                <div className="activity-agent">{activity.agent}</div>
                <div className="activity-action">{activity.action}</div>
              </div>
              <div className="activity-time">{activity.time}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="action-grid">
          <button className="action-card">
            <span className="action-icon">🚀</span>
            <span className="action-label">Deploy Agent</span>
          </button>
          <button className="action-card">
            <span className="action-icon">📊</span>
            <span className="action-label">View Analytics</span>
          </button>
          <button className="action-card">
            <span className="action-icon">🔧</span>
            <span className="action-label">Configure MCP</span>
          </button>
          <button className="action-card">
            <span className="action-icon">📝</span>
            <span className="action-label">Create Workflow</span>
          </button>
        </div>
      </section>

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
          margin-bottom: 32px;
        }

        .page-title {
          font-family: var(--tnf-font-heading, 'Outfit', sans-serif);
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-subtitle {
          color: var(--tnf-text-muted, #64748b);
          margin: 4px 0 0;
        }

        .primary-button {
          background: linear-gradient(135deg, var(--tnf-primary-start, #667eea), var(--tnf-primary-end, #764ba2));
          border: none;
          color: white;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: var(--tnf-surface, rgba(255, 255, 255, 0.02));
          border: 1px solid var(--tnf-border, rgba(255, 255, 255, 0.08));
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          backdrop-filter: blur(24px);
          transition: all 0.2s;
        }

        .stat-card:hover {
          background: var(--tnf-surface-hover, rgba(255, 255, 255, 0.05));
          border-color: var(--tnf-border-hover, rgba(255, 255, 255, 0.12));
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 32px;
        }

        .stat-value {
          font-family: var(--tnf-font-heading, 'Outfit', sans-serif);
          font-size: 28px;
          font-weight: 700;
        }

        .stat-label {
          font-size: 13px;
          color: var(--tnf-text-muted);
        }

        .stat-agents .stat-value { color: var(--tnf-agents, #4f46e5); }
        .stat-tools .stat-value { color: var(--tnf-tools, #10b981); }
        .stat-prompts .stat-value { color: var(--tnf-prompts, #8b5cf6); }
        .stat-logic .stat-value { color: var(--tnf-logic, #f59e0b); }

        /* Section Title */
        .section-title {
          font-family: var(--tnf-font-heading, 'Outfit', sans-serif);
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        /* Activity Section */
        .activity-section {
          margin-bottom: 40px;
        }

        .activity-list {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 16px;
          overflow: hidden;
        }

        .activity-item {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--tnf-border);
          gap: 16px;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .activity-dot[data-status="success"] {
          background: var(--tnf-success, #10b981);
          box-shadow: 0 0 8px var(--tnf-success);
        }

        .activity-dot[data-status="pending"] {
          background: var(--tnf-warning, #f59e0b);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .activity-content {
          flex: 1;
        }

        .activity-agent {
          font-weight: 600;
          font-size: 14px;
        }

        .activity-action {
          color: var(--tnf-text-muted);
          font-size: 13px;
        }

        .activity-time {
          font-size: 12px;
          color: var(--tnf-text-muted);
        }

        /* Quick Actions */
        .action-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
        }

        .action-card {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-card:hover {
          background: var(--tnf-surface-hover);
          border-color: var(--tnf-primary);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .action-icon {
          font-size: 28px;
        }

        .action-label {
          font-weight: 500;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
