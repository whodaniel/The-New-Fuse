import React from 'react';
import { Button } from '../../ui/Button.js';
import { ValidationErrors } from './ValidationErrors.js';
import { ShareButton } from './ShareButton.js';
import { DeployButton } from './DeployButton.js';
import { useWorkflowActions } from '../../../hooks/useWorkflowActions.js';

interface WorkflowToolbarProps {
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  lastSaved: Date;
  validationErrors: string[];
}

export const WorkflowToolbar: React.React.FC<WorkflowToolbarProps> = ({
  onSave,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  lastSaved,
  validationErrors,
}) => {
  const { executeWorkflow, deployWorkflow } = useWorkflowActions();

  return (
    <div className="workflow-toolbar flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          onClick={onUndo}
          disabled={!canUndo}
          icon="undo"
          tooltip="Undo (Ctrl+Z)"
        />
        <Button
          variant="ghost"
          onClick={onRedo}
          disabled={!canRedo}
          icon="redo"
          tooltip="Redo (Ctrl+Y)"
        />
        <div className="h-6 w-px bg-gray-300 mx-2" />
        <Button
          variant="primary"
          onClick={onSave}
          icon="save"
          tooltip={`Last saved: ${lastSaved.toLocaleTimeString()}`}
        >
          Save
        </Button>
        <Button
          variant="secondary"
          onClick={executeWorkflow}
          icon="play"
          tooltip="Execute workflow"
        >
          Execute
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <ValidationErrors errors={validationErrors} />
        <ShareButton />
        <DeployButton onDeploy={deployWorkflow} />
      </div>
    </div>
  );
};