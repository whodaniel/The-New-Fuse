import React from 'react';
import { WorkflowError as WorkflowErrorType } from '../types.js'; // Added .js extension
import { Button } from '../../../core/button/index.js'; // Added .js extension
import { Badge } from '../../../core/badge.js'; // Added .js extension
import { Alert, AlertDescription, AlertTitle } from '../../../core/alert/index.js'; // Added .js extension
import { RefreshCw, XCircle } from 'lucide-react';

interface WorkflowErrorProps {
  error: WorkflowErrorType;
  stepId?: string;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const WorkflowError: React.FC<WorkflowErrorProps> = ({
  error,
  stepId,
  onRetry,
  onCancel,
}) => {
  return (
    <Alert variant="destructive" className="my-4">
      <XCircle className="h-4 w-4" />
      <AlertTitle>
        {stepId ? `Error in step ${stepId}` : 'Workflow Error'}
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2">
          <p className="mb-2">{error.message}</p>
          {error.code && (
            <Badge variant="outline" className="mb-2">
              Error Code: {error.code}
            </Badge>
          )}
          {error.details && (
            <pre className="text-xs bg-secondary p-2 rounded mt-2 overflow-auto max-h-40">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          )}
          
          {(onRetry || onCancel) && (
            <div className="flex gap-2 mt-4">
              {onRetry && (
                <Button onClick={onRetry} size="sm" variant="default">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
              
              {onCancel && (
                <Button onClick={onCancel} size="sm" variant="outline">
                  <XCircle className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};