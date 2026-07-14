import React, { useState } from 'react';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import { useOperatorSynergy } from '../hooks/useOperatorSynergy';

const Analytics: React.FC = () => {
  const { state: synergy } = useOperatorSynergy();
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'agents' | 'costs'>(
    'overview'
  );
  const [exporting, setExporting] = useState(false);

  const {
    loading,
    dataSource,
    fetchError,
    overview,
    performanceData,
    performanceAvailable,
    agentMetrics,
    agentMetricsAvailable,
    providerMetrics,
    providerMetricsAvailable,
    maxRequests,
    exportData,
  } = useAnalyticsData(synergy, timeRange);

  const activeRate =
    overview.totalAgents > 0 ? Math.round((overview.activeAgents / overview.totalAgents) * 100) : 0;

  const fmtNum = (value: number | null) => (value == null ? '—' : value.toLocaleString());
  const fmtPct = (value: number | null) => (value == null ? '—' : `${value}%`);
  const fmtMs = (value: number | null) => (value == null ? '—' : `${value}ms`);
  const fmtCost = (value: number | null) => (value == null ? '—' : `$${value.toFixed(2)}`);
  const totalCost = providerMetrics.reduce<number | null>((sum, p) => {
    if (p.cost == null) return sum;
    return (sum ?? 0) + p.cost;
  }, null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportData();
      const blob = new Blob([JSON.stringify(result.payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `tnf-analytics-${timeRange}-${result.source}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <PageShell
      title="Analytics"
      subtitle={
        dataSource === 'api'
          ? `Live API metrics · ${overview.totalAgents} agents · ${timeRange}`
          : `Live agent roster · ${synergy.unifiedAgents.length} agents · usage metrics need REST API`
      }
      banner={
        fetchError ? (
          <div className="offline-banner" role="status">
            {fetchError}
          </div>
        ) : dataSource === 'api' ? (
          <div className="info-banner" role="status">
            Overview metrics from REST API (port 3001).
            {!performanceAvailable && ' Request volume not returned by API.'}
            {!providerMetricsAvailable && ' Provider usage/cost not returned by API.'}
            {' Agent rows show the live roster; per-agent metrics not yet provided by the API.'}
          </div>
        ) : null
      }
      actions={
        <>
          <select
            className="time-select secondary-button"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            aria-label="Time range"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void handleExport()}
            disabled={exporting || loading}
          >
            {exporting ? 'Exporting…' : 'Export'}
          </button>
        </>
      }
    >
      <SynergyStatusBar />
      <div className="analytics-container">
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
                value={fmtNum(overview.totalInteractions)}
                subtitle={
                  overview.averageResponseTime == null
                    ? 'Requires REST API'
                    : `${overview.averageResponseTime}ms avg response`
                }
                color="blue"
              />
              <StatCard
                icon="✅"
                label="Success Rate"
                value={fmtPct(overview.successRate)}
                subtitle="Across all agents"
                color="green"
              />
              <StatCard
                icon="⚡"
                label="Workflows"
                value={fmtNum(overview.totalWorkflows)}
                subtitle="Executed successfully"
                color="orange"
              />
              <StatCard
                icon="⏱️"
                label="Avg Response"
                value={fmtMs(overview.averageResponseTime)}
                subtitle="Fleet performance"
                color="cyan"
              />
              <StatCard
                icon="📊"
                label="Active Rate"
                value={`${activeRate}%`}
                subtitle="Agent utilization"
                color="pink"
              />
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && !performanceAvailable && (
            <div className="performance-section">
              <div className="chart-card">
                <h3 className="chart-title">Request Volume</h3>
                <div className="empty-state" role="status">
                  Time-series request metrics are only available from the REST API (port 3001).
                  Start the TNF API to populate this chart.
                </div>
              </div>
            </div>
          )}
          {activeTab === 'performance' && performanceAvailable && (
            <div className="performance-section">
              <div className="chart-card">
                <h3 className="chart-title">Request Volume</h3>
                <div className="bar-chart">
                  {performanceData.map((point, index) => (
                    <div key={index} className="bar-group">
                      <div className="bar-container">
                        <div
                          className="bar requests"
                          style={{ height: `${(point.requests / maxRequests) * 100}%` }}
                          title={`${point.requests} requests`}
                        ></div>
                        <div
                          className="bar responses"
                          style={{ height: `${(point.responses / maxRequests) * 100}%` }}
                          title={`${point.responses} responses`}
                        ></div>
                        <div
                          className="bar errors"
                          style={{
                            height: `${Math.min(100, (point.errors / maxRequests) * 100 * 5)}%`,
                          }}
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
                {!agentMetricsAvailable && (
                  <div className="empty-state" role="status">
                    Live agent roster shown. Per-agent task, success and latency metrics require the
                    REST API (port 3001) and appear as “—” until then.
                  </div>
                )}
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
                          <td>{fmtNum(agent.totalTasks)}</td>
                          <td>
                            {agent.successRate == null ? (
                              <span className="progress-value muted">—</span>
                            ) : (
                              <div className="progress-cell">
                                <div className="progress-bar">
                                  <div
                                    className="progress-fill"
                                    style={{ width: `${agent.successRate}%` }}
                                  ></div>
                                </div>
                                <span className="progress-value">{agent.successRate}%</span>
                              </div>
                            )}
                          </td>
                          <td>{fmtMs(agent.avgResponseTime)}</td>
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
          {activeTab === 'costs' && !providerMetricsAvailable && (
            <div className="costs-grid single">
              <div className="cost-summary-card">
                <h3>Cost Analytics</h3>
                <div className="empty-state" role="status">
                  Usage and cost metrics are only available from the REST API (port 3001). The live
                  synergy roster does not include billing data.
                </div>
                {providerMetrics.length > 0 && (
                  <div className="provider-list" style={{ marginTop: 16 }}>
                    {providerMetrics.map((provider) => (
                      <div key={provider.provider} className="provider-row">
                        <div className="provider-info">
                          <span className="provider-name">{provider.provider}</span>
                          <span className="provider-requests">
                            {provider.agentCount ?? 0} agent
                            {(provider.agentCount ?? 0) === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div className="provider-cost muted">—</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'costs' && providerMetricsAvailable && (
            <div className="costs-grid">
              <div className="cost-summary-card">
                <h3>Total Cost</h3>
                <div className="total-cost">{fmtCost(totalCost)}</div>
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
                          {fmtNum(provider.totalRequests)} requests
                        </span>
                      </div>
                      <div className="provider-cost">{fmtCost(provider.cost)}</div>
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
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          display: block;
          color: var(--tnf-text-primary, #f8fafc);
        }
        .stat-label {
          font-size: 13px;
          color: var(--tnf-text-secondary, #cbd5e1);
          display: block;
          margin-top: 4px;
        }
        .stat-subtitle {
          font-size: 11px;
          color: var(--tnf-text-muted, #94a3b8);
          display: block;
          margin-top: 8px;
        }

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

        /* Empty / unavailable states */
        .empty-state {
          padding: 20px;
          border: 1px dashed var(--tnf-border);
          border-radius: 12px;
          color: var(--tnf-text-muted);
          font-size: 13px;
          line-height: 1.6;
          background: rgba(255, 255, 255, 0.02);
        }

        .muted {
          color: var(--tnf-text-muted);
        }

        /* Costs */
        .costs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        @media (min-width: 768px) {
          .costs-grid:not(.single) {
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
    </PageShell>
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
