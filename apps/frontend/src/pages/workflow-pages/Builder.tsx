import {
  PremiumButton as Button,
  PremiumInput as Input,
  GlassCard,
} from '@/components/ui/premium';
import { Label } from '@/components/ui/label';
import { Popover, PopoverBody } from '@/components/ui/popover';
import { NodeProperties, NodeToolbox, WorkflowCanvas } from '@/components/workflow';
import { WorkflowProvider } from '@/contexts/WorkflowContext';
import { useWorkflow } from '@/hooks';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Redo,
  Save,
  Settings2,
  Undo,
  Upload,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

/**
 * Workflow Builder page component
 * - Collapsible left sidebar for node toolbox
 * - Workflow properties in header dropdown
 * - Compact, responsive layout
 */
const WorkflowBuilder: React.FC = () => {
  const { currentWorkflow, saveWorkflow, executeWorkflow } = useWorkflow();
  const navigate = useNavigate();
  const [workflowName, setWorkflowName] = useState(currentWorkflow?.name || 'Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState(
    currentWorkflow?.description || ''
  );
  const [trigger, setTrigger] = useState('manual');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false);

  // Update workflow name and description when currentWorkflow changes
  useEffect(() => {
    if (currentWorkflow) {
      setWorkflowName(currentWorkflow.name);
      setWorkflowDescription(currentWorkflow.description || '');
    }
  }, [currentWorkflow]);

  // Show right panel when a node is selected
  useEffect(() => {
    if (selectedNode) {
      setShowRightPanel(true);
    }
  }, [selectedNode]);

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
      if (currentWorkflow?.id) {
        await executeWorkflow(currentWorkflow.id);
      }
      setIsExecuting(false);
    } catch (error) {
      console.error('Error executing workflow:', error);
      setIsExecuting(false);
    }
  };

  // Handle workflow export
  const handleExportWorkflow = () => {
    console.log('Exporting workflow');
  };

  // Handle workflow import
  const handleImportWorkflow = () => {
    console.log('Importing workflow');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header - Compact with workflow properties dropdown */}
        <div className="border-b border-white/10 px-3 py-2 bg-slate-900/80 backdrop-blur-md h-12 flex items-center">
          <div className="flex items-center justify-between gap-2 w-full">
            {/* Left section: Back button + Name + Properties dropdown */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/workflows')}
                className="shrink-0 h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Left panel toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeftPanel(!showLeftPanel)}
                title={showLeftPanel ? 'Hide nodes panel' : 'Show nodes panel'}
                className={`shrink-0 h-8 w-8 p-0 ${showLeftPanel ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400'}`}
              >
                {showLeftPanel ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </Button>

              <div className="flex-1 min-w-0 flex items-center gap-2">
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="text-sm font-semibold border-none! h-8 py-1 px-2 focus-visible:ring-1 focus-visible:ring-blue-500 w-auto max-w-[200px] bg-transparent! text-white! placeholder:text-gray-400"
                  placeholder="Untitled Workflow"
                />

                {/* Workflow Properties Popover */}
                <Popover
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-gray-400 hover:text-white"
                    >
                      <Settings2 className="h-4 w-4 shrink-0" />
                      <span className="hidden md:inline text-xs ml-1">Properties</span>
                    </Button>
                  }
                  placement="bottom"
                  className="w-72 bg-slate-900 border-slate-700"
                >
                  <PopoverBody className="space-y-3 p-3">
                    <div>
                      <Label htmlFor="description" className="text-xs text-gray-400 mb-1 block">
                        Description
                      </Label>
                      <Input
                        id="description"
                        value={workflowDescription}
                        onChange={(e) => setWorkflowDescription(e.target.value)}
                        placeholder="Describe the workflow..."
                        className="bg-slate-800/50 border-white/10 text-white placeholder:text-gray-500 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="trigger" className="text-xs text-gray-400 mb-1 block">
                        Trigger
                      </Label>
                      <select
                        id="trigger"
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                        aria-label="Workflow trigger type"
                        className="w-full h-8 px-2 text-sm border border-white/10 rounded-md bg-slate-800/50 text-white"
                      >
                        <option value="manual">Manual</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="webhook">Webhook</option>
                        <option value="event">Event</option>
                      </select>
                    </div>
                  </PopoverBody>
                </Popover>
              </div>
            </div>

            {/* Right section: Action buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <div className="hidden lg:flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportWorkflow}
                  title="Export Workflow"
                  className="h-8 text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportWorkflow}
                  title="Import Workflow"
                  className="h-8 text-xs"
                >
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  Import
                </Button>
              </div>
              <div className="hidden md:flex items-center gap-1 border-l border-white/10 pl-1 ml-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {}}
                  title="Undo"
                  disabled
                  className="h-8 w-8 p-0"
                >
                  <Undo className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {}}
                  title="Redo"
                  disabled
                  className="h-8 w-8 p-0"
                >
                  <Redo className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExecuteWorkflow}
                disabled={isExecuting}
                className="h-8"
              >
                <Play className="h-3.5 w-3.5 md:mr-1" />
                <span className="hidden md:inline text-xs">
                  {isExecuting ? 'Running...' : 'Run'}
                </span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveWorkflow}
                disabled={isSaving}
                className="h-8"
              >
                <Save className="h-3.5 w-3.5 md:mr-1" />
                <span className="hidden md:inline text-xs">{isSaving ? 'Saving...' : 'Save'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <ReactFlowProvider>
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left sidebar - Node toolbox - Collapses to LEFT */}
            <div
              className={`${
                showLeftPanel ? 'w-56' : 'w-0'
              } relative z-20 h-full border-r border-white/10 bg-slate-900/95 backdrop-blur-md overflow-hidden transition-all duration-300 ease-in-out`}
            >
              <div className="w-56 p-3 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Nodes</h3>
                </div>
                <NodeToolbox />
              </div>
            </div>

            {/* Collapsed left panel indicator */}
            {!showLeftPanel && (
              <button
                onClick={() => setShowLeftPanel(true)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-slate-800 border border-white/10 rounded-r-lg p-1 hover:bg-slate-700 transition-colors"
                title="Show nodes panel"
              >
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            )}

            {/* Center - Workflow canvas */}
            <div className="flex-1 overflow-hidden">
              <WorkflowProvider>
                <WorkflowCanvas onNodeSelect={setSelectedNode} />
              </WorkflowProvider>
            </div>

            {/* Right sidebar - Node properties - Only shows when node is selected */}
            {showRightPanel && selectedNode && (
              <div className="w-72 relative z-20 h-full border-l border-white/10 bg-slate-900/95 backdrop-blur-md overflow-hidden">
                <div className="p-3 h-full overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">Node Properties</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowRightPanel(false);
                        setSelectedNode(null);
                      }}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <NodeProperties node={selectedNode} />
                </div>
              </div>
            )}
          </div>
        </ReactFlowProvider>
      </main>
    </div>
  );
};

export default WorkflowBuilder;
