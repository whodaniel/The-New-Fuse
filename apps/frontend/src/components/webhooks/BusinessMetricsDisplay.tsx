import { BusinessEventType, BusinessMetrics, IntegrationSource } from '@the-new-fuse/types';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@the-new-fuse/ui-consolidated';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

export interface BusinessMetricsDisplayProps {
  metrics: BusinessMetrics | null;
  loading?: boolean;
  compact?: boolean;
  className?: string;
}

export function BusinessMetricsDisplay({
  metrics,
  loading = false,
  compact = false,
  className,
}: BusinessMetricsDisplayProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthScoreIcon = (score: number): JSX.Element => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 70) return <Activity className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Metrics Available</h3>
          <p className="text-gray-500">
            Business metrics will appear here once webhook events are processed
          </p>
        </CardContent>
      </Card>
    );
  }

  const topEventTypes = Object.entries(metrics.eventsByType)
    .map(([type, count]) => ({
      type: type as BusinessEventType,
      count,
      percentage: (count / metrics.totalEvents) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, compact ? 3 : 5);

  const topSources = Object.entries(metrics.eventsBySource)
    .map(([source, count]) => ({
      source: source as IntegrationSource,
      count,
      percentage: (count / metrics.totalEvents) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, compact ? 3 : 5);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.revenueMetrics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.revenueMetrics.averageOrderValue > 0 && (
                <>Avg: {formatCurrency(metrics.revenueMetrics.averageOrderValue)}</>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(metrics.customerMetrics.activeCustomers)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.customerMetrics.newCustomers} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalEvents)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(1 - metrics.errorRate)} success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {getHealthScoreIcon(metrics.processingLatency.avg < 1000 ? 95 : 75)}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getHealthScoreColor(metrics.processingLatency.avg < 1000 ? 95 : 75)}`}
            >
              {metrics.processingLatency.avg < 1000 ? '95%' : '75%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.processingLatency.avg.toFixed(0)}ms avg latency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      {!compact && (
        <>
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Error Rate</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-bold ${
                        metrics.errorRate < 0.01
                          ? 'text-green-600'
                          : metrics.errorRate < 0.05
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {formatPercentage(metrics.errorRate)}
                    </span>
                    {metrics.errorRate < 0.01 ? (
                      <TrendingDown className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg Latency</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold">
                      {metrics.processingLatency.avg.toFixed(0)}ms
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Max: {metrics.processingLatency.max.toFixed(0)}ms
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Integrations</span>
                  <span className="text-sm font-bold">{metrics.activeIntegrations}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Events/Hour</span>
                  <span className="text-sm font-bold">
                    {formatNumber(Math.round(metrics.totalEvents / 24))}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Revenue</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(metrics.revenueMetrics.totalRevenue)}
                  </span>
                </div>

                {metrics.revenueMetrics.averageOrderValue > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Order Value</span>
                    <span className="text-sm font-bold">
                      {formatCurrency(metrics.revenueMetrics.averageOrderValue)}
                    </span>
                  </div>
                )}

                {metrics.revenueMetrics.recurringRevenue > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Recurring Revenue</span>
                    <span className="text-sm font-bold">
                      {formatCurrency(metrics.revenueMetrics.recurringRevenue)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Customer Lifetime Value</span>
                  <span className="text-sm font-bold">
                    {formatCurrency(metrics.customerMetrics.lifetimeValue)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Type Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topEventTypes.map(({ type, count, percentage }) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {type
                            .replace(/_/g, ' ')
                            .toLowerCase()
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Integration Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSources.map(({ source, count, percentage }) => (
                    <div key={source} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{source}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(metrics.customerMetrics.activeCustomers)}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(metrics.customerMetrics.newCustomers)}
                  </div>
                  <div className="text-sm text-muted-foreground">New Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(metrics.customerMetrics.lifetimeValue)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Customer LTV</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Compact View Additional Info */}
      {compact && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{metrics.processingLatency.avg.toFixed(0)}ms avg</span>
                </span>
                <Badge variant={metrics.errorRate < 0.01 ? 'default' : 'destructive'}>
                  {formatPercentage(metrics.errorRate)} errors
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
