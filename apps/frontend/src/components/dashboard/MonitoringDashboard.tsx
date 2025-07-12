// Monitoring Dashboard Component - Real-time system monitoring interface
// Displays comprehensive system metrics, alerts, health checks, and performance analytics

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Alert,
  LinearProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
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
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading monitoring dashboard...
        </Typography>
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
        <Typography variant="h4" component="h1">
          System Monitoring Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                {getStatusIcon(dashboardData.overview.status)}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  System Status
                </Typography>
              </Box>
              <Chip
                label={dashboardData.overview.status.toUpperCase()}
                color={getStatusColor(dashboardData.overview.status) as any}
                variant="filled"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                Uptime
              </Typography>
              <Typography variant="h5">
                {formatUptime(dashboardData.overview.uptime)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                Active Users
              </Typography>
              <Typography variant="h5">
                {dashboardData.overview.totalUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                Active Agents
              </Typography>
              <Typography variant="h5">
                {dashboardData.overview.activeAgents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                Workflows
              </Typography>
              <Typography variant="h5">
                {dashboardData.overview.totalWorkflows}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                System Load
              </Typography>
              <Typography variant="h5">
                {dashboardData.overview.systemLoad.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts */}
      {activeAlerts.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Active Alerts ({activeAlerts.length})
            </Typography>
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
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                System Performance
              </Typography>
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
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Network & Cache Performance
              </Typography>
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                System Resources
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">CPU Usage</Typography>
                  <Typography variant="body2">
                    {dashboardData.realTimeMetrics.system.cpu.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={dashboardData.realTimeMetrics.system.cpu}
                  color={dashboardData.realTimeMetrics.system.cpu > 80 ? 'error' : 'primary'}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Memory Usage</Typography>
                  <Typography variant="body2">
                    {dashboardData.realTimeMetrics.system.memory.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={dashboardData.realTimeMetrics.system.memory}
                  color={dashboardData.realTimeMetrics.system.memory > 80 ? 'error' : 'primary'}
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Disk Usage</Typography>
                  <Typography variant="body2">
                    {dashboardData.realTimeMetrics.system.disk.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={dashboardData.realTimeMetrics.system.disk}
                  color={dashboardData.realTimeMetrics.system.disk > 85 ? 'error' : 'primary'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Cache Performance
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Hit Rate</Typography>
                <Typography variant="body2" color={dashboardData.realTimeMetrics.cache.hitRate > 90 ? 'success.main' : 'warning.main'}>
                  {dashboardData.realTimeMetrics.cache.hitRate.toFixed(1)}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Memory Usage</Typography>
                <Typography variant="body2">
                  {formatBytes(dashboardData.realTimeMetrics.cache.memoryUsage)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total Keys</Typography>
                <Typography variant="body2">
                  {dashboardData.realTimeMetrics.cache.totalKeys.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Job Queue Status
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Active Jobs</Typography>
                <Typography variant="body2">
                  {dashboardData.realTimeMetrics.queue.activeJobs}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Completed</Typography>
                <Typography variant="body2">
                  {dashboardData.realTimeMetrics.queue.completedJobs}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Failed</Typography>
                <Typography variant="body2" color={dashboardData.realTimeMetrics.queue.failedJobs > 0 ? 'error.main' : 'text.primary'}>
                  {dashboardData.realTimeMetrics.queue.failedJobs}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Throughput</Typography>
                <Typography variant="body2">
                  {dashboardData.realTimeMetrics.queue.throughput}/min
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Health Checks */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Component Health
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(dashboardData.healthChecks).map(([component, health]) => (
              <Grid item xs={12} sm={6} md={2.4} key={component}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  {getStatusIcon(health.status)}
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    {component.toUpperCase()}
                  </Typography>
                  <Chip
                    size="small"
                    label={health.status}
                    color={getStatusColor(health.status) as any}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Alert Dialog */}
      <Dialog
        open={alertDialogOpen}
        onClose={() => setAlertDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          All Active Alerts
          <IconButton
            onClick={() => setAlertDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Severity</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Chip
                        size="small"
                        label={alert.type}
                        color={alert.type === 'critical' ? 'error' : alert.type as any}
                      />
                    </TableCell>
                    <TableCell>{alert.service}</TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell>
                      {new Date(alert.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MonitoringDashboard;