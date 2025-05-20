import React from 'react';
import { Button } from '../../../core/button.js';
import { WorkflowStatus } from '../types.js';

interface WorkflowControlsProps {
  status: WorkflowStatus;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  disabled?: boolean;
}

export const WorkflowControls: React.FC<WorkflowControlsProps> = ({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled = false
}) => {
  return (
    <div className="flex items-center space-x-2">
      {status === WorkflowStatus.IDLE && (
        <Button onClick={onStart} disabled={disabled} variant="default">
          Start
        </Button>
      )}

      {status === WorkflowStatus.RUNNING && (
        <>
          <Button onClick={onPause} disabled={disabled} variant="outline">
            Pause
          </Button>
          <Button onClick={onStop} disabled={disabled} variant="destructive">
            Stop
          </Button>
        </>
      )}

      {status === WorkflowStatus.PAUSED && (
        <>
          <Button onClick={onResume} disabled={disabled} variant="default">
            Resume
          </Button>
          <Button onClick={onStop} disabled={disabled} variant="destructive">
            Stop
          </Button>
        </>
      )}

      {(status === WorkflowStatus.COMPLETED || status === WorkflowStatus.FAILED) && (
        <Button onClick={onStart} disabled={disabled} variant="default">
          Restart
        </Button>
      )}
    </div>
  );
};