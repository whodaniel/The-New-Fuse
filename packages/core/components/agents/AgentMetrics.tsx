import React, { FC, JSX } from 'react';

export interface AgentMetricsProps {
  className?: string;
  children?: React.ReactNode;
}

export const AgentMetrics: FC<AgentMetricsProps> = ({ className, children }) => (
  <div className={`tnf-agentMetrics ${className || ''}`} data-testid="agentMetrics">
    {children || <span>AgentMetrics</span>}
  </div>
);

export default AgentMetrics;
