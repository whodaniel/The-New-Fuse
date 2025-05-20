import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LineChart,
  DonutChart,
  Select,
  Button,
  Badge,
} from '../components/core/CoreModule.js';
import { APIUsageData, APIEndpoint } from './types.js';

interface APIUsageTrackerProps {
  usageData: APIUsageData;
  endpoints: APIEndpoint[];
  onTimeRangeChange: (range: string) => void;
  onEndpointFilter: (endpointId: string) => void;
}

export const APIUsageTracker: React.FC<APIUsageTrackerProps> = ({
  usageData,
  endpoints,
  onTimeRangeChange,
  onEndpointFilter,
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = React.useState('24h');
  const [selectedEndpoint, setSelectedEndpoint] = React.useState<string>('all');

  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
    onTimeRangeChange(range);
  };

  const handleEndpointChange = (endpointId: string) => {
    setSelectedEndpoint(endpointId);
    onEndpointFilter(endpointId);
  };

  const getStatusColor = (status: number) => {
    if (status < 300) return 'bg-green-500';
    if (status < 400) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-x-2">
          <Button
            variant={selectedTimeRange === '24h' ? 'default' : 'outline'}
            onClick={() => handleTimeRangeChange('24h')}
          >
            24h
          </Button>
          <Button
            variant={selectedTimeRange === '7d' ? 'default' : 'outline'}
            onClick={() => handleTimeRangeChange('7d')}
          >
            7d
          </Button>
          <Button
            variant={selectedTimeRange === '30d' ? 'default' : 'outline'}
            onClick={() => handleTimeRangeChange('30d')}
          >
            30d
          </Button>
        </div>

        <Select
          value={selectedEndpoint}
          onValueChange={handleEndpointChange}
          className="w-48"
        >
          <option value="all">All Endpoints</option>
          {endpoints.map(endpoint => (
            <option key={endpoint.id} value={endpoint.id}>
              {endpoint.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={usageData.requestVolume}
              xAxis="timestamp"
              yAxis="requests"
              className="h-[300px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Times</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={usageData.responseTimes}
              xAxis="timestamp"
              yAxis="duration"
              className="h-[300px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={usageData.statusCodes}
              valueKey="count"
              categoryKey="status"
              className="h-[300px]"
            />
            <div className="mt-4 space-y-2">
              {Object.entries(usageData.statusCodes).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(parseInt(status))}>
                      {status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {count} requests
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {((count / usageData.totalRequests) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endpoint Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={usageData.endpointUsage}
              valueKey="requests"
              categoryKey="endpoint"
              className="h-[300px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default APIUsageTracker;