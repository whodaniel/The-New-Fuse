import React, { useState, useEffect } from 'react';
import { useWorkflow } from '@/hooks';
import { useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { WorkflowProvider } from '@/contexts/WorkflowContext';
import 'reactflow/dist/style.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowCanvas, NodeToolbox, NodeProperties } from '@/components/workflow';
import {
  Save,
  Play,
  X,
  ChevronLeft,
  Download,
  Upload,
  Undo,
  Redo
} from 'lucide-react';

/**
 * Workflow Builder page component
 */
const WorkflowBuilder: React.FC = () => {
  const { currentWorkflow, saveWorkflow, executeWorkflow } = useWorkflow();
  const navigate = useNavigate();
  const [workflowName, setWorkflowName] = useState(currentWorkflow?.name || 'Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState(currentWorkflow?.description || '');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

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
          description: workflowDescription
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
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/workflows')}
                className="mr-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="text-xl font-bold border-none h-auto p-0 focus-visible:ring-0"
                  placeholder="Untitled Workflow"
                />
                <p className="text-muted-foreground text-sm">Workflow Builder</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportWorkflow}
                title="Export Workflow"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportWorkflow}
                title="Import Workflow"
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
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {}}
                title="Redo"
                disabled
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExecuteWorkflow}
                disabled={isExecuting}
              >
                <Play className="h-4 w-4 mr-2" />
                {isExecuting ? 'Executing...' : 'Execute'}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveWorkflow}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Node toolbox */}
          <div className="w-64 border-r bg-white p-4 overflow-y-auto">
            <h3 className="font-medium mb-4">Nodes</h3>
            <NodeToolbox />
          </div>

          {/* Center - Workflow canvas */}
          <div className="flex-1 overflow-hidden">
            <ReactFlowProvider>
              <WorkflowProvider>
                <WorkflowCanvas onNodeSelect={setSelectedNode} />
              </WorkflowProvider>
            </ReactFlowProvider>
          </div>

          {/* Right sidebar - Node properties */}
          <div className="w-80 border-l bg-white p-4 overflow-y-auto">
            {selectedNode ? (
              <NodeProperties node={selectedNode} />
            ) : (
              <div>
                <h3 className="font-medium mb-4">Workflow Properties</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={workflowDescription}
                      onChange={(e) => setWorkflowDescription(e.target.value)}
                      placeholder="Describe the purpose of this workflow"
                    />
                  </div>
                  <div>
                    <Label htmlFor="trigger">Trigger</Label>
                    <select
                      id="trigger"
                      aria-label="Workflow trigger type"
                      className="w-full p-2 border rounded-md"
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
      </main>
    </div>
  );
};

export default WorkflowBuilder;
