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
} from '@the-new-fuse/ui-consolidated';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Plus,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { BusinessMetricsDisplay } from './BusinessMetricsDisplay';
import { useBusinessMetrics } from './hooks/useBusinessMetrics';
import { useSSEConnection } from './hooks/useSSEConnection';
import { useWebhookManagement } from './hooks/useWebhookManagement';
import { IntegrationStatusGrid } from './IntegrationStatusGrid';
import { RealtimeEventStream } from './RealtimeEventStream';
import { WebhookConfigurationForm } from './WebhookConfigurationForm';
import { WebhookDeliveryLogs } from './WebhookDeliveryLogs';

export interface WebhookDashboardProps {
  className?: string;
}

export function WebhookDashboard({ className }: WebhookDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewWebhookForm, setShowNewWebhookForm] = useState(false);

  const {
    configurations,
    loading: webhookLoading,
    error: webhookError,
    getActiveConfigurations,
    getFailedDeliveries,
  } = useWebhookManagement();

  const {
    metrics,
    loading: metricsLoading,
    getHealthScore,
    getPerformanceGrade,
  } = useBusinessMetrics();

  const { connectionState, latestEvent } = useSSEConnection();

  const activeConfigurations = getActiveConfigurations();
  const failedDeliveries = getFailedDeliveries();
  const healthScore = getHealthScore();
  const performanceGrade = getPerformanceGrade();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhook Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your business integrations and real-time events
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge
            className={getStatusColor(connectionState.isConnected ? 'connected' : 'disconnected')}
          >
            <Activity className="w-3 h-3 mr-1" />
            {connectionState.isConnected ? 'Live' : 'Offline'}
          </Badge>
          <Button
            onClick={() => setShowNewWebhookForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Integration
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeConfigurations.length}</div>
            <p className="text-xs text-muted-foreground">
              {configurations.length} total configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Today</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : formatNumber(metrics?.totalEvents || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.revenueMetrics.totalRevenue
                ? `$${formatNumber(metrics.revenueMetrics.totalRevenue)} revenue`
                : 'No revenue data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : `${Math.round(healthScore)}% (${performanceGrade})`}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.errorRate
                ? `${(metrics.errorRate * 100).toFixed(1)}% error rate`
                : 'No errors'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Deliveries</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedDeliveries.length}</div>
            <p className="text-xs text-muted-foreground">
              {latestEvent
                ? `Last event: ${new Date(latestEvent.timestamp).toLocaleTimeString()}`
                : 'No recent events'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="events">Live Events</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <IntegrationStatusGrid configurations={configurations} loading={webhookLoading} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <RealtimeEventStream maxEvents={5} showFilters={false} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Business Metrics Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <BusinessMetricsDisplay metrics={metrics} loading={metricsLoading} compact={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationStatusGrid
            configurations={configurations}
            loading={webhookLoading}
            showActions={true}
            showDetails={true}
          />
        </TabsContent>

        <TabsContent value="events">
          <RealtimeEventStream showFilters={true} showMetrics={true} />
        </TabsContent>

        <TabsContent value="analytics">
          <BusinessMetricsDisplay metrics={metrics} loading={metricsLoading} compact={false} />
        </TabsContent>

        <TabsContent value="logs">
          <WebhookDeliveryLogs />
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {webhookError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-red-800">{webhookError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Webhook Form Modal */}
      {showNewWebhookForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <WebhookConfigurationForm
              onSuccess={() => setShowNewWebhookForm(false)}
              onCancel={() => setShowNewWebhookForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
