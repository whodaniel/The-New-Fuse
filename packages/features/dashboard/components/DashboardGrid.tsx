import React, { FC } from 'react';

export interface DashboardGridProps {
  className?: string;
  children?: React.ReactNode;
}

export const DashboardGrid: FC<DashboardGridProps> = ({ className, children }) => (
  <div className={`tnf-dashboardGrid ${className || ''}`} data-testid="dashboardGrid">
    {children || <span>DashboardGrid</span>}
  </div>
);

export default DashboardGrid;
