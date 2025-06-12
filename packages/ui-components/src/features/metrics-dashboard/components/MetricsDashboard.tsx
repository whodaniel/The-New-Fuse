import React from 'react';
import { useMetrics, Metric } from '../hooks/useMetrics.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../../core/card/index.tsx';
import { List, ListItem } from '../../../core/list/index.tsx';
import { Skeleton } from '../../../core/skeleton/index.tsx';
import { Alert, AlertDescription, AlertTitle } from '../../../core/alert/index.tsx';

export const MetricsDashboard: React.FC = () => {
  const { data, loading, error } = useMetrics();

  if (loading) return <Skeleton />;
  if (error || !data) return (
    <Alert>
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metrics Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <section>
          <h3>Step Metrics</h3>
          <List>
            {data.stepMetrics.map((metric: Metric) => (
              <ListItem key={metric.id}>
                <div className="flex justify-between">
                  <span>{metric.name}</span>
                  <span>{metric.value}</span>
                </div>
              </ListItem>
            ))}
          </List>
        </section>
        <section>
          <h3>Memory Metrics</h3>
          <p>Total Items: {data.memoryMetrics.totalItems}</p>
          <p>Hit Rate: {data.memoryMetrics.hitRate}%</p>
        </section>
      </CardContent>
    </Card>
  );
};