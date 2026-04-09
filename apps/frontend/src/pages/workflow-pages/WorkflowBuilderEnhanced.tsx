/**
 * Enhanced Workflow Builder with N8N Import/Export Support
 * Full feature parity with N8N workflows
 */

import { WorkflowApiService } from '@/api/workflow';
import { Badge, Button, Card, CardContent } from '@/components/ui';
import { GlassCard } from '@/components/ui/design-system';
import { FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  EnhancedReactFlowNode,
  n8nConverter,
  N8nWorkflow,
} from '@/components/WorkflowEditor/converters/N8nWorkflowConverter';
import { useToast } from '@/hooks/useToast';
import React, { DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  FiAlertCircle,
  FiCalendar,
  FiCloud,
  FiCode,
  FiDatabase,
  FiDownload,
  FiFileText,
  FiGitBranch,
  FiMail,
  FiMessageSquare,
  FiPlay,
  FiPlus,
  FiRepeat,
  FiSave,
  FiUpload,
  FiUser,
} from 'react-icons/fi';
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  Panel,
  ReactFlowInstance,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Enhanced Custom Node Types with N8N features
const nodeTypes = {
  trigger: ({ data, selected }: any) => (
    <GlassCard
      className={`bg-green-500/10 border-green-500/20 backdrop-blur-sm ${
        data.disabled ? 'opacity-50' : ''
      } ${selected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-green-400 animate-pulse">{data.icon}</div>
            <div className="flex gap-1">
              {data.disabled && <FiAlertCircle className="text-yellow-500 text-xs" />}
              {data.retryOnFail && <FiRepeat className="text-blue-500 text-xs" />}
              {data.notes && <FiFileText className="text-gray-400 text-xs" />}
            </div>
          </div>
          <p className="text-sm font-bold text-white">{data.label}</p>
        </div>
      </CardContent>
    </GlassCard>
  ),
  action: ({ data, selected }: any) => (
    <GlassCard
      className={`bg-blue-500/10 border-blue-500/20 backdrop-blur-sm ${
        data.disabled ? 'opacity-50' : ''
      } ${selected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-blue-400">{data.icon}</div>
            <div className="flex gap-1">
              {data.disabled && <FiAlertCircle className="text-yellow-500 text-xs" />}
              {data.retryOnFail && <FiRepeat className="text-blue-500 text-xs" />}
              {data.notes && <FiFileText className="text-gray-400 text-xs" />}
            </div>
          </div>
          <p className="text-sm font-bold text-white">{data.label}</p>
          {data.status && (
            <Badge variant={data.status === 'completed' ? 'default' : 'secondary'}>
              {data.status}
            </Badge>
          )}
        </div>
      </CardContent>
    </GlassCard>
  ),
  condition: ({ data, selected }: any) => (
    <GlassCard
      className={`bg-orange-500/10 border-orange-500/20 backdrop-blur-sm ${
        data.disabled ? 'opacity-50' : ''
      } ${selected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-orange-400">{data.icon}</div>
            <div className="flex gap-1">
              {data.disabled && <FiAlertCircle className="text-yellow-500 text-xs" />}
              {data.notes && <FiFileText className="text-gray-400 text-xs" />}
            </div>
          </div>
          <p className="text-sm font-bold text-white">{data.label}</p>
        </div>
      </CardContent>
    </GlassCard>
  ),
  ai: ({ data, selected }: any) => (
    <GlassCard
      className={`bg-purple-500/10 border-purple-500/20 backdrop-blur-sm ${
        data.disabled ? 'opacity-50' : ''
      } ${selected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-purple-400">{data.icon}</div>
            <div className="flex gap-1">
              {data.disabled && <FiAlertCircle className="text-yellow-500 text-xs" />}
              {data.notes && <FiFileText className="text-gray-400 text-xs" />}
            </div>
          </div>
          <p className="text-sm font-bold text-white">{data.label}</p>
          {data.model && <Badge variant="secondary">{data.model}</Badge>}
        </div>
      </CardContent>
    </GlassCard>
  ),
};

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'ai';
  label: string;
  icon: React.ReactElement;
  description: string;
  category: string;
}

const availableNodes: WorkflowNode[] = [
  {
    id: 'webhook-trigger',
    type: 'trigger',
    label: 'Webhook Trigger',
    icon: <FiCloud />,
    description: 'Triggered by HTTP webhook calls',
    category: 'Triggers',
  },
  {
    id: 'schedule-trigger',
    type: 'trigger',
    label: 'Schedule Trigger',
    icon: <FiCalendar />,
    description: 'Triggered on a schedule (cron)',
    category: 'Triggers',
  },
  {
    id: 'ai-chat',
    type: 'ai',
    label: 'AI Chat',
    icon: <FiMessageSquare />,
    description: 'Chat with AI models',
    category: 'AI',
  },
  {
    id: 'ai-code-gen',
    type: 'ai',
    label: 'Code Generation',
    icon: <FiCode />,
    description: 'Generate code using AI',
    category: 'AI',
  },
  {
    id: 'database-query',
    type: 'action',
    label: 'Database Query',
    icon: <FiDatabase />,
    description: 'Query database records',
    category: 'Data',
  },
  {
    id: 'send-email',
    type: 'action',
    label: 'Send Email',
    icon: <FiMail />,
    description: 'Send email notifications',
    category: 'Communication',
  },
  {
    id: 'condition-check',
    type: 'condition',
    label: 'Condition',
    icon: <FiGitBranch />,
    description: 'Conditional branching logic',
    category: 'Logic',
  },
  {
    id: 'user-approval',
    type: 'action',
    label: 'User Approval',
    icon: <FiUser />,
    description: 'Require user approval to continue',
    category: 'Human',
  },
];

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const WorkflowBuilderContent: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<EnhancedReactFlowNode | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isNodePanelOpen, setIsNodePanelOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow settings (N8N)
  const [workflowSettings, setWorkflowSettings] = useState({
    timezone: 'America/New_York',
    executionTimeout: 3600,
    saveDataErrorExecution: 'all' as 'all' | 'none',
    saveDataSuccessExecution: 'all' as 'all' | 'none',
  });

  const { toast } = useToast();

  useEffect(() => {
    loadWorkflow();
  }, []);

  const loadWorkflow = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryWorkflowId = urlParams.get('id');

    if (queryWorkflowId) {
      setWorkflowId(queryWorkflowId);
      try {
        const workflowService = new WorkflowApiService();
        const response = await workflowService.getWorkflow(queryWorkflowId);

        if (response.success && response.data) {
          const workflow = response.data;

          const loadedNodes = workflow.nodes.map((node: any) => ({
            id: node.id,
            type: node.type,
            position: node.position || { x: 100, y: 100 },
            data: {
              label: node.data?.label || node.label || 'Untitled',
              type: node.data?.type || node.type,
              ...node.data,
            },
          }));

          const loadedEdges = workflow.edges.map((edge: any) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            data: edge.data || { label: '' },
          }));

          setNodes(loadedNodes);
          setEdges(loadedEdges);
        }
      } catch (error) {
        console.error('Failed to load workflow:', error);
        toast({
          title: 'Load Error',
          description: 'Failed to load the workflow',
          variant: 'destructive',
          duration: 3000,
        });
      }
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragStart = (event: DragEvent, nodeType: WorkflowNode) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const typeData = event.dataTransfer.getData('application/reactflow');
      if (!typeData) return;

      const nodeTemplate: WorkflowNode = JSON.parse(typeData);

      if (typeof nodeTemplate.type === 'undefined' || !nodeTemplate.type) {
        return;
      }

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }) || { x: 0, y: 0 };

      const newNode: Node = {
        id: `${nodeTemplate.id}-${Date.now()}`,
        type: nodeTemplate.type,
        position,
        data: {
          label: nodeTemplate.label,
          icon: nodeTemplate.icon,
          description: nodeTemplate.description,
          category: nodeTemplate.category,
          // N8N default properties
          disabled: false,
          retryOnFail: false,
          maxTries: 3,
          waitBetweenTries: 1000,
          continueOnFail: false,
          onError: 'stopWorkflow',
          parameters: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));

      toast({
        title: 'Node Added',
        description: `${nodeTemplate.label} has been added to the workflow`,
        variant: 'success',
        duration: 2000,
      });
    },
    [reactFlowInstance, setNodes, toast]
  );

  const addNode = (nodeTemplate: WorkflowNode) => {
    const newNode: Node = {
      id: `${nodeTemplate.id}-${Date.now()}`,
      type: nodeTemplate.type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        label: nodeTemplate.label,
        icon: nodeTemplate.icon,
        description: nodeTemplate.description,
        category: nodeTemplate.category,
        disabled: false,
        retryOnFail: false,
        parameters: {},
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setIsNodePanelOpen(false);

    toast({
      title: 'Node Added',
      description: `${nodeTemplate.label} has been added to the workflow`,
      variant: 'success',
      duration: 2000,
    });
  };

  // N8N Import
  const handleImportN8n = async () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const n8nWorkflow: N8nWorkflow = JSON.parse(text);

      // Validate
      const validation = n8nConverter.validateN8nWorkflow(n8nWorkflow);
      if (!validation.valid) {
        toast({
          title: 'Invalid Workflow',
          description: `Validation errors: ${validation.errors.join(', ')}`,
          variant: 'destructive',
          duration: 5000,
        });
        return;
      }

      // Convert
      const reactFlowWorkflow = n8nConverter.convertFromN8n(n8nWorkflow);

      // Load into builder
      setWorkflowName(reactFlowWorkflow.name);
      setWorkflowDescription(reactFlowWorkflow.description || '');
      setNodes(reactFlowWorkflow.nodes);
      setEdges(reactFlowWorkflow.edges);

      if (reactFlowWorkflow.settings) {
        setWorkflowSettings({
          timezone: reactFlowWorkflow.settings.timezone || 'America/New_York',
          executionTimeout: reactFlowWorkflow.settings.executionTimeout || 3600,
          saveDataErrorExecution: reactFlowWorkflow.settings.saveDataErrorExecution || 'all',
          saveDataSuccessExecution: reactFlowWorkflow.settings.saveDataSuccessExecution || 'all',
        });
      }

      toast({
        title: 'Workflow Imported',
        description: `Successfully imported "${reactFlowWorkflow.name}" from N8N`,
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import workflow',
        variant: 'destructive',
        duration: 3000,
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // N8N Export
  const handleExportN8n = () => {
    try {
      const reactFlowWorkflow = {
        id: `workflow-${Date.now()}`,
        name: workflowName,
        description: workflowDescription,
        nodes: nodes as EnhancedReactFlowNode[],
        edges: edges,
        settings: workflowSettings,
        active: false,
      };

      // Validate
      const validation = n8nConverter.validateReactFlowWorkflow(reactFlowWorkflow);
      if (!validation.valid) {
        toast({
          title: 'Invalid Workflow',
          description: `Validation errors: ${validation.errors.join(', ')}`,
          variant: 'destructive',
          duration: 5000,
        });
        return;
      }

      // Convert
      const n8nWorkflow = n8nConverter.convertToN8n(reactFlowWorkflow);

      // Download
      const blob = new Blob([JSON.stringify(n8nWorkflow, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Workflow Exported',
        description: `"${workflowName}" exported to N8N format`,
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export workflow',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      toast({
        title: 'Empty Workflow',
        description: 'Add some nodes to execute the workflow',
        variant: 'warning',
        duration: 3000,
      });
      return;
    }
    if (!workflowId) {
      toast({
        title: 'Save Required',
        description: 'Save this workflow before execution so it has a valid workflow ID.',
        variant: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsExecuting(true);
    try {
      const workflowService = new WorkflowApiService();
      const response = await workflowService.executeWorkflow(workflowId, {
        nodes: nodes,
        edges: edges,
      });
      const responseError =
        typeof response.error === 'string' ? response.error : response.error?.message;

      if (response.success && response.data) {
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: { ...n.data, status: 'completed' },
          }))
        );

        toast({
          title: 'Workflow Executed',
          description: `Workflow execution started: ${response.data.id}`,
          variant: 'success',
          duration: 3000,
        });
      } else {
        throw new Error(response.error || response.message || 'Failed to execute workflow');
      }
    } catch (error) {
      toast({
        title: 'Execution Error',
        description:
          error instanceof Error ? error.message : 'An error occurred during workflow execution',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const saveWorkflow = async () => {
    try {
      const workflowData = {
        id: workflowId || undefined,
        name: workflowName,
        description: workflowDescription,
        nodes: nodes,
        edges: edges,
        settings: workflowSettings,
      };

      const workflowService = new WorkflowApiService();
      const response = await workflowService.saveWorkflow(workflowData);
      const responseError =
        typeof response.error === 'string' ? response.error : response.error?.message;

      if (response.success && response.data) {
        if (response.data.id) {
          setWorkflowId(response.data.id);
        }
        toast({
          title: 'Workflow Saved',
          description: `"${workflowName}" has been saved successfully`,
          variant: 'success',
          duration: 3000,
        });
      } else {
        throw new Error(response.error || response.message || 'Failed to save workflow');
      }
    } catch (error) {
      toast({
        title: 'Save Error',
        description: error instanceof Error ? error.message : 'Failed to save the workflow',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsSaveModalOpen(false);
    }
  };

  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as EnhancedReactFlowNode);
    setIsSettingsOpen(true);
  };

  const updateNodeSettings = () => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((n) => (n.id === selectedNode.id ? { ...n, data: selectedNode.data } : n))
    );

    toast({
      title: 'Node Updated',
      description: 'Node settings have been saved',
      variant: 'success',
      duration: 2000,
    });

    setIsSettingsOpen(false);
  };

  return (
    <div className="h-screen w-full relative flex">
      {/* Hidden file input for N8N import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Main Flow Canvas */}
      <div className="flex-1 h-full relative" onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />

          {/* Top Panel */}
          <Panel position="top-left">
            <Card>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-0">
                    <h3 className="text-lg font-bold">{workflowName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {nodes.length} nodes, {edges.length} connections
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsNodePanelOpen(!isNodePanelOpen)}
                      variant={isNodePanelOpen ? 'secondary' : 'default'}
                    >
                      <FiPlus className="mr-2" />
                      {isNodePanelOpen ? 'Hide Nodes' : 'Add Nodes'}
                    </Button>

                    <Button size="sm" onClick={handleImportN8n} variant="outline">
                      <FiUpload className="mr-2" />
                      Import N8N
                    </Button>

                    <Button size="sm" onClick={handleExportN8n} variant="outline">
                      <FiDownload className="mr-2" />
                      Export N8N
                    </Button>

                    <Button
                      size="sm"
                      onClick={executeWorkflow}
                      variant="default"
                      disabled={isExecuting}
                    >
                      <FiPlay className="mr-2" />
                      {isExecuting ? 'Executing' : 'Execute'}
                    </Button>

                    <Button size="sm" onClick={() => setIsSaveModalOpen(true)} variant="default">
                      <FiSave className="mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Panel>
        </ReactFlow>
      </div>

      {/* Node Library Sidebar */}
      {isNodePanelOpen && (
        <div className="w-80 bg-background border-l border-border p-4 overflow-y-auto h-full shadow-none z-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Nodes Library</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsNodePanelOpen(false)}>
              &times;
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop nodes onto the canvas
            </p>

            {['Triggers', 'AI', 'Data', 'Communication', 'Logic', 'Human'].map((category) => {
              const categoryNodes = availableNodes.filter((node) => node.category === category);
              if (categoryNodes.length === 0) return null;

              return (
                <div key={category} className="flex flex-col gap-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                    {category}
                  </h4>

                  {categoryNodes.map((node) => (
                    <div
                      key={node.id}
                      className="cursor-grab active:cursor-grabbing hover:border-primary border rounded-md p-3 bg-card hover:shadow-md transition-all"
                      draggable
                      onDragStart={(event) => onDragStart(event, node)}
                      onClick={() => addNode(node)}
                    >
                      <div className="flex gap-3 items-center pointer-events-none">
                        <div className="text-primary text-xl">{node.icon}</div>
                        <div className="flex flex-col">
                          <p className="text-sm font-bold">{node.label}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {node.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enhanced Node Settings Modal with N8N properties */}
      {isSettingsOpen && selectedNode && (
        <div className="fixed inset-0 z-modal overflow-y-auto z-50">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSettingsOpen(false)}
          />

          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-md bg-slate-900/95 border border-white/10 backdrop-blur-xl text-left shadow-none transition-all max-h-[90vh] overflow-y-auto">
              <div className="border-b border-neutral-200 dark:border-neutral-700 px-3 py-2 sticky top-0 bg-slate-900/95 z-10">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  Node Settings - {selectedNode.data.label}
                </h3>
              </div>

              <div className="px-3 py-2">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <FormLabel>Node Name</FormLabel>
                    <Input
                      value={selectedNode.data.label}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSelectedNode({
                          ...selectedNode,
                          data: { ...selectedNode.data, label: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FormLabel>Notes</FormLabel>
                    <Textarea
                      value={selectedNode.data.notes || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setSelectedNode({
                          ...selectedNode,
                          data: { ...selectedNode.data, notes: e.target.value },
                        })
                      }
                      placeholder="Add notes about this node"
                      rows={3}
                    />
                  </div>

                  <div className="border-t border-neutral-700 pt-4 mt-2">
                    <h4 className="font-bold mb-3">Execution Settings</h4>

                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="disabled"
                        checked={selectedNode.data.disabled || false}
                        onChange={(e) =>
                          setSelectedNode({
                            ...selectedNode,
                            data: { ...selectedNode.data, disabled: e.target.checked },
                          })
                        }
                        className="rounded"
                      />
                      <label htmlFor="disabled" className="text-sm">
                        Disable this node
                      </label>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="continueOnFail"
                        checked={selectedNode.data.continueOnFail || false}
                        onChange={(e) =>
                          setSelectedNode({
                            ...selectedNode,
                            data: { ...selectedNode.data, continueOnFail: e.target.checked },
                          })
                        }
                        className="rounded"
                      />
                      <label htmlFor="continueOnFail" className="text-sm">
                        Continue on failure
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-neutral-700 pt-4 mt-2">
                    <h4 className="font-bold mb-3">Retry Settings</h4>

                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="retryOnFail"
                        checked={selectedNode.data.retryOnFail || false}
                        onChange={(e) =>
                          setSelectedNode({
                            ...selectedNode,
                            data: { ...selectedNode.data, retryOnFail: e.target.checked },
                          })
                        }
                        className="rounded"
                      />
                      <label htmlFor="retryOnFail" className="text-sm">
                        Retry on failure
                      </label>
                    </div>

                    {selectedNode.data.retryOnFail && (
                      <>
                        <div className="flex flex-col gap-2 mb-3">
                          <FormLabel>Max Tries</FormLabel>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={selectedNode.data.maxTries || 3}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setSelectedNode({
                                ...selectedNode,
                                data: {
                                  ...selectedNode.data,
                                  maxTries: parseInt(e.target.value),
                                },
                              })
                            }
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <FormLabel>Wait Between Tries (ms)</FormLabel>
                          <Input
                            type="number"
                            min="0"
                            step="100"
                            value={selectedNode.data.waitBetweenTries || 1000}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setSelectedNode({
                                ...selectedNode,
                                data: {
                                  ...selectedNode.data,
                                  waitBetweenTries: parseInt(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="border-t border-neutral-700 pt-4 mt-2">
                    <h4 className="font-bold mb-3">Error Handling</h4>

                    <div className="flex flex-col gap-2">
                      <FormLabel>On Error</FormLabel>
                      <select
                        className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2"
                        value={selectedNode.data.onError || 'stopWorkflow'}
                        onChange={(e) =>
                          setSelectedNode({
                            ...selectedNode,
                            data: { ...selectedNode.data, onError: e.target.value as any },
                          })
                        }
                      >
                        <option value="stopWorkflow">Stop Workflow</option>
                        <option value="continueRegularOutput">Continue (Regular Output)</option>
                        <option value="continueErrorOutput">Continue (Error Output)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <Button onClick={() => setIsSettingsOpen(false)} variant="outline">
                      Cancel
                    </Button>
                    <Button variant="default" onClick={updateNodeSettings}>
                      Update Node
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Workflow Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-modal overflow-y-auto z-50">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSaveModalOpen(false)}
          />

          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative w-full max-w-md transform overflow-hidden rounded-md bg-slate-900/95 border border-white/10 backdrop-blur-xl text-left shadow-none transition-all">
              <div className="border-b border-neutral-200 dark:border-neutral-700 px-3 py-2">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  Save Workflow
                </h3>
              </div>

              <div className="px-3 py-2">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <FormLabel>Workflow Name</FormLabel>
                    <Input
                      value={workflowName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setWorkflowName(e.target.value)
                      }
                      placeholder="Enter workflow name"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      value={workflowDescription}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setWorkflowDescription(e.target.value)
                      }
                      placeholder="Describe what this workflow does"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button onClick={() => setIsSaveModalOpen(false)} variant="outline">
                      Cancel
                    </Button>
                    <Button variant="default" onClick={saveWorkflow}>
                      Save Workflow
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WorkflowBuilderEnhanced: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
};

export default WorkflowBuilderEnhanced;
