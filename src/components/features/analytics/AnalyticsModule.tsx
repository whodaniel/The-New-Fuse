import React, { FC } from 'react';
import { z } from 'zod';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../components/core/CoreModule.js';
import { useToast } from '../hooks/useToast.js';

// Type definitions
const metricSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  timestamp: z.string().datetime(),
  tags: z.array(z.string()),
});

const timeSeriesSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: z.array(z.object({
    timestamp: z.string().datetime(),
    value: z.number(),
    unit: z.string(),
    tags: z.array(z.string()),
  })),
});

const eventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.record(z.any()),
  timestamp: z.string().datetime(),
  tags: z.array(z.string()),
});

type Metric = z.infer<typeof metricSchema>;
type TimeSeries = z.infer<typeof timeSeriesSchema>;
type Event = z.infer<typeof eventSchema>;

type MetricCardProps = {
  metric: Metric;
  trend?: number;
};

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ metric, trend }, ref) => {
    const trendColor = trend
      ? trend > 0
        ? 'text-green-500'
        : 'text-red-500'
      : 'text-gray-500';

    return (
      <Card ref={ref}>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {metric.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold">
              {metric.value.toLocaleString()} {metric.unit}
            </div>
            {trend && (
              <div className={`flex items-center ${trendColor}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {metric.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
);

MetricCard.displayName = 'MetricCard';

type TimeSeriesChartProps = {
  data: TimeSeries;
  height?: number;
};

export const TimeSeriesChart = React.forwardRef<HTMLDivElement, TimeSeriesChartProps>(
  ({ data, height = 400 }, ref) => {
    const formattedData = data.data.map((point) => ({
      timestamp: new Date(point.timestamp).toLocaleString(),
      value: point.value,
    }));

    return (
      <div ref={ref} style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis
              dataKey="timestamp"
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              name={data.name}
              stroke="#8884d8"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

TimeSeriesChart.displayName = 'TimeSeriesChart';

type EventTimelineProps = {
  events: Event[];
};

export const EventTimeline = React.forwardRef<HTMLDivElement, EventTimelineProps>(
  ({ events }, ref) => {
    return (
      <div ref={ref} className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start space-x-4 p-4 bg-card rounded-lg"
          >
            <div className="w-2 h-2 mt-2 rounded-full bg-primary"/>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{event.type}</h4>
                <time className="text-sm text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </time>
              </div>
              <div className="mt-2 space-y-2">
                {Object.entries(event.data).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium">{key}:</span>{' '}
                    {JSON.stringify(value)}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

EventTimeline.displayName = 'EventTimeline';

type AnalyticsDashboardProps = {
  metrics: Metric[];
  timeSeries: TimeSeries[];
  events: Event[];
  onRefresh?: () => Promise<void>;
};

export const AnalyticsDashboard = React.forwardRef<HTMLDivElement, AnalyticsDashboardProps>(
  ({ metrics, timeSeries, events, onRefresh }, ref) => {
    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    
    const handleRefresh = async () => {
      if (!onRefresh) return;
      
      setIsRefreshing(true);
      try {
        await onRefresh();
        toast.success('Dashboard refreshed');
      } catch (error) {
        toast.error('Failed to refresh dashboard');
      } finally {
        setIsRefreshing(false);
      }
    };

    return (
      <div ref={ref} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing || !onRefresh}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric}/>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {timeSeries.map((series) => (
            <Card key={series.id}>
              <CardHeader>
                <CardTitle>{series.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart data={series} height={300}/>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Event Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <EventTimeline events={events}/>
          </CardContent>
        </Card>
      </div>
    );
  }
);

AnalyticsDashboard.displayName = 'AnalyticsDashboard';

export type {
  Metric,
  TimeSeries,
  Event,
  MetricCardProps,
  TimeSeriesChartProps,
  EventTimelineProps,
  AnalyticsDashboardProps,
};
