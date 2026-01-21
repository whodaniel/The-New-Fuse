import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NodeProperties, NodeToolbox, WorkflowCanvas } from '@/components/workflow';
import { WorkflowProvider } from '@/contexts/WorkflowContext';
import { useWorkflow } from '@/hooks';
import {
  ChevronLeft,
  Download,
  PanelLeftOpen,
  PanelRightOpen,
  Play,
  Redo,
  Save,
  Undo,
  Upload,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

/**
 * Workflow Builder page component
 */
const WorkflowBuilder: React.FC = () => {
  const { currentWorkflow, saveWorkflow, executeWorkflow } = useWorkflow();
  const navigate = useNavigate();
  const [workflowName, setWorkflowName] = useState(currentWorkflow?.name || 'Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState(
    currentWorkflow?.description || ''
  );
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Update workflow name and description when currentWorkflow changes
  useEffect(() => {
    if (currentWorkflow) {
      setWorkflowName(currentWorkflow.name);
      setWorkflowDescription(currentWorkflow.description || '');
    }
  }, [currentWorkflow]);

  // Handle workflow save
  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      if (currentWorkflow) {
        await saveWorkflow({
          ...currentWorkflow,
          name: workflowName,
          description: workflowDescription,
        });
      }
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving workflow:', error);
      setIsSaving(false);
    }
  };

  // Handle workflow execution
  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    try {
      if (currentWorkflow) {
        await executeWorkflow(currentWorkflow);
      }
      setIsExecuting(false);
    } catch (error) {
      console.error('Error executing workflow:', error);
      setIsExecuting(false);
    }
  };

  // Handle workflow export
  const handleExportWorkflow = () => {
    // In a real app, this would export the workflow as JSON
    console.log('Exporting workflow');
  };

  // Handle workflow import
  const handleImportWorkflow = () => {
    // In a real app, this would import a workflow from JSON
    console.log('Importing workflow');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="border-b border-white/10 p-2 bg-slate-900/60 backdrop-blur-md h-14 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/workflows')}
                className="shrink-0"
              >
                <ChevronLeft className="h-4 w-4 md:mr-1" />
                <span className="hidden md:inline">Back</span>
              </Button>
              <div className="flex-1 min-w-0">
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="text-lg md:text-xl font-bold border-none! h-auto p-0 focus-visible:ring-0 w-full bg-transparent! text-white! placeholder:text-gray-400"
                  placeholder="Untitled Workflow"
                />
                <p className="text-muted-foreground text-xs md:text-sm truncate">
                  Workflow Builder
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              {/* Panel toggle buttons - visible on all screens now */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeftPanel(!showLeftPanel)}
                title={showLeftPanel ? 'Hide nodes panel' : 'Show nodes panel'}
                className={showLeftPanel ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400'}
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRightPanel(!showRightPanel)}
                title={showRightPanel ? 'Hide properties panel' : 'Show properties panel'}
                className={showRightPanel ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400'}
              >
                <PanelRightOpen className="h-4 w-4" />
              </Button>
              {/* Action buttons - hidden on smallest screens */}
              <div className="hidden sm:flex items-center gap-1 md:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportWorkflow}
                  title="Export Workflow"
                  className="hidden lg:inline-flex"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportWorkflow}
                  title="Import Workflow"
                  className="hidden lg:inline-flex"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {}}
                  title="Undo"
                  disabled
                  className="hidden md:inline-flex"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {}}
                  title="Redo"
                  disabled
                  className="hidden md:inline-flex"
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExecuteWorkflow}
                  disabled={isExecuting}
                >
                  <Play className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">
                    {isExecuting ? 'Executing...' : 'Execute'}
                  </span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveWorkflow}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left sidebar - Node toolbox */}
          <div
            className={`${
              showLeftPanel ? 'w-64 translate-x-0 opacity-100' : 'w-0 -translate-x-full opacity-0'
            } relative z-20 h-full border-r border-white/10 bg-slate-900/95 backdrop-blur-md overflow-hidden transition-all duration-300 ease-in-out`}
          >
            <div className="w-64 p-3 h-full overflow-y-auto">
              <NodeToolbox />
            </div>
          </div>

          {/* Overlay for mobile when panels are open - only needed for very small screens if we wanted overlapping, 
              but here we are switching to a flex layout where they take space or don't. 
              Actually, for mobile we might still want absolute to save space, but the user requested collapsible.
              Let's stick to the relative flex layout for desktop-like feel, and maybe absolute for mobile?
              For simplicity and robustness, let's make them collapsible columns. 
          */}

          {/* Center - Workflow canvas */}
          <div className="flex-1 overflow-hidden">
            <ReactFlowProvider>
              <WorkflowProvider>
                <WorkflowCanvas onNodeSelect={setSelectedNode} />
              </WorkflowProvider>
            </ReactFlowProvider>
          </div>

          {/* Right sidebar - Node properties */}
          <div
            className={`${
              showRightPanel ? 'w-80 translate-x-0 opacity-100' : 'w-0 translate-x-full opacity-0'
            } relative right-0 z-20 h-full border-l border-white/10 bg-slate-900/95 backdrop-blur-md overflow-hidden transition-all duration-300 ease-in-out`}
          >
            <div className="w-80 p-3 h-full overflow-y-auto">
              {selectedNode ? (
                <NodeProperties node={selectedNode} />
              ) : (
                <div>
                  <h3 className="font-medium mb-4 text-white">Workflow Properties</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description" className="text-gray-300">
                        Description
                      </Label>
                      <Input
                        id="description"
                        value={workflowDescription}
                        onChange={(e) => setWorkflowDescription(e.target.value)}
                        placeholder="Describe the purpose of this workflow"
                        className="bg-slate-800/50 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="trigger" className="text-gray-300">
                        Trigger
                      </Label>
                      <select
                        id="trigger"
                        aria-label="Workflow trigger type"
                        className="w-full p-2 border border-white/10 rounded-md bg-slate-800/50 text-white"
                      >
                        <option value="manual">Manual</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="webhook">Webhook</option>
                        <option value="event">Event</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkflowBuilder;
