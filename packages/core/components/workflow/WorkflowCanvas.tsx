import React, { FC, JSX } from 'react';

export interface WorkflowCanvasProps {
  className?: string;
  children?: React.ReactNode;
}

export const WorkflowCanvas: FC<WorkflowCanvasProps> = ({ className, children }) => (
  <div className={`tnf-workflowCanvas ${className || ''}`} data-testid="workflowCanvas">
    {children || <span>WorkflowCanvas</span>}
  </div>
);

export default WorkflowCanvas;
