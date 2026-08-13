import React, { FC, JSX } from 'react';

export interface AgentCreationFormProps {
  className?: string;
  children?: React.ReactNode;
}

export const AgentCreationForm: FC<AgentCreationFormProps> = ({ className, children }) => (
  <div className={`tnf-agentCreationForm ${className || ''}`} data-testid="agentCreationForm">
    {children || <span>AgentCreationForm</span>}
  </div>
);

export default AgentCreationForm;
