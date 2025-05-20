import React from 'react';
import { Button } from '../../../core/button.js';
import { WorkflowStep } from '../types.js';

interface WorkflowStepViewerProps {
  step: WorkflowStep;
  onEdit?: (step: WorkflowStep) => void;
  onDelete?: (step: WorkflowStep) => void;
  readOnly?: boolean;
}

export const WorkflowStepViewer: React.FC<WorkflowStepViewerProps> = ({
  step,
  onEdit,
  onDelete,
  readOnly = false
}) => {
  return (
    <div className="bg-background border border-border rounded-lg p-4 mb-2">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-medium">{step.name}</h3>
          <p className="text-muted-foreground text-sm">{step.type}</p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            {onEdit && (
              <Button onClick={() => onEdit(step)} variant="outline" size="sm">
                Edit
              </Button>
            )}
            {onDelete && (
              <Button onClick={() => onDelete(step)} variant="destructive" size="sm">
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
      
      {step.description && (
        <p className="text-sm mb-3">{step.description}</p>
      )}
      
      {step.config && Object.keys(step.config).length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-medium mb-1">Configuration:</h4>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(step.config, null, 2)}
          </pre>
        </div>
      )}
      
      {step.status && (
        <div className="mt-3 text-sm">
          <span className="font-medium">Status:</span>{' '}
          <span className={`px-2 py-1 rounded text-xs ${
            step.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
            step.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
            step.status === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            {step.status}
          </span>
        </div>
      )}
      
      {step.error && (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400">
          <span className="font-medium">Error:</span> {step.error}
        </div>
      )}
    </div>
  );
};