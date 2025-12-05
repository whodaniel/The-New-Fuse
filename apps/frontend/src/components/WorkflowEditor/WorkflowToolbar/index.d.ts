import React from 'react';
interface WorkflowToolbarProps {
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  lastSaved: Date;
  validationErrors: string[];
}
export declare const WorkflowToolbar: React.FC<WorkflowToolbarProps>;
export {};
