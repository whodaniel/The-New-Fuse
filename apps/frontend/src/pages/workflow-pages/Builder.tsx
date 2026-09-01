import AISourceSelector from '@/components/ai/AISourceSelector';
import {
  PremiumButton as Button,
  PremiumInput as Input,
  Label,
  Popover,
  PopoverBody,
} from '@/components/ui';
import { NodeProperties, NodeToolbox, WorkflowCanvas } from '@/components/workflow';
import WorkflowAIAssistantPanel from '@/components/workflow/WorkflowAIAssistantPanel';
import { WorkflowHostProvider, WorkflowProvider } from '@the-new-fuse/workflow-builder';
import { saasWorkflowHost } from '@/workflow/saas-workflow-host';
import { useWorkflow } from '@/hooks';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Redo,
  Save,
  Settings2,
  Sparkles,
  Undo,
  Upload,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

/**
 * Inner content component that consumes WorkflowProvider context.
 * Must be rendered as a child of WorkflowProvider.
 */
const WorkflowBuilderContent: React.FC = () => {
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
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPanelSeedPrompt, setAiPanelSeedPrompt] = useState('');

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

  // Handle AI workflow generation from natural language prompt
  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return;
    setAiPanelSeedPrompt(aiPrompt.trim());
    setShowAiDialog(false);
    setShowAiPanel(true);
    setShowRightPanel(true);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header - Compact with workflow properties dropdown */}
        <div className="border-b border-white/10 px-3 py-2 bg-slate-900/80 backdrop-blur-md h-12 flex items-center">
          <div className="flex items-center justify-between gap-2 w-full">
            {/* Left section: Back button + Name + Properties dropdown */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* NF Branding Logo */}
              <div className="flex items-center gap-2 mr-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20">
                  <span className="text-white font-black text-sm tracking-tight">NF</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/workflows')}
                title="Back to workflows"
                className="shrink-0 h-8 w-8 p-0 hover:bg-slate-800"
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

              <div className="flex-1 min-w-0 flex items-center gap-2 group">
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="text-sm font-semibold border-none! h-8 py-1 px-2 focus-visible:ring-1 focus-visible:ring-blue-500 w-auto max-w-[200px] bg-transparent! text-white! placeholder:text-gray-400"
                  placeholder="Untitled Workflow"
                />
                <Edit className="h-3.5 w-3.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />

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
                        className="bg-slate-800/50 border-white/10 text-white placeholder:text-muted-foreground h-8 text-sm"
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAiPanel((prev) => !prev)}
                  title="Toggle AI Builder"
                  className={`h-8 text-xs ${showAiPanel ? 'border-blue-500/40 text-blue-300' : ''}`}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  AI Builder
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
          <div className="flex-1 overflow-hidden relative">
            <WorkflowCanvas onNodeSelect={setSelectedNode} />

            {/* Talk to AI FAB */}
            <button
              onClick={() => setShowAiDialog(true)}
              className="absolute bottom-4 left-4 z-30 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-200 font-semibold text-sm"
              title="Talk to AI - Describe your workflow"
            >
              <Sparkles className="h-4 w-4" />
              <span>Talk to AI</span>
            </button>
          </div>

          {/* Right sidebar - Node properties + AI Builder */}
          {(showRightPanel || showAiPanel) && (
            <div className="w-80 relative z-20 h-full border-l border-white/10 bg-slate-900/95 backdrop-blur-md overflow-hidden">
              <div className="p-3 h-full overflow-y-auto space-y-3">
                {showRightPanel && selectedNode && (
                  <div className="rounded-md border border-white/10 bg-slate-950/70 p-3">
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
                )}

                {showAiPanel && (
                  <WorkflowAIAssistantPanel
                    initialPrompt={aiPanelSeedPrompt}
                    onApplyMeta={(name, description) => {
                      if (name) setWorkflowName(name);
                      if (description) setWorkflowDescription(description);
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Talk Dialog Overlay */}
        {showAiDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAiDialog(false)}
            />
            <div className="relative w-full max-w-lg mx-4 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl shadow-violet-500/10 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                  <h3 className="text-lg font-semibold text-white">Talk to AI</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAiDialog(false)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 space-y-4">
                <AISourceSelector compact label="AI Source" />
                <div>
                  <Label className="text-xs text-gray-400 mb-1.5 block">
                    Describe the workflow you want to build
                  </Label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Build a flow connecting a Github MCP to a Code Review Agent"
                    className="w-full h-28 px-3 py-2 text-sm bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    The AI will generate nodes and connections based on your description
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAiDialog(false)}
                      className="h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAiGenerate}
                      disabled={!aiPrompt.trim()}
                      className="h-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0"
                    >
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Open AI Builder
                      </>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

/**
 * Workflow Builder page component (outer wrapper)
 *
 * WorkflowHostProvider is outermost: WorkflowProvider itself now reads the
 * persistence port from it, as do the nodes and the properties panel. The
 * ReactFlow/Workflow nesting is unchanged so WorkflowBuilderContent can still
 * call useWorkflowContext().
 */
const WorkflowBuilder: React.FC = () => {
  return (
    <WorkflowHostProvider host={saasWorkflowHost}>
      <ReactFlowProvider>
        <WorkflowProvider>
          <WorkflowBuilderContent />
        </WorkflowProvider>
      </ReactFlowProvider>
    </WorkflowHostProvider>
  );
};

export default WorkflowBuilder;
