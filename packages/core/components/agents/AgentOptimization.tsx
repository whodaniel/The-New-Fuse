import React, { FC, JSX } from 'react';

export interface AgentOptimizationProps {
  className?: string;
  children?: React.ReactNode;
}

export const AgentOptimization: FC<AgentOptimizationProps> = ({ className, children }) => (
  <div className={`tnf-agentOptimization ${className || ''}`} data-testid="agentOptimization">
    {children || <span>AgentOptimization</span>}
  </div>
);

export default AgentOptimization;
