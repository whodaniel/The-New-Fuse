import React, { FC } from 'react';

export interface AnalyticsDashboardProps {
  className?: string;
  children?: React.ReactNode;
}

export const AnalyticsDashboard: FC<AnalyticsDashboardProps> = ({ className, children }) => (
  <div className={`tnf-analyticsDashboard ${className || ''}`} data-testid="analyticsDashboard">
    {children || <span>AnalyticsDashboard</span>}
  </div>
);

export default AnalyticsDashboard;
