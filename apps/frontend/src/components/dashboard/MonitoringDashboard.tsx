// Monitoring Dashboard Component - Real-time system monitoring interface
// Displays comprehensive system metrics, alerts, health checks, and performance analytics

import React, { useState, useEffect, useCallback } from 'react';


import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface SystemMetrics {
  timestamp: number;
  system: {
    cpu: number;
    memory: number;
    disk: number;
    uptime: number;
  };
  cache: {
    hitRate: number;
    memoryUsage: number;
    totalKeys: number;
    connections: number;
  };
  queue: {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    throughput: number;
  };
  websocket: {
    activeConnections: number;
    messagesPerSecond: number;
    averageLatency: number;
    errorRate: number;
  };
  a2a: {
    messagesSent: number;
    messagesReceived: number;
    averageLatency: number;
    activeAgents: number;
    errorRate: number;
  };
  database: {
    activeConnections: number;
    slowQueries: number;
    averageQueryTime: number;
    connectionPoolSize: number;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  service: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
  resolved: boolean;
}

interface DashboardData {
  overview: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    totalUsers: number;
    activeAgents: number;
    totalWorkflows: number;
    systemLoad: number;
  };
  realTimeMetrics: SystemMetrics;
  historicalData: {
    timeRange: string;
    dataPoints: SystemMetrics[];
  };
  alerts: PerformanceAlert[];
  healthChecks: {
    redis: { status: string; latency: number };
    database: { status: string; latency: number };
    queue: { status: string; pendingJobs: number };
    websocket: { status: string; connections: number };
    a2a: { status: string; agents: number };
  };
  trends: {
    userGrowth: number[];
    agentActivity: number[];
    workflowExecution: number[];
    systemPerformance: number[];
  };
}

const MonitoringDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<PerformanceAlert | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/dashboard');
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/monitoring/alerts/${alertId}/resolve`, {
        method: 'PUT',
      });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchDashboardData, refreshInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'critical': return <ErrorIcon color="error" />;
      default: return <CheckCircleIcon />;
    }
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const prepareChartData = (dataPoints: SystemMetrics[]) => {
    return dataPoints.map(point => ({
      timestamp: new Date(point.timestamp).toLocaleTimeString(),
      cpu: point.system.cpu,
      memory: point.system.memory,
      cacheHitRate: point.cache.hitRate,
      activeConnections: point.websocket.activeConnections,
      throughput: point.queue.throughput,
      latency: point.websocket.averageLatency,
    }));
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Progress />
        <Text variant="h6" sx={{ mt: 2 }}>
          Loading monitoring dashboard...
        </Text>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load dashboard data. Please try refreshing the page.
        </Alert>
      </Box>
    );
  }

  const chartData = prepareChartData(dashboardData.historicalData.dataPoints);
  const activeAlerts = dashboardData.alerts.filter(alert => !alert.resolved);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Text variant="h4" component="h1">
          System Monitoring Dashboard
        </Text>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          <IconButton onClick={fetchDashboardData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* System Overview */}
      <SimpleGrid container columns={3} sx={{ mb: 3 }}>
        <SimpleGrid item xs={12} sm={6} md={2}>
          <Card>
            <CardBody sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                {getStatusIcon(dashboardData.overview.status)}
                <Text variant="h6" sx={{ ml: 1 }}>
                  System Status
                </Text>
              </Box>
              <Tag
                label={dashboardData.overview.status.toUpperCase()}
                color={getStatusColor(dashboardData.overview.status) as any}
                variant="filled"
              />
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid item xs={12} sm={6} md={2}>
          <Card>
            <CardBody sx={{ textAlign: 'center' }}>
              <Text variant="h6" color="textSecondary">
                Uptime
              </Text>
              <Text variant="h5">
                {formatUptime(dashboardData.overview.uptime)}
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid item xs={12} sm={6} md={2}>
          <Card>
            <CardBody sx={{ textAlign: 'center' }}>
              <Text variant="h6" color="textSecondary">
                Active Users
              </Text>
              <Text variant="h5">
                {dashboardData.overview.totalUsers}
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid item xs={12} sm={6} md={2}>
          <Card>
            <CardBody sx={{ textAlign: 'center' }}>
              <Text variant="h6" color="textSecondary">
                Active Agents
              </Text>
              <Text variant="h5">
                {dashboardData.overview.activeAgents}
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid item xs={12} sm={6} md={2}>
          <Card>
            <CardBody sx={{ textAlign: 'center' }}>
              <Text variant="h6" color="textSecondary">
                Workflows
              </Text>
              <Text variant="h5">
                {dashboardData.overview.totalWorkflows}
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid item xs={12} sm={6} md={2}>
          <Card>
            <CardBody sx={{ textAlign: 'center' }}>
              <Text variant="h6" color="textSecondary">
                System Load
              </Text>
              <Text variant="h5">
                {dashboardData.overview.systemLoad.toFixed(1)}%
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>
      </SimpleGrid>

      {/* Alerts */}
      {activeAlerts.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardBody>
            <Text variant="h6" sx={{ mb: 2 }}>
              Active Alerts ({activeAlerts.length})
            </Text>
            {activeAlerts.slice(0, 5).map((alert) => (
              <Alert
                key={alert.id}
                severity={alert.type === 'critical' ? 'error' : alert.type as any}
                sx={{ mb: 1 }}
                action={
                  <Button
                    size="small"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                }
              >
                <strong>{alert.service.toUpperCase()}:</strong> {alert.message}
              </Alert>
            ))}
            {activeAlerts.length > 5 && (
              <Button
                variant="outlined"
                onClick={() => setAlertDialogOpen(true)}
                sx={{ mt: 1 }}
              >
                View All Alerts ({activeAlerts.length})
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      {/* Performance Metrics */}
      <SimpleGrid container columns={3} sx={{ mb: 3 }}>
        <SimpleGrid item xs={12} md={6}>
          <Card>
            <CardBody>
              <Text variant="h6" sx={{ mb: 2 }}>
                System Performance
              </Text>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                    name="CPU %"
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.3}
                    name="Memory %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid item xs={12} md={6}>
          <Card>
            <CardBody>
              <Text variant="h6" sx={{ mb: 2 }}>
                Network & Cache Performance
              </Text>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="cacheHitRate"
                    stroke="#ff7300"
                    name="Cache Hit Rate %"
                  />
                  <Line
                    type="monotone"
                    dataKey="activeConnections"
                    stroke="#00ff00"
                    name="Active Connections"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </SimpleGrid>
      </SimpleGrid>

      {/* Detailed Metrics */}
      <SimpleGrid container columns={3} sx={{ mb: 3 }}>
        <SimpleGrid item xs={12} md={4}>
          <Card>
            <CardBody>
              <Text variant="h6" sx={{ mb: 2 }}>
                System Resources
              </Text>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Text variant="body2">CPU Usage</Text>
                  <Text variant="body2">
                    {dashboardData.realTimeMetrics.system.cpu.toFixed(1)}%
                  </Text>
                </Box>
                <Progress
                  variant="determinate"
                  value={dashboardData.realTimeMetrics.system.cpu}
                  color={dashboardData.realTimeMetrics.system.cpu > 80 ? 'error' : 'primary'}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Text variant="body2">Memory Usage</Text>
                  <Text variant="body2">
                    {dashboardData.realTimeMetrics.system.memory.toFixed(1)}%
                  </Text>
                </Box>
                <Progress
                  variant="determinate"
                  value={dashboardData.realTimeMetrics.system.memory}
                  color={dashboardData.realTimeMetrics.system.memory > 80 ? 'error' : 'primary'}
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Text variant="body2">Disk Usage</Text>
                  <Text variant="body2">
                    {dashboardData.realTimeMetrics.system.disk.toFixed(1)}%
                  </Text>
                </Box>
                <Progress
                  variant="determinate"
                  value={dashboardData.realTimeMetrics.system.disk}
                  color={dashboardData.realTimeMetrics.system.disk > 85 ? 'error' : 'primary'}
                />
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid item xs={12} md={4}>
          <Card>
            <CardBody>
              <Text variant="h6" sx={{ mb: 2 }}>
                Cache Performance
              </Text>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Text variant="body2">Hit Rate</Text>
                <Text variant="body2" color={dashboardData.realTimeMetrics.cache.hitRate > 90 ? 'success.main' : 'warning.main'}>
                  {dashboardData.realTimeMetrics.cache.hitRate.toFixed(1)}%
                </Text>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Text variant="body2">Memory Usage</Text>
                <Text variant="body2">
                  {formatBytes(dashboardData.realTimeMetrics.cache.memoryUsage)}
                </Text>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Text variant="body2">Total Keys</Text>
                <Text variant="body2">
                  {dashboardData.realTimeMetrics.cache.totalKeys.toLocaleString()}
                </Text>
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid item xs={12} md={4}>
          <Card>
            <CardBody>
              <Text variant="h6" sx={{ mb: 2 }}>
                Job Queue Status
              </Text>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Text variant="body2">Active Jobs</Text>
                <Text variant="body2">
                  {dashboardData.realTimeMetrics.queue.activeJobs}
                </Text>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Text variant="body2">Completed</Text>
                <Text variant="body2">
                  {dashboardData.realTimeMetrics.queue.completedJobs}
                </Text>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Text variant="body2">Failed</Text>
                <Text variant="body2" color={dashboardData.realTimeMetrics.queue.failedJobs > 0 ? 'error.main' : 'text.primary'}>
                  {dashboardData.realTimeMetrics.queue.failedJobs}
                </Text>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Text variant="body2">Throughput</Text>
                <Text variant="body2">
                  {dashboardData.realTimeMetrics.queue.throughput}/min
                </Text>
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>
      </SimpleGrid>

      {/* Health Checks */}
      <Card sx={{ mb: 3 }}>
        <CardBody>
          <Text variant="h6" sx={{ mb: 2 }}>
            Component Health
          </Text>
          <SimpleGrid container columns={2}>
            {Object.entries(dashboardData.healthChecks).map(([component, health]) => (
              <SimpleGrid item xs={12} sm={6} md={2.4} key={component}>
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  {getStatusIcon(health.status)}
                  <Text variant="subtitle2" sx={{ mt: 1 }}>
                    {component.toUpperCase()}
                  </Text>
                  <Tag
                    size="small"
                    label={health.status}
                    color={getStatusColor(health.status) as any}
                  />
                </Box>
              </SimpleGrid>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Alert Dialog */}
      <Modal
        open={alertDialogOpen}
        onClose={() => setAlertDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <ModalHeader>
          All Active Alerts
          <IconButton
            onClick={() => setAlertDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </ModalHeader>
        <ModalBody>
          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  <Td>Severity</Td>
                  <Td>Service</Td>
                  <Td>Message</Td>
                  <Td>Time</Td>
                  <Td>Action</Td>
                </Tr>
              </Thead>
              <Tbody>
                {activeAlerts.map((alert) => (
                  <Tr key={alert.id}>
                    <Td>
                      <Tag
                        size="small"
                        label={alert.type}
                        color={alert.type === 'critical' ? 'error' : alert.type as any}
                      />
                    </Td>
                    <Td>{alert.service}</Td>
                    <Td>{alert.message}</Td>
                    <Td>
                      {new Date(alert.timestamp).toLocaleString()}
                    </Td>
                    <Td>
                      <Button
                        size="small"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setAlertDialogOpen(false)}>Close</Button>
        </ModalFooter>
      </Modal>
    </Box>
  );
};

export default MonitoringDashboard;