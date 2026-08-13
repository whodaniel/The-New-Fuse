import React, { FC } from 'react';

export interface DashboardProps {
  className?: string;
  children?: React.ReactNode;
}

export const Dashboard: FC<DashboardProps> = ({ className, children }) => (
  <div className={`tnf-dashboard ${className || ''}`} data-testid="dashboard">
    {children || <span>Dashboard</span>}
  </div>
);

export default Dashboard;
