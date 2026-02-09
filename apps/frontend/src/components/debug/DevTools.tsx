import React from 'react';
import { useDebug } from '@/hooks/useDebug';
import { PerformanceMonitor } from './PerformanceMonitor';
import { ErrorBoundary } from './ErrorBoundary';

export const DevTools: React.FC = () => {
  const { enabled, metrics, errors } = useDebug();

  return enabled ? (
    <div className="dev-tools">
      <PerformanceMonitor metrics={metrics} />
      <ErrorBoundary errors={errors}>
        <ErrorLog />
        <StateInspector />
        <NetworkMonitor />
      </ErrorBoundary>
    </div>
  ) : null;
};