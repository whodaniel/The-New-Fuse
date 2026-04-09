/**
 * Modern Hub - Beautiful AI Agent & Workflow Interface
 * Integrated React component for The New Fuse Browser Hub
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ModernHub.css';

interface ServiceStatus {
  name: string;
  status: 'active' | 'inactive' | 'warning';
  port?: number;
}

interface SystemMetrics {
  activeWorkflows: number;
  completedTasks: number;
  systemUptime: string;
  responseTime: string;
}

export const ModernHub: React.FC = () => {
  const navigate = useNavigate();
  const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';
  const [services, setServices] = useState<Record<string, ServiceStatus[]>>({
    'ai-services': [
      { name: 'Claude AI', status: 'active' },
      { name: 'Gemini', status: 'active' },
      { name: 'ChatGPT', status: 'active' },
      { name: 'Perplexity', status: 'active' },
    ],
    'workflow-services': [
      { name: 'Builder', status: 'active' },
      { name: 'My Workflows', status: 'active' },
      { name: 'Execute', status: 'inactive' },
      { name: 'Analytics', status: 'inactive' },
    ],
    'dev-services': [
      { name: 'Theia IDE', status: 'active', port: 3000 },
      { name: 'VS Code', status: 'inactive' },
      { name: 'Terminal', status: 'active' },
      { name: 'GitHub', status: 'inactive' },
    ],
    'automation-services': [
      { name: 'MCP Server', status: 'active' },
      { name: 'Puppeteer', status: 'active' },
      { name: 'Screenshot', status: 'active' },
      { name: 'Run Tests', status: 'active' },
    ],
  });

  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeWorkflows: 12,
    completedTasks: 1247,
    systemUptime: '99.9%',
    responseTime: '0.3s',
  });

  const [coreStatus, setCoreStatus] = useState<'active' | 'warning' | 'error'>('active');
  const [aiStatus, setAiStatus] = useState<'active' | 'warning' | 'error'>('active');
  const [workflowStatus, setWorkflowStatus] = useState<'active' | 'warning' | 'error'>('active');

  useEffect(() => {
    refreshHubData();
    const refreshInterval = setInterval(refreshHubData, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  const formatUptime = (uptimeSeconds?: number): string => {
    if (!uptimeSeconds || !Number.isFinite(uptimeSeconds)) return 'N/A';
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getServiceState = (value?: string): 'active' | 'inactive' | 'warning' => {
    if (value === 'online' || value === 'healthy') return 'active';
    if (value === 'degraded' || value === 'partial') return 'warning';
    return 'inactive';
  };

  const refreshHubData = async () => {
    const requestStartedAt = performance.now();

    let statusPayload: any = null;
    try {
      const statusResponse = await fetch(`${apiBase}/api/system/status`);
      if (statusResponse.ok) {
        statusPayload = await statusResponse.json();
        setCoreStatus(statusPayload.api === 'online' ? 'active' : 'error');
        setAiStatus(statusPayload.agents === 'online' ? 'active' : 'warning');
        setWorkflowStatus(statusPayload.workflows === 'online' ? 'active' : 'warning');
      } else {
        setCoreStatus('warning');
      }
    } catch {
      setCoreStatus('error');
      setAiStatus('error');
      setWorkflowStatus('error');
    }

    try {
      const [metricsResponse, workflowsResponse, executionsResponse] = await Promise.all([
        fetch(`${apiBase}/api/system/metrics`),
        fetch(`${apiBase}/api/workflows`),
        fetch(`${apiBase}/api/workflows/executions`),
      ]);

      const metricsPayload = metricsResponse.ok ? await metricsResponse.json() : null;
      const workflowsPayload = workflowsResponse.ok ? await workflowsResponse.json() : [];
      const executionsPayload = executionsResponse.ok ? await executionsResponse.json() : [];

      const workflows = Array.isArray(workflowsPayload) ? workflowsPayload : [];
      const executions = Array.isArray(executionsPayload) ? executionsPayload : [];
      const completedExecutions = executions.filter((entry: any) => entry?.status === 'completed');

      setMetrics({
        activeWorkflows: workflows.filter((entry: any) =>
          ['active', 'running'].includes(String(entry?.status || '').toLowerCase())
        ).length,
        completedTasks: completedExecutions.length,
        systemUptime: formatUptime(Number(metricsPayload?.process?.uptime)),
        responseTime: `${Math.round(performance.now() - requestStartedAt)}ms`,
      });

      if (statusPayload) {
        setServices((prev) => ({
          ...prev,
          'workflow-services': prev['workflow-services'].map((service) => {
            if (service.name === 'Execute' || service.name === 'Analytics') {
              return { ...service, status: getServiceState(statusPayload.workflows) };
            }
            return service;
          }),
          'ai-services': prev['ai-services'].map((service) => ({
            ...service,
            status: getServiceState(statusPayload.agents),
          })),
        }));
      }
    } catch {
      setMetrics((prev) => ({
        ...prev,
        responseTime: 'Unavailable',
      }));
    }
  };

  const createNewWorkflow = () => {
    navigate('/workflows/builder');
  };

  const openWorkflowBuilder = () => {
    navigate('/workflows/builder');
  };

  const viewTemplates = () => {
    navigate('/workflows/templates');
  };

  const useTemplate = (templateName: string) => {
    navigate(`/workflows/builder?template=${templateName}`);
  };

  const openService = (serviceName: string, port?: number) => {
    const serviceUrls: Record<string, string> = {
      'Theia IDE': `http://localhost:${port || 3000}`,
      Terminal: `http://localhost:${port || 3000}/terminal`,
      'My Workflows': '/workflows',
      Builder: '/workflows/builder',
      Analytics: '/analytics',
    };

    const url = serviceUrls[serviceName];
    if (url) {
      if (url.startsWith('http')) {
        window.open(url, '_blank');
      } else {
        navigate(url);
      }
    }
  };

  const getServiceCategoryStatus = (category: string) => {
    const categoryServices = services[category];
    const activeCount = categoryServices.filter((s) => s.status === 'active').length;
    const totalCount = categoryServices.length;

    if (activeCount === totalCount) return 'active';
    if (activeCount > 0) return 'warning';
    return 'error';
  };

  const getServiceCategoryIcon = (category: string) => {
    const icons = {
      'ai-services': '🤖',
      'workflow-services': '🔧',
      'dev-services': '💻',
      'automation-services': '⚙️',
    };
    return icons[category as keyof typeof icons] || '🔧';
  };

  const getServiceCategoryTitle = (category: string) => {
    const titles = {
      'ai-services': 'AI Services',
      'workflow-services': 'Workflow Engine',
      'dev-services': 'Development',
      'automation-services': 'Automation',
    };
    return titles[category as keyof typeof titles] || category;
  };

  return (
    <div className="modern-hub">
      {/* Header */}
      <header className="hub-header">
        <div className="logo">
          <span className="logo-icon">🚀</span>
          <span className="logo-text">The New Fuse</span>
        </div>
        <div className="status-bar">
          <div className="status-indicator">
            <div className={`status-dot ${coreStatus}`}></div>
            <span>Core Services</span>
          </div>
          <div className="status-indicator">
            <div className={`status-dot ${aiStatus}`}></div>
            <span>AI Agents</span>
          </div>
          <div className="status-indicator">
            <div className={`status-dot ${workflowStatus}`}></div>
            <span>Workflows</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="hub-content">
        {/* Welcome Section */}
        <section className="welcome-section">
          <h1 className="welcome-title">AI Agent & Workflow Hub</h1>
          <p className="welcome-subtitle">
            Build, deploy, and manage intelligent workflows with drag-and-drop simplicity
          </p>
          <div className="quick-actions">
            <button className="quick-action primary" onClick={createNewWorkflow}>
              <span className="action-icon">➕</span>
              Create Workflow
            </button>
            <button className="quick-action secondary" onClick={openWorkflowBuilder}>
              <span className="action-icon">🔧</span>
              Open Builder
            </button>
            <button className="quick-action secondary" onClick={viewTemplates}>
              <span className="action-icon">📋</span>
              Templates
            </button>
          </div>
        </section>

        {/* Services Grid */}
        <section className="services-grid">
          {Object.entries(services).map(([category, categoryServices]) => (
            <div key={category} className={`service-category ${category}`}>
              <div className="category-header">
                <div className="category-title">
                  <div className="category-icon">{getServiceCategoryIcon(category)}</div>
                  <span>{getServiceCategoryTitle(category)}</span>
                </div>
                <div className="category-status">
                  <div className={`status-dot ${getServiceCategoryStatus(category)}`}></div>
                  <span>
                    {categoryServices.filter((s) => s.status === 'active').length}/
                    {categoryServices.length} Active
                  </span>
                </div>
              </div>
              <div className="service-buttons">
                {categoryServices.map((service) => (
                  <button
                    key={service.name}
                    className={`service-btn ${service.status}`}
                    onClick={() => {
                      if (service.status === 'active') {
                        openService(service.name, service.port);
                      }
                    }}
                  >
                    <span className="service-icon">
                      {service.status === 'active' ? '✅' : '⚪'}
                    </span>
                    {service.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Workflow Templates */}
        <section className="workflow-section">
          <div className="workflow-header">
            <h2 className="workflow-title">Workflow Templates</h2>
            <div className="workflow-actions">
              <button className="workflow-btn secondary">
                <span className="btn-icon">📤</span>
                Import
              </button>
              <button className="workflow-btn primary" onClick={createNewWorkflow}>
                <span className="btn-icon">➕</span>
                New Workflow
              </button>
            </div>
          </div>
          <div className="workflow-templates">
            <div className="template-card" onClick={() => useTemplate('ai-research')}>
              <div className="template-icon research">🔍</div>
              <h3 className="template-title">AI Research Assistant</h3>
              <p className="template-description">
                Automated research workflow that gathers information, analyzes data, and generates
                comprehensive reports.
              </p>
            </div>
            <div className="template-card" onClick={() => useTemplate('content-creation')}>
              <div className="template-icon content">✍️</div>
              <h3 className="template-title">Content Creation Pipeline</h3>
              <p className="template-description">
                End-to-end content creation from ideation to publication with AI-powered writing and
                editing.
              </p>
            </div>
            <div className="template-card" onClick={() => useTemplate('data-processing')}>
              <div className="template-icon data">📊</div>
              <h3 className="template-title">Data Processing Workflow</h3>
              <p className="template-description">
                Automated data ingestion, cleaning, analysis, and visualization with intelligent
                insights.
              </p>
            </div>
          </div>
        </section>

        {/* System Monitor */}
        <section className="system-monitor">
          <div className="monitor-header">
            <h2 className="monitor-title">System Performance</h2>
          </div>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{metrics.activeWorkflows}</div>
              <div className="metric-label">Active Workflows</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics.completedTasks.toLocaleString()}</div>
              <div className="metric-label">Tasks Completed</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics.systemUptime}</div>
              <div className="metric-label">System Uptime</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics.responseTime}</div>
              <div className="metric-label">Avg Response Time</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ModernHub;
