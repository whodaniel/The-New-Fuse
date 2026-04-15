import React, { useEffect, useState } from 'react';

/**
 * Analytics Page - Responsive Charts and Metrics
 * Unified from SaaS implementation with Tauri optimizations
 */

// Types for analytics data
interface AnalyticsOverview {
  totalAgents: number;
  activeAgents: number;
  totalInteractions: number;
  successRate: number;
  averageResponseTime: number;
  totalWorkflows: number;
}

interface PerformanceDataPoint {
  timestamp: string;
  requests: number;
  responses: number;
  errors: number;
}

interface AgentMetric {
  agentId: string;
  agentName: string;
  totalTasks: number;
  successRate: number;
  avgResponseTime: number;
  lastActive: string;
}

interface ProviderMetric {
  provider: string;
  totalRequests: number;
  successRate: number;
  avgLatency: number;
  cost: number;
}

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'agents' | 'costs'>(
    'overview'
  );

  // Mock data - would come from API
  const [overview] = useState<AnalyticsOverview>({
    totalAgents: 24,
    activeAgents: 18,
    totalInteractions: 15420,
    successRate: 98.5,
    averageResponseTime: 245,
    totalWorkflows: 156,
  });

  const [performanceData] = useState<PerformanceDataPoint[]>(
    Array.from({ length: 7 }, (_, i) => ({
      timestamp: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      requests: Math.floor(Math.random() * 500) + 300,
      responses: Math.floor(Math.random() * 480) + 280,
      errors: Math.floor(Math.random() * 20) + 5,
    }))
  );

  const [agentMetrics] = useState<AgentMetric[]>([
    {
      agentId: '1',
      agentName: 'Research Assistant',
      totalTasks: 342,
      successRate: 99.2,
      avgResponseTime: 156,
      lastActive: '2 min ago',
    },
    {
      agentId: '2',
      agentName: 'Code Reviewer',
      totalTasks: 289,
      successRate: 97.8,
      avgResponseTime: 203,
      lastActive: '5 min ago',
    },
    {
      agentId: '3',
      agentName: 'Content Writer',
      totalTasks: 198,
      successRate: 98.5,
      avgResponseTime: 189,
      lastActive: '12 min ago',
    },
    {
      agentId: '4',
      agentName: 'Data Analyst',
      totalTasks: 156,
      successRate: 96.4,
      avgResponseTime: 267,
      lastActive: '1 hr ago',
    },
  ]);

  const [providerMetrics] = useState<ProviderMetric[]>([
    { provider: 'OpenAI', totalRequests: 5420, successRate: 99.1, avgLatency: 145, cost: 1247.5 },
    { provider: 'Anthropic', totalRequests: 3892, successRate: 98.7, avgLatency: 203, cost: 892.3 },
    { provider: 'Google', totalRequests: 2108, successRate: 97.9, avgLatency: 189, cost: 707.7 },
    { provider: 'Local', totalRequests: 856, successRate: 99.5, avgLatency: 45, cost: 0 },
  ]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Header */}
      <header className="analytics-header">
        <div>
          <h1 className="page-title">📊 Analytics</h1>
          <p className="page-subtitle">Monitor performance and usage metrics</p>
        </div>
        <div className="header-controls">
          <select
            className="time-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="export-btn">📥 Export</button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tab-nav">
        {(['overview', 'performance', 'agents', 'costs'] as const).map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && '📈'}
            {tab === 'performance' && '⚡'}
            {tab === 'agents' && '🤖'}
            {tab === 'costs' && '💰'}
            <span className="tab-label">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <StatCard
              icon="🤖"
              label="Total Agents"
              value={overview.totalAgents}
              subtitle={`${overview.activeAgents} active`}
              color="purple"
            />
            <StatCard
              icon="💬"
              label="Total Interactions"
              value={overview.totalInteractions.toLocaleString()}
              subtitle={`${overview.averageResponseTime}ms avg response`}
              color="blue"
            />
            <StatCard
              icon="✅"
              label="Success Rate"
              value={`${overview.successRate}%`}
              subtitle="Across all agents"
              color="green"
            />
            <StatCard
              icon="⚡"
              label="Workflows"
              value={overview.totalWorkflows}
              subtitle="Executed successfully"
              color="orange"
            />
            <StatCard
              icon="⏱️"
              label="Avg Response"
              value={`${overview.averageResponseTime}ms`}
              subtitle="Fleet performance"
              color="cyan"
            />
            <StatCard
              icon="📊"
              label="Active Rate"
              value={`${Math.round((overview.activeAgents / overview.totalAgents) * 100)}%`}
              subtitle="Agent utilization"
              color="pink"
            />
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="performance-section">
            <div className="chart-card">
              <h3 className="chart-title">Request Volume</h3>
              <div className="bar-chart">
                {performanceData.map((point, index) => (
                  <div key={index} className="bar-group">
                    <div className="bar-container">
                      <div
                        className="bar requests"
                        style={{ height: `${(point.requests / 800) * 100}%` }}
                        title={`${point.requests} requests`}
                      ></div>
                      <div
                        className="bar responses"
                        style={{ height: `${(point.responses / 800) * 100}%` }}
                        title={`${point.responses} responses`}
                      ></div>
                      <div
                        className="bar errors"
                        style={{ height: `${(point.errors / 800) * 100 * 5}%` }}
                        title={`${point.errors} errors`}
                      ></div>
                    </div>
                    <span className="bar-label">{point.timestamp}</span>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span className="legend-item">
                  <span className="dot requests"></span> Requests
                </span>
                <span className="legend-item">
                  <span className="dot responses"></span> Responses
                </span>
                <span className="legend-item">
                  <span className="dot errors"></span> Errors
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="agents-table-section">
            <div className="table-card">
              <h3 className="table-title">Agent Performance</h3>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Tasks</th>
                      <th>Success</th>
                      <th>Response</th>
                      <th>Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentMetrics.map((agent) => (
                      <tr key={agent.agentId}>
                        <td className="agent-cell">
                          <span className="agent-icon">🤖</span>
                          <span>{agent.agentName}</span>
                        </td>
                        <td>{agent.totalTasks}</td>
                        <td>
                          <div className="progress-cell">
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${agent.successRate}%` }}
                              ></div>
                            </div>
                            <span className="progress-value">{agent.successRate}%</span>
                          </div>
                        </td>
                        <td>{agent.avgResponseTime}ms</td>
                        <td className="time-cell">{agent.lastActive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Costs Tab */}
        {activeTab === 'costs' && (
          <div className="costs-grid">
            <div className="cost-summary-card">
              <h3>Total Cost</h3>
              <div className="total-cost">
                ${providerMetrics.reduce((sum, p) => sum + p.cost, 0).toFixed(2)}
              </div>
              <div className="cost-period">Last {timeRange}</div>
            </div>
            <div className="provider-costs-card">
              <h3>Cost by Provider</h3>
              <div className="provider-list">
                {providerMetrics.map((provider) => (
                  <div key={provider.provider} className="provider-row">
                    <div className="provider-info">
                      <span className="provider-name">{provider.provider}</span>
                      <span className="provider-requests">
                        {provider.totalRequests.toLocaleString()} requests
                      </span>
                    </div>
                    <div className="provider-cost">${provider.cost.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .analytics-container {
          padding: 16px;
          max-width: 1600px;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .analytics-container { padding: 24px; }
        }

        @media (min-width: 1024px) {
          .analytics-container { padding: 32px; }
        }

        /* Header */
        .analytics-header {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (min-width: 768px) {
          .analytics-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        .page-title {
          font-family: var(--tnf-font-heading);
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-subtitle {
          color: var(--tnf-text-muted);
          margin: 4px 0 0;
        }

        .header-controls {
          display: flex;
          gap: 12px;
        }

        .time-select {
          padding: 10px 16px;
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 10px;
          color: var(--tnf-text-primary);
          cursor: pointer;
        }

        .export-btn {
          padding: 10px 16px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 500;
          cursor: pointer;
        }

        /* Tab Navigation */
        .tab-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 12px;
          color: var(--tnf-text-muted);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: var(--tnf-surface-hover);
        }

        .tab-btn.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
          border-color: #3b82f6;
          color: var(--tnf-text-primary);
        }

        .tab-label {
          display: none;
        }

        @media (min-width: 640px) {
          .tab-label {
            display: inline;
          }
        }

        /* Overview Grid */
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (min-width: 768px) {
          .overview-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .overview-grid {
            grid-template-columns: repeat(6, 1fr);
          }
        }

        /* Stat Card */
        .stat-card {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 16px;
          padding: 20px;
        }

        .stat-card.purple { border-left: 4px solid #8b5cf6; }
        .stat-card.blue { border-left: 4px solid #3b82f6; }
        .stat-card.green { border-left: 4px solid #10b981; }
        .stat-card.orange { border-left: 4px solid #f59e0b; }
        .stat-card.cyan { border-left: 4px solid #06b6d4; }
        .stat-card.pink { border-left: 4px solid #ec4899; }

        .stat-icon { font-size: 24px; display: block; margin-bottom: 12px; }
        .stat-value { font-size: 24px; font-weight: 700; display: block; }
        .stat-label { font-size: 13px; color: var(--tnf-text-muted); display: block; margin-top: 4px; }
        .stat-subtitle { font-size: 11px; color: var(--tnf-text-muted); display: block; margin-top: 8px; }

        /* Chart Card */
        .chart-card {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 16px;
          padding: 24px;
        }

        .chart-title {
          font-family: var(--tnf-font-heading);
          margin: 0 0 20px;
        }

        .bar-chart {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 200px;
          padding: 20px 0;
        }

        .bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }

        .bar-container {
          display: flex;
          gap: 4px;
          align-items: flex-end;
          height: 160px;
        }

        .bar {
          width: 16px;
          border-radius: 4px 4px 0 0;
          transition: height 0.3s ease;
        }

        @media (min-width: 768px) {
          .bar { width: 24px; }
        }

        .bar.requests { background: linear-gradient(180deg, #8b5cf6, #6366f1); }
        .bar.responses { background: linear-gradient(180deg, #10b981, #059669); }
        .bar.errors { background: linear-gradient(180deg, #ef4444, #dc2626); }

        .bar-label {
          font-size: 11px;
          color: var(--tnf-text-muted);
          margin-top: 8px;
        }

        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 16px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--tnf-text-muted);
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .dot.requests { background: #8b5cf6; }
        .dot.responses { background: #10b981; }
        .dot.errors { background: #ef4444; }

        /* Table */
        .table-card {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 16px;
          padding: 24px;
        }

        .table-title {
          font-family: var(--tnf-font-heading);
          margin: 0 0 20px;
        }

        .table-scroll {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          text-align: left;
          padding: 12px;
          font-size: 11px;
          font-weight: 600;
          color: var(--tnf-text-muted);
          text-transform: uppercase;
          border-bottom: 1px solid var(--tnf-border);
        }

        .data-table td {
          padding: 16px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .data-table tr:hover {
          background: var(--tnf-surface-hover);
        }

        .agent-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .agent-icon {
          font-size: 20px;
        }

        .progress-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-bar {
          width: 60px;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #06b6d4);
          border-radius: 3px;
        }

        .progress-value {
          color: #10b981;
          font-weight: 500;
        }

        .time-cell {
          color: var(--tnf-text-muted);
        }

        /* Costs */
        .costs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        @media (min-width: 768px) {
          .costs-grid {
            grid-template-columns: 300px 1fr;
          }
        }

        .cost-summary-card,
        .provider-costs-card {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 16px;
          padding: 24px;
        }

        .cost-summary-card h3,
        .provider-costs-card h3 {
          font-family: var(--tnf-font-heading);
          margin: 0 0 16px;
          font-size: 16px;
        }

        .total-cost {
          font-size: 48px;
          font-weight: 700;
          background: linear-gradient(135deg, #10b981, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .cost-period {
          font-size: 13px;
          color: var(--tnf-text-muted);
          margin-top: 8px;
        }

        .provider-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .provider-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: var(--tnf-surface-hover);
          border-radius: 12px;
        }

        .provider-name {
          font-weight: 600;
          display: block;
        }

        .provider-requests {
          font-size: 12px;
          color: var(--tnf-text-muted);
        }

        .provider-cost {
          font-size: 18px;
          font-weight: 700;
          color: var(--tnf-primary-light);
        }

        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--tnf-text-muted);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--tnf-border);
          border-top-color: var(--tnf-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
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
  subtitle: string;
  color: string;
}> = ({ icon, label, value, subtitle, color }) => (
  <div className={`stat-card ${color}`}>
    <span className="stat-icon">{icon}</span>
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
    <span className="stat-subtitle">{subtitle}</span>
  </div>
);

export default Analytics;
