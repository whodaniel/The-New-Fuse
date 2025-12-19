import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAgentStore } from '../stores/agentStore';
import type { ActivityItem, DashboardStats } from '../types';

/**
 * Dashboard Page - Unified Responsive Design
 * Combines best of SaaS + Tauri with mobile-first approach
 */
const Dashboard: React.FC = () => {
  const { agents } = useAgentStore();
  const [stats, setStats] = useState<DashboardStats>({
    activeAgents: 0,
    totalWorkflows: 0,
    tasksToday: 0,
    successRate: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const response = await apiService.getDashboardStats();
    if (response.success && response.data) {
      setStats(response.data);
    } else {
      // Use computed stats from agents store as fallback
      setStats({
        activeAgents: agents.filter((a) => a.status === 'active').length,
        totalWorkflows: 8,
        tasksToday: agents.reduce((sum, a) => sum + a.tasks, 0),
        successRate: 98,
        recentActivity: generateMockActivity(),
      });
    }
    setLoading(false);
  };

  const generateMockActivity = (): ActivityItem[] => [
    {
      id: '1',
      agentName: 'Research Bot',
      action: 'Completed web research task',
      status: 'success',
      timestamp: '2 min ago',
    },
    {
      id: '2',
      agentName: 'Code Assistant',
      action: 'Reviewed pull request #42',
      status: 'success',
      timestamp: '5 min ago',
    },
    {
      id: '3',
      agentName: 'Data Analyzer',
      action: 'Processing dataset',
      status: 'pending',
      timestamp: '8 min ago',
    },
    {
      id: '4',
      agentName: 'DevOps Bot',
      action: 'Failed deployment check',
      status: 'error',
      timestamp: '15 min ago',
    },
    {
      id: '5',
      agentName: 'Writer Agent',
      action: 'Generated blog draft',
      status: 'success',
      timestamp: '22 min ago',
    },
  ];

  const quickActions = [
    { icon: '🤖', label: 'New Agent', description: 'Create a new AI agent', action: '/agents' },
    { icon: '⚡', label: 'New Workflow', description: 'Build automation', action: '/workflows' },
    { icon: '💬', label: 'Start Chat', description: 'Talk to your agents', action: '/chat' },
    { icon: '🔧', label: 'Add Tool', description: 'Install MCP server', action: '/mcp' },
  ];

  return (
    <div className="dashboard-container">
      {/* Header - Responsive */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's your AI command center.</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchDashboardData}>
            🔄
          </button>
        </div>
      </header>

      {/* Stats Grid - Responsive: 2 cols mobile, 4 cols desktop */}
      <div className="stats-grid">
        <StatCard
          icon="🤖"
          label="Active Agents"
          value={stats.activeAgents}
          total={agents.length}
          gradient="purple"
        />
        <StatCard
          icon="⚡"
          label="Workflows"
          value={stats.totalWorkflows}
          change="+2 this week"
          gradient="blue"
        />
        <StatCard
          icon="✅"
          label="Tasks Today"
          value={stats.tasksToday}
          change="+15%"
          gradient="green"
        />
        <StatCard
          icon="📈"
          label="Success Rate"
          value={`${stats.successRate}%`}
          change="Excellent"
          gradient="cyan"
        />
      </div>

      {/* Main Content Grid - Responsive */}
      <div className="content-grid">
        {/* Quick Actions */}
        <section className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <button key={index} className="quick-action-card">
                <span className="action-icon">{action.icon}</span>
                <div className="action-content">
                  <span className="action-label">{action.label}</span>
                  <span className="action-description">{action.description}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="activity-section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-list">
            {stats.recentActivity.map((item) => (
              <div key={item.id} className="activity-item">
                <div className={`activity-status ${item.status}`}></div>
                <div className="activity-content">
                  <span className="activity-agent">{item.agentName}</span>
                  <span className="activity-action">{item.action}</span>
                </div>
                <span className="activity-time">{item.timestamp}</span>
              </div>
            ))}
          </div>
        </section>

        {/* System Health - Desktop only */}
        <section className="health-section">
          <h2 className="section-title">System Health</h2>
          <div className="health-metrics">
            <HealthMetric label="CPU" value={32} unit="%" status="good" />
            <HealthMetric label="Memory" value={4.2} unit="GB" status="good" />
            <HealthMetric label="API Latency" value={145} unit="ms" status="good" />
            <HealthMetric label="Uptime" value={99.9} unit="%" status="excellent" />
          </div>
        </section>

        {/* Active Agents Preview */}
        <section className="agents-preview-section">
          <h2 className="section-title">Active Agents</h2>
          <div className="agents-preview-list">
            {agents
              .filter((a) => a.status === 'active')
              .slice(0, 4)
              .map((agent) => (
                <div key={agent.id} className="agent-preview-item">
                  <span className="agent-type-emoji">
                    {agent.type === 'claude'
                      ? '🧠'
                      : agent.type === 'gpt'
                        ? '🤖'
                        : agent.type === 'gemini'
                          ? '💎'
                          : agent.type === 'perplexity'
                            ? '🔍'
                            : '⚙️'}
                  </span>
                  <div className="agent-preview-info">
                    <span className="agent-preview-name">{agent.name}</span>
                    <span className="agent-preview-status">Active • {agent.tasks} tasks</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>

      <style>{`
        /* Base Layout - Mobile First */
        .dashboard-container {
          padding: 16px;
          max-width: 1600px;
          margin: 0 auto;
          min-height: 100%;
        }

        /* Tablet+ */
        @media (min-width: 768px) {
          .dashboard-container {
            padding: 24px;
          }
        }

        /* Desktop */
        @media (min-width: 1024px) {
          .dashboard-container {
            padding: 32px;
          }
        }

        /* Header */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .page-title {
          font-family: var(--tnf-font-heading, 'Outfit', sans-serif);
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        @media (min-width: 768px) {
          .page-title {
            font-size: 36px;
          }
        }

        .page-subtitle {
          color: var(--tnf-text-muted, #64748b);
          font-size: 14px;
          margin: 4px 0 0;
        }

        .refresh-btn {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 10px;
          padding: 10px;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: var(--tnf-surface-hover);
          transform: rotate(180deg);
        }

        /* Stats Grid - 2x2 on mobile, 4x1 on desktop */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          }
        }

        /* Stat Card */
        .stat-card {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 16px;
          padding: 16px;
          transition: all 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2);
        }

        .stat-card.purple { border-top: 3px solid #8b5cf6; }
        .stat-card.blue { border-top: 3px solid #3b82f6; }
        .stat-card.green { border-top: 3px solid #10b981; }
        .stat-card.cyan { border-top: 3px solid #06b6d4; }

        .stat-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--tnf-text-primary);
          display: block;
        }

        @media (min-width: 768px) {
          .stat-value {
            font-size: 32px;
          }
        }

        .stat-label {
          font-size: 13px;
          color: var(--tnf-text-muted);
          display: block;
          margin-top: 4px;
        }

        .stat-change {
          font-size: 11px;
          color: var(--tnf-success, #10b981);
          margin-top: 8px;
          display: block;
        }

        .stat-total {
          font-size: 11px;
          color: var(--tnf-text-muted);
          margin-top: 4px;
        }

        /* Content Grid - Stack on mobile, 2 cols on desktop */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        @media (min-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }
        }

        .section-title {
          font-family: var(--tnf-font-heading);
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px;
          color: var(--tnf-text-primary);
        }

        /* Quick Actions */
        .quick-actions-section,
        .activity-section,
        .health-section,
        .agents-preview-section {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 16px;
          padding: 20px;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .quick-action-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: var(--tnf-surface-hover);
          border: 1px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .quick-action-card:hover {
          border-color: var(--tnf-primary);
          background: rgba(99, 102, 241, 0.1);
          transform: translateY(-2px);
        }

        .action-icon {
          font-size: 28px;
        }

        .action-content {
          display: flex;
          flex-direction: column;
        }

        .action-label {
          font-weight: 600;
          font-size: 14px;
        }

        .action-description {
          font-size: 11px;
          color: var(--tnf-text-muted);
        }

        /* Activity List */
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--tnf-surface-hover);
          border-radius: 10px;
        }

        .activity-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .activity-status.success { background: #10b981; box-shadow: 0 0 8px #10b981; }
        .activity-status.pending { background: #f59e0b; }
        .activity-status.error { background: #ef4444; }

        .activity-content {
          flex: 1;
          min-width: 0;
        }

        .activity-agent {
          display: block;
          font-weight: 500;
          font-size: 14px;
        }

        .activity-action {
          display: block;
          font-size: 12px;
          color: var(--tnf-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .activity-time {
          font-size: 11px;
          color: var(--tnf-text-muted);
          flex-shrink: 0;
        }

        /* Health Metrics */
        .health-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .health-metric {
          padding: 12px;
          background: var(--tnf-surface-hover);
          border-radius: 10px;
        }

        .health-label {
          font-size: 11px;
          color: var(--tnf-text-muted);
          text-transform: uppercase;
        }

        .health-value {
          font-size: 20px;
          font-weight: 600;
          color: var(--tnf-text-primary);
        }

        .health-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          margin-top: 8px;
          overflow: hidden;
        }

        .health-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .health-bar-fill.good { background: linear-gradient(90deg, #10b981, #06b6d4); }
        .health-bar-fill.excellent { background: linear-gradient(90deg, #8b5cf6, #06b6d4); }

        /* Agent Preview */
        .agents-preview-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .agent-preview-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--tnf-surface-hover);
          border-radius: 10px;
        }

        .agent-type-emoji {
          font-size: 24px;
        }

        .agent-preview-info {
          flex: 1;
        }

        .agent-preview-name {
          display: block;
          font-weight: 500;
        }

        .agent-preview-status {
          display: block;
          font-size: 12px;
          color: var(--tnf-text-muted);
        }

        /* Hide health section on mobile - show on desktop */
        .health-section {
          display: none;
        }

        @media (min-width: 1024px) {
          .health-section {
            display: block;
          }
        }
      `}</style>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: string;
  label: string;
  value: string | number;
  total?: number;
  change?: string;
  gradient: string;
}> = ({ icon, label, value, total, change, gradient }) => (
  <div className={`stat-card ${gradient}`}>
    <span className="stat-icon">{icon}</span>
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
    {total !== undefined && <span className="stat-total">of {total} total</span>}
    {change && <span className="stat-change">{change}</span>}
  </div>
);

// Health Metric Component
const HealthMetric: React.FC<{
  label: string;
  value: number;
  unit: string;
  status: 'good' | 'excellent' | 'warning';
}> = ({ label, value, unit, status }) => (
  <div className="health-metric">
    <span className="health-label">{label}</span>
    <span className="health-value">
      {value}
      {unit}
    </span>
    <div className="health-bar">
      <div
        className={`health-bar-fill ${status}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      ></div>
    </div>
  </div>
);

export default Dashboard;
