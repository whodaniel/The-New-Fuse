import React, { FC } from 'react';

export interface DashboardProviderProps {
  className?: string;
  children?: React.ReactNode;
}

export const DashboardProvider: FC<DashboardProviderProps> = ({ className, children }) => (
  <div className={`tnf-dashboardProvider ${className || ''}`} data-testid="dashboardProvider">
    {children || <span>DashboardProvider</span>}
  </div>
);

export default DashboardProvider;
