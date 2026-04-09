// @ts-nocheck
import { useDebug } from '@/hooks/useDebug';
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { PerformanceMonitor } from './PerformanceMonitor';

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
