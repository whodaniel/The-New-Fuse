import React, { FC } from 'react';

export interface MetricCardProps {
  className?: string;
  children?: React.ReactNode;
}

export const MetricCard: FC<MetricCardProps> = ({ className, children }) => (
  <div className={`tnf-metricCard ${className || ''}`} data-testid="metricCard">
    {children || <span>MetricCard</span>}
  </div>
);

export default MetricCard;
