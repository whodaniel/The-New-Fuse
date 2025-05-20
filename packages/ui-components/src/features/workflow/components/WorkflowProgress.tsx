import React from 'react';
import { WorkflowStep, WorkflowStatus } from '../types.js';
import { Progress } from '../../../core/progress.js';

interface WorkflowProgressProps {
  steps: WorkflowStep[];
  currentStepId?: string;
  status: WorkflowStatus;
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  steps,
  currentStepId,
  status
}) => {
  // Calculate progress as percentage
  const calculateProgress = (): number => {
    if (!steps.length) return 0;
    if (status === WorkflowStatus.COMPLETED) return 100;
    if (status === WorkflowStatus.IDLE) return 0;
    
    // Count completed steps
    const completedSteps = steps.filter(step: WorkflowStep => 
      step.status === 'completed' || step.status === 'skipped'
    ).length;
    
    // If current step is running, add partial credit
    const currentStepIndex = currentStepId 
      ? steps.findIndex(step: WorkflowStep => step.id === currentStepId) 
      : -1;
    
    if (currentStepIndex >= 0 && steps[currentStepIndex].status === 'running') {
      const completedWithPartial = completedSteps + 0.5;
      return Math.round((completedWithPartial / steps.length) * 100);
    }
    
    return Math.round((completedSteps / steps.length) * 100);
  };

  const progressValue = calculateProgress();
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="font-medium">Workflow Progress</span> 
          <span className="text-muted-foreground ml-2">({progressValue}%)</span>
        </div>
        <span className="capitalize">
          {status === WorkflowStatus.IDLE ? 'Not Started' : status}
        </span>
      </div>
      
      <Progress value={progressValue} />
      
      <div className="text-xs text-muted-foreground flex justify-between">
        <div>
          {steps.filter(step: WorkflowStep => step.status === 'completed').length} of {steps.length} steps completed
        </div>
        {currentStepId && status === WorkflowStatus.RUNNING && (
          <div>
            Current: {steps.find(step: WorkflowStep => step.id === currentStepId)?.name || 'Unknown step'}
          </div>
        )}
      </div>
    </div>
  );
};