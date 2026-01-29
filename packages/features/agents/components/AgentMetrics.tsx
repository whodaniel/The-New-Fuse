'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { Agent, AgentMetrics as AgentMetricsType } from './types';

interface AgentMetricsProps {
  agent: Agent;
  metrics?: AgentMetricsType;
}

interface MetricDataPoint {
  timestamp: string;
  value: number;
}

export const AgentMetrics: React.FC<AgentMetricsProps> = ({ agent, metrics }) => {
  const displayMetrics = metrics || agent.metrics;

  if (!displayMetrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">No metrics available for this agent</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{displayMetrics.averageResponseTime}ms</div>
          <p className="text-sm text-gray-500">Average response time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{displayMetrics.successRate}%</div>
          <p className="text-sm text-gray-500">Request success rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{displayMetrics.totalCalls.toLocaleString()}</div>
          <p className="text-sm text-gray-500">Total API calls</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Completed</span>
              <span className="font-medium">{displayMetrics.completedTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Failed</span>
              <span className="font-medium">{displayMetrics.failedTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Total</span>
              <span className="font-medium">{displayMetrics.totalTasks}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">CPU</div>
              <div className="text-xl font-semibold">{displayMetrics.resourceUsage?.cpu ?? 0}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Memory</div>
              <div className="text-xl font-semibold">
                {displayMetrics.resourceUsage?.memory ?? 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {displayMetrics.lastActive && (
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">
              Last active: {new Date(displayMetrics.lastActive).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
