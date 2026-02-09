import React from 'react';
import { useSelector } from 'react-redux';
import { ExecutionStatus } from './ExecutionStatus';
import { ExecutionPath } from './ExecutionPath';
import { useWorkflowExecution } from '../../../hooks/useWorkflowExecution';
import type { WorkflowState } from '../../../types/workflow';

export const ExecutionOverlay: React.FC = () => {
  const { isExecuting, currentNode, executionPath } = useSelector(
    (state: WorkflowState) => state.execution
  );
  const { pauseExecution, resumeExecution, stopExecution } = useWorkflowExecution();

  if (!isExecuting) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <ExecutionPath path={executionPath} />
      <ExecutionStatus
        currentNode={currentNode}
        onPause={pauseExecution}
        onResume={resumeExecution}
        onStop={stopExecution}
      />
    </div>
  );
};