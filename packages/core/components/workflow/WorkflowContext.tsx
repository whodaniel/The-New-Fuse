import React, { FC, JSX } from 'react';

export interface WorkflowContextProps {
  className?: string;
  children?: React.ReactNode;
}

export const WorkflowContext: FC<WorkflowContextProps> = ({ className, children }) => (
  <div className={`tnf-workflowContext ${className || ''}`} data-testid="workflowContext">
    {children || <span>WorkflowContext</span>}
  </div>
);

export default WorkflowContext;
