import { MetricsPanel } from '@the-new-fuse/metrics/MetricsPanel';
import { DataVisualization } from '@the-new-fuse/visualization/DataVisualization';
import { WidgetGrid } from '@the-new-fuse/widgets/WidgetGrid';
import { FC, JSX } from 'react';

export const DashboardRoot: FC = (): JSX.Element => (): JSX.Element => (): JSX.Element => {
  return (
    <div className="dashboard-container">
      <MetricsPanel />
      <WidgetGrid />
      <DataVisualization />
    </div>
  );
};

export * from '@the-new-fuse/metrics';
export * from '@the-new-fuse/visualization';
export * from '@the-new-fuse/widgets';
