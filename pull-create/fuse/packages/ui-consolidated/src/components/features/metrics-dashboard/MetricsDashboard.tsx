import React from 'react';
import { useMetrics } from '../../../hooks/useMetrics';
import { Metric } from '@the-new-fuse/api-types/src/metrics';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card/Card';
import { List, ListItem } from '../../List/List';
import { Skeleton } from '../../Skeleton/Skeleton';
import { Alert, AlertDescription, AlertTitle } from '../../Alert/Alert';

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