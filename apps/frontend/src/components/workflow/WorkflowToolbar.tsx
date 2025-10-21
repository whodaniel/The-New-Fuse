import React from 'react';

interface WorkflowToolbarProps {
  workflowName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onExecute: () => void;
  isSaving: boolean;
  isExecuting: boolean;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  workflowName,
  onNameChange,
  onSave,
  onExecute,
  isSaving,
  isExecuting
}) => {
  return (
    <div className="absolute top-2.5 left-2.5 right-2.5 z-10 bg-white p-3 rounded-md shadow-md border border-gray-200">
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Workflow:</span>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => onNameChange(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter workflow name"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {isSaving && (
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          <button
            onClick={onExecute}
            disabled={isExecuting}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {isExecuting && (
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{isExecuting ? 'Executing...' : 'Execute'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};