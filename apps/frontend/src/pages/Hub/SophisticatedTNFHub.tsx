// @ts-nocheck
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
/**
 * Sophisticated TNF Hub - Advanced AI Agent & Workflow Management Interface
 * Enhanced React component with comprehensive analytics, real-time monitoring, and enterprise features
 */

import {
  Activity,
  BarChart3,
  Bot,
  Brain,
  ChevronRight,
  Code,
  Cpu,
  Database,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ServiceStatus {
  name: string;
  status: 'active' | 'inactive' | 'warning' | 'error';
  port?: number;
  uptime?: string;
  responseTime?: number;
}

interface SystemMetrics {
  activeWorkflows: number;
  completedTasks: number;
  systemUptime: string;
  responseTime: string;
  cpuUsage: number;
  memoryUsage: number;
  activeAgents: number;
  totalRevenue: number;
}

interface AnalyticsData {
  workflowExecutions: number[];
  agentPerformance: number[];
  systemLoad: number[];
  revenueData: number[];
}

interface HubAgent {
  id: string;
  name?: string;
  status?: string;
  capabilities?: string[];
}

interface HubWorkflow {
  id: string;
  name?: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
}

interface HubExecution {
  id: string;
  workflowId?: string;
  workflowName?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface HubWorkflowTemplate {
  id: string;
  name?: string;
  description?: string;
}

export const SophisticatedTNFHub: React.FC = () => {
  const navigate = useNavigate();
  const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [services, setServices] = useState<Record<string, ServiceStatus[]>>({
    'ai-services': [
      { name: 'Claude AI', status: 'active', responseTime: 120 },
      { name: 'GPT-4', status: 'active', responseTime: 95 },
      { name: 'Gemini Pro', status: 'active', responseTime: 110 },
      { name: 'Perplexity', status: 'active', responseTime: 85 },
      { name: 'Anthropic', status: 'warning', responseTime: 200 },
    ],
    'core-services': [
      { name: 'API Gateway', status: 'active', port: 8080, uptime: '99.9%' },
      { name: 'Database', status: 'active', port: 5432, uptime: '99.8%' },
      { name: 'Redis Cache', status: 'active', port: 6379, uptime: '100%' },
      { name: 'Message Queue', status: 'active', port: 5672, uptime: '99.7%' },
    ],
    'workflow-services': [
      { name: 'Workflow Engine', status: 'active', uptime: '99.5%' },
      { name: 'Task Scheduler', status: 'active', uptime: '99.9%' },
      { name: 'Event Bus', status: 'active', uptime: '99.8%' },
      { name: 'Analytics Engine', status: 'warning', uptime: '98.2%' },
    ],
    'dev-services': [
      { name: 'Theia IDE', status: 'active', port: 3000 },
      { name: 'VS Code Server', status: 'inactive' },
      { name: 'Git Server', status: 'active', port: 9418 },
      { name: 'Docker Registry', status: 'active', port: 5000 },
    ],
    'blockchain-services': [
      { name: 'Ethereum Node', status: 'active', port: 8545 },
      { name: 'IPFS Gateway', status: 'active', port: 8080 },
      { name: 'NFT Marketplace', status: 'active', uptime: '99.6%' },
      { name: 'Smart Contracts', status: 'active', uptime: '100%' },
    ],
  });

  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeWorkflows: 24,
    completedTasks: 3847,
    systemUptime: '99.9%',
    responseTime: '0.2s',
    cpuUsage: 45,
    memoryUsage: 62,
    activeAgents: 18,
    totalRevenue: 125000,
  });

  const [, setAnalytics] = useState<AnalyticsData>({
    workflowExecutions: [],
    agentPerformance: [],
    systemLoad: [],
    revenueData: [],
  });
  const [agentsData, setAgentsData] = useState<HubAgent[]>([]);
  const [workflowsData, setWorkflowsData] = useState<HubWorkflow[]>([]);
  const [executionsData, setExecutionsData] = useState<HubExecution[]>([]);
  const [workflowTemplatesData, setWorkflowTemplatesData] = useState<HubWorkflowTemplate[]>([]);
  const [hubDataUnavailable, setHubDataUnavailable] = useState(false);

  useEffect(() => {
    refreshHubData();
    const interval = setInterval(refreshHubData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (uptimeSeconds?: number): string => {
    if (!uptimeSeconds || !Number.isFinite(uptimeSeconds)) return 'N/A';
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  };

  const refreshHubData = async () => {
    const requestStartedAt = performance.now();
    try {
      const [
        systemStatusResponse,
        systemMetricsResponse,
        workflowsResponse,
        executionsResponse,
        agentsResponse,
      ] = await Promise.all([
        fetch(`${apiBase}/api/system/status`),
        fetch(`${apiBase}/api/system/metrics`),
        fetch(`${apiBase}/api/workflows`),
        fetch(`${apiBase}/api/workflows/executions`),
        fetch(`${apiBase}/api/agents`),
      ]);
      const templatesResponse = await fetch(`${apiBase}/api/workflows/templates`);

      const systemStatus = systemStatusResponse.ok ? await systemStatusResponse.json() : null;
      const systemMetrics = systemMetricsResponse.ok ? await systemMetricsResponse.json() : null;
      const workflows = workflowsResponse.ok ? await workflowsResponse.json() : [];
      const executions = executionsResponse.ok ? await executionsResponse.json() : [];
      const agents = agentsResponse.ok ? await agentsResponse.json() : [];
      const templates = templatesResponse.ok ? await templatesResponse.json() : [];

      const workflowsList = Array.isArray(workflows) ? workflows : [];
      const executionsList = Array.isArray(executions) ? executions : [];
      const agentsList = Array.isArray(agents) ? agents : [];
      const templatesList = Array.isArray(templates) ? templates : [];
      setWorkflowsData(workflowsList);
      setExecutionsData(executionsList);
      setAgentsData(agentsList);
      setWorkflowTemplatesData(templatesList);
      setHubDataUnavailable(
        !workflowsResponse.ok ||
          !executionsResponse.ok ||
          !agentsResponse.ok ||
          !templatesResponse.ok
      );

      const completedExecutions = executionsList.filter(
        (entry: any) => String(entry?.status || '').toLowerCase() === 'completed'
      );

      const previousCpuUsage = metrics.cpuUsage;

      setMetrics((prev) => ({
        ...prev,
        activeWorkflows: workflowsList.filter((entry: any) =>
          ['active', 'running'].includes(String(entry?.status || '').toLowerCase())
        ).length,
        completedTasks: completedExecutions.length,
        systemUptime: formatUptime(Number(systemMetrics?.process?.uptime)),
        responseTime: `${Math.round(performance.now() - requestStartedAt)}ms`,
        cpuUsage: Number(systemMetrics?.cpu?.usage ?? prev.cpuUsage),
        memoryUsage: Number(systemMetrics?.memory?.usage ?? prev.memoryUsage),
        activeAgents: agentsList.filter(
          (entry: any) => String(entry?.status || '').toLowerCase() === 'active'
        ).length,
      }));

      setAnalytics((prev) => {
        const previousSystemLoad =
          prev.systemLoad.length > 0 ? prev.systemLoad[prev.systemLoad.length - 1] : 0;
        const previousRevenuePoint =
          prev.revenueData.length > 0
            ? prev.revenueData[prev.revenueData.length - 1]
            : metrics.totalRevenue;

        return {
          workflowExecutions: [...prev.workflowExecutions.slice(-6), completedExecutions.length],
          agentPerformance: [
            ...prev.agentPerformance.slice(-6),
            agentsList.length > 0
              ? Math.round(
                  (agentsList.filter(
                    (entry: any) => String(entry?.status || '').toLowerCase() === 'active'
                  ).length /
                    agentsList.length) *
                    100
                )
              : 0,
          ],
          systemLoad: [
            ...prev.systemLoad.slice(-6),
            Number(systemMetrics?.memory?.usage ?? previousSystemLoad),
          ],
          revenueData: [...prev.revenueData.slice(-6), previousRevenuePoint],
        };
      });

      if (systemStatus) {
        setServices((prev) => ({
          ...prev,
          'workflow-services': prev['workflow-services'].map((service) => ({
            ...service,
            status:
              systemStatus.workflows === 'online'
                ? 'active'
                : systemStatus.workflows === 'partial'
                  ? 'warning'
                  : 'error',
          })),
          'ai-services': prev['ai-services'].map((service) => ({
            ...service,
            status: systemStatus.agents === 'online' ? 'active' : 'warning',
            responseTime: Math.max(20, Math.round(performance.now() - requestStartedAt)),
          })),
          'core-services': prev['core-services'].map((service) => {
            if (service.name === 'Database') {
              return {
                ...service,
                status: systemStatus.database === 'online' ? 'active' : 'error',
              };
            }
            if (service.name === 'API Gateway') {
              return {
                ...service,
                status: systemStatus.api === 'online' ? 'active' : 'error',
              };
            }
            return service;
          }),
        }));
      }

      if (Number.isFinite(previousCpuUsage) && previousCpuUsage > 95) {
        setMetrics((prev) => ({ ...prev, cpuUsage: 95 }));
      }
    } catch {
      setMetrics((prev) => ({
        ...prev,
        responseTime: 'Unavailable',
      }));
      setHubDataUnavailable(true);
    }
  };

  const normalizeStatus = (status?: string): 'active' | 'warning' | 'error' | 'inactive' => {
    const normalized = String(status || '').toLowerCase();
    if (['active', 'running', 'completed', 'online', 'healthy'].includes(normalized))
      return 'active';
    if (['warning', 'degraded', 'partial', 'queued', 'pending', 'scheduled'].includes(normalized))
      return 'warning';
    if (['error', 'failed', 'offline', 'unhealthy'].includes(normalized)) return 'error';
    return 'inactive';
  };

  const formatRelativeTime = (timestamp?: string): string => {
    if (!timestamp) return 'unknown';
    const value = new Date(timestamp).getTime();
    if (!Number.isFinite(value)) return 'unknown';
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - value) / 1000));
    if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-transparent0';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const navigateToService = (service: string) => {
    switch (service) {
      case 'NFT Marketplace':
        navigate('/agents/nft-marketplace');
        break;
      case 'Theia IDE':
        navigate('/command-center');
        break;
      case 'Workflow Engine':
        navigate('/workflows');
        break;
      case 'Analytics Engine':
        navigate('/analytics');
        break;
      default:
        console.log(`Navigate to ${service}`);
    }
  };

  const activeWorkflows = workflowsData.filter((workflow) =>
    ['active', 'running'].includes(String(workflow.status || '').toLowerCase())
  );
  const recentExecutions = [...executionsData]
    .sort(
      (left, right) =>
        new Date(right.updatedAt || right.createdAt || 0).getTime() -
        new Date(left.updatedAt || left.createdAt || 0).getTime()
    )
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">The New Fuse</h1>
                  <p className="text-sm text-gray-400">Sophisticated Hub</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${getStatusColor('active')} animate-pulse`}
                ></div>
                <span className="text-sm text-gray-300">System Healthy</span>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400">
                {metrics.systemUptime} Uptime
              </Badge>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-black/20 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-purple-600">
              <Layers className="w-4 h-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-purple-600">
              <Bot className="w-4 h-4 mr-2" />
              AI Agents
            </TabsTrigger>
            <TabsTrigger value="workflows" className="data-[state=active]:bg-purple-600">
              <Workflow className="w-4 h-4 mr-2" />
              Workflows
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Welcome Banner */}
            <Card className="bg-gradient-to-r from-purple-600 to-blue-600 border-0 text-white">
              <CardContent className="p-4 text-center">
                <h2 className="text-2xl font-bold mb-2">Welcome to The New Fuse</h2>
                <p className="text-lg opacity-90 mb-6">
                  Advanced AI-Powered Development & Automation Platform
                </p>
                <div className="flex justify-center space-x-4">
                  <Button
                    className="bg-transparent text-purple-600 hover:bg-muted/30"
                    onClick={() => navigate('/workflows/new')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workflow
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-transparent/10"
                    onClick={() => navigate('/agents/new')}
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    Deploy Agent
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Active Workflows</p>
                      <p className="text-2xl font-bold text-blue-400">{metrics.activeWorkflows}</p>
                    </div>
                    <Workflow className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Completed Tasks</p>
                      <p className="text-2xl font-bold text-green-400">
                        {metrics.completedTasks.toLocaleString()}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Active Agents</p>
                      <p className="text-2xl font-bold text-purple-400">{metrics.activeAgents}</p>
                    </div>
                    <Bot className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Revenue</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        ${metrics.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cpu className="w-5 h-5 text-blue-400" />
                    <span>System Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">CPU Usage</span>
                      <span className="text-white">{metrics.cpuUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${metrics.cpuUsage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Memory Usage</span>
                      <span className="text-white">{metrics.memoryUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${metrics.memoryUsage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Response Time</span>
                      <span className="text-green-400">{metrics.responseTime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hubDataUnavailable ? (
                    <p className="text-sm text-amber-300">
                      Recent activity unavailable while backend metrics endpoints are unreachable.
                    </p>
                  ) : recentExecutions.length > 0 ? (
                    <div className="space-y-3">
                      {recentExecutions.map((execution) => {
                        const status = normalizeStatus(execution.status);
                        const dotClass =
                          status === 'active'
                            ? 'bg-green-500'
                            : status === 'warning'
                              ? 'bg-yellow-500'
                              : status === 'error'
                                ? 'bg-red-500'
                                : 'bg-transparent0';
                        return (
                          <div key={execution.id} className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${dotClass}`}></div>
                            <span className="text-sm text-gray-300">
                              Execution{' '}
                              {execution.workflowName ||
                                execution.workflowId ||
                                execution.id.slice(0, 8)}{' '}
                              {String(execution.status || 'unknown').toLowerCase()}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatRelativeTime(execution.updatedAt || execution.createdAt)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      No execution activity has been recorded yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="grid gap-4">
              {Object.entries(services).map(([category, categoryServices]) => (
                <Card key={category} className="bg-black/20 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {category === 'ai-services' && (
                          <Brain className="w-5 h-5 text-purple-400" />
                        )}
                        {category === 'core-services' && (
                          <Database className="w-5 h-5 text-blue-400" />
                        )}
                        {category === 'workflow-services' && (
                          <Workflow className="w-5 h-5 text-green-400" />
                        )}
                        {category === 'dev-services' && (
                          <Code className="w-5 h-5 text-yellow-400" />
                        )}
                        {category === 'blockchain-services' && (
                          <Shield className="w-5 h-5 text-orange-400" />
                        )}
                        <span className="capitalize">{category.replace('-', ' ')}</span>
                      </div>
                      <Badge variant="outline">
                        {categoryServices.filter((s) => s.status === 'active').length}/
                        {categoryServices.length} Active
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryServices.map((service) => (
                        <div
                          key={service.name}
                          className="p-4 bg-gray-800/50 rounded-md border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                          onClick={() => navigateToService(service.name)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-white">{service.name}</span>
                            <Badge variant={getStatusBadgeVariant(service.status)}>
                              {service.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-400">
                            {service.port && (
                              <div className="flex justify-between">
                                <span>Port:</span>
                                <span className="text-white">{service.port}</span>
                              </div>
                            )}
                            {service.uptime && (
                              <div className="flex justify-between">
                                <span>Uptime:</span>
                                <span className="text-white">{service.uptime}</span>
                              </div>
                            )}
                            {service.responseTime && (
                              <div className="flex justify-between">
                                <span>Response:</span>
                                <span className="text-white">{service.responseTime}ms</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle>Workflow Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Analytics chart would be rendered here</p>
                      <p className="text-sm">Integration with Chart.js or Recharts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Revenue analytics chart</p>
                      <p className="text-sm">Real-time financial metrics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">AI Agents Management</h2>
              <Button onClick={() => navigate('/agents/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </div>

            {hubDataUnavailable ? (
              <Card className="bg-amber-500/10 border-amber-500/30">
                <CardContent className="p-4 text-amber-200 text-sm">
                  Agent registry is currently unavailable.
                </CardContent>
              </Card>
            ) : agentsData.length === 0 ? (
              <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                <CardContent className="p-4 text-sm text-gray-400">
                  No agents registered yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentsData.slice(0, 6).map((agent, index) => {
                  const normalized = normalizeStatus(agent.status);
                  const badgeClass =
                    normalized === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : normalized === 'warning'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : normalized === 'error'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-transparent0/20 text-gray-300';
                  return (
                    <Card
                      key={agent.id}
                      className="bg-black/20 backdrop-blur-sm border-white/10 hover:border-purple-500/50 transition-colors cursor-pointer"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <Bot
                            className={`w-8 h-8 ${index % 2 === 0 ? 'text-purple-400' : 'text-blue-400'}`}
                          />
                          <Badge className={badgeClass}>{String(agent.status || 'unknown')}</Badge>
                        </div>
                        <h3 className="font-semibold mb-2">{agent.name || agent.id}</h3>
                        <p className="text-sm text-gray-400 mb-4">
                          {agent.capabilities && agent.capabilities.length > 0
                            ? `${agent.capabilities.length} capabilities configured`
                            : 'Capabilities not published'}
                        </p>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Agent ID</span>
                          <span className="text-gray-300">{agent.id.slice(0, 8)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Workflow Management</h2>
              <Button onClick={() => navigate('/workflows/builder')}>
                <Plus className="w-4 h-4 mr-2" />
                Build Workflow
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle>Active Workflows</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hubDataUnavailable ? (
                    <p className="text-sm text-amber-300">Workflow registry unavailable.</p>
                  ) : activeWorkflows.length > 0 ? (
                    activeWorkflows.slice(0, 6).map((workflow) => (
                      <div
                        key={workflow.id}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-md"
                      >
                        <div className="flex items-center space-x-3">
                          <Play className="w-4 h-4 text-green-400" />
                          <span>{workflow.name || workflow.id}</span>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400">
                          {String(workflow.status || 'active')}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No active workflows at the moment.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle>Workflow Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hubDataUnavailable ? (
                    <p className="text-sm text-amber-300">Workflow templates unavailable.</p>
                  ) : workflowTemplatesData.length > 0 ? (
                    workflowTemplatesData.slice(0, 6).map((template) => (
                      <div
                        key={template.id}
                        className="p-3 bg-gray-800/50 rounded-md hover:bg-gray-700/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/workflows/builder?template=${template.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{template.name || template.id}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {template.description || 'Template description unavailable'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No workflow templates published.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SophisticatedTNFHub;
