import React, { DragEvent, useCallback, useEffect, useState } from 'react';
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
// ReactFlow styles will be imported via the build system
import { WorkflowApiService } from '@/api/workflow';
import { Badge, Button, Card, CardContent } from '@/components/ui';
import { GlassCard } from '@/components/ui/design-system';
import { FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import {
  FiCalendar,
  FiCloud,
  FiCode,
  FiDatabase,
  FiGitBranch,
  FiMail,
  FiMessageSquare,
  FiPlay,
  FiPlus,
  FiSave,
  FiUser,
} from 'react-icons/fi';

// Custom Node Types
const nodeTypes = {
  trigger: ({ data }: any) => (
    <GlassCard className="bg-green-500/10 border-green-500/20 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          <div className="text-green-400 animate-pulse">{data.icon}</div>
          <p className="text-sm font-bold text-white">{data.label}</p>
        </div>
      </CardContent>
    </GlassCard>
  ),
  action: ({ data }: any) => (
    <GlassCard className="bg-blue-500/10 border-blue-500/20 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          <div className="text-blue-400">{data.icon}</div>
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
  condition: ({ data }: any) => (
    <GlassCard className="bg-orange-500/10 border-orange-500/20 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          <div className="text-orange-400">{data.icon}</div>
          <p className="text-sm font-bold text-white">{data.label}</p>
        </div>
      </CardContent>
    </GlassCard>
  ),
  ai: ({ data }: any) => (
    <GlassCard className="bg-purple-500/10 border-purple-500/20 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          <div className="text-purple-400">{data.icon}</div>
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
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isNodePanelOpen, setIsNodePanelOpen] = useState(true); // Open by default for drag and drop
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Load existing workflow if editing
    loadWorkflow();
  }, []);

  const loadWorkflow = async () => {
    // Load existing workflow if editing
    const urlParams = new URLSearchParams(window.location.search);
    const queryWorkflowId = urlParams.get('id');

    if (queryWorkflowId) {
      setWorkflowId(queryWorkflowId);
      try {
        // Use actual API service to load workflow
        const workflowService = new WorkflowApiService();
        const response = await workflowService.getWorkflow(queryWorkflowId);

        if (response.success && response.data) {
          const workflow = response.data;

          // Map the workflow data to our node/edge format
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

      // check if the dropped element is valid
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

  // Explicit add node function for clicking instead of dragging (fallback)
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
      // Use actual API service for workflow execution
      const workflowService = new WorkflowApiService();
      const response = await workflowService.executeWorkflow(workflowId, {
        nodes: nodes,
        edges: edges,
      });

      if (response.success && response.data) {
        // Update all nodes to completed status
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
      };

      // Use actual API service for workflow save
      const workflowService = new WorkflowApiService();
      const response = await workflowService.saveWorkflow(workflowData);

      if (response.success && response.data) {
        if (response.data.id) {
          setWorkflowId(response.data.id);
        }
        toast({
          title: 'Workflow Saved',
          description: `"${workflowName}" has been saved successfully${response.data.id ? ` (ID: ${response.data.id})` : ''}`,
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

  const publishWorkflow = async () => {
    if (!workflowId) {
      toast({
        title: 'Save Required',
        description: 'Save this workflow before publishing.',
        variant: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsPublishing(true);
    try {
      const workflowService = new WorkflowApiService();
      const response = await workflowService.publishWorkflow(workflowId);

      if (!response.success) {
        throw new Error(response.error || response.message || 'Failed to publish workflow');
      }

      toast({
        title: 'Workflow Published',
        description: `"${workflowName}" is now active.`,
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Publish Error',
        description: error instanceof Error ? error.message : 'Failed to publish workflow',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsSettingsOpen(true);
  };

  return (
    <div className="h-screen w-full relative flex">
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

          {/* Top Panel - Absolute positioned over canvas */}
          <Panel position="top-left">
            <Card>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-0">
                    <h3 className="text-lg font-bold">{workflowName}</h3>
                    <p className="text-sm text-gray-600">
                      {nodes.length} nodes, {edges.length} connections
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsNodePanelOpen(!isNodePanelOpen)}
                      variant={isNodePanelOpen ? 'secondary' : 'primary'}
                    >
                      <FiPlus className="mr-2" />
                      {isNodePanelOpen ? 'Hide Nodes' : 'Add Nodes'}
                    </Button>

                    <Button
                      size="sm"
                      onClick={executeWorkflow}
                      variant="success"
                      disabled={isExecuting}
                    >
                      <FiPlay className="mr-2" />
                      {isExecuting ? 'Executing' : 'Execute'}
                    </Button>

                    <Button size="sm" onClick={() => setIsSaveModalOpen(true)} variant="primary">
                      <FiSave className="mr-2" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      onClick={publishWorkflow}
                      variant="outline"
                      disabled={isPublishing}
                    >
                      <FiCloud className="mr-2" />
                      {isPublishing ? 'Publishing' : 'Publish'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Panel>
        </ReactFlow>
      </div>

      {/* Node Library Sidebar - Toggles inside the layout */}
      {isNodePanelOpen && (
        <div className="w-80 bg-background border-l border-border p-4 overflow-y-auto h-full shadow-xl z-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Nodes Library</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsNodePanelOpen(false)}>
              &times;
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600 mb-2">Drag and drop nodes onto the canvas</p>

            {/* Group nodes by category */}
            {['Triggers', 'AI', 'Data', 'Communication', 'Logic', 'Human'].map((category) => {
              const categoryNodes = availableNodes.filter((node) => node.category === category);
              if (categoryNodes.length === 0) return null;

              return (
                <div key={category} className="flex flex-col gap-2">
                  <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">
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
                        {/* pointer-events-none on children ensures drag starts on wrapper */}
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

      {/* Node Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-modal overflow-y-auto z-50">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSettingsOpen(false)}
          />

          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-slate-900/95 border border-white/10 backdrop-blur-xl text-left shadow-2xl transition-all">
              <div className="border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  Node Settings
                </h3>
              </div>

              <div className="px-6 py-4">
                {selectedNode && (
                  <div className="flex flex-col gap-4">
                    <h4 className="text-lg font-bold">{selectedNode.data.label}</h4>
                    <p className="text-gray-600">{selectedNode.data.description}</p>

                    <div className="flex flex-col gap-2">
                      <FormLabel>Node Name</FormLabel>
                      <Input defaultValue={selectedNode.data.label} />
                    </div>

                    <div className="flex flex-col gap-2">
                      <FormLabel>Configuration</FormLabel>
                      <Textarea
                        placeholder="Enter node configuration (JSON)"
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>

                    <Button variant="primary">Update Node</Button>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-700 px-6 py-4">
                <button onClick={() => setIsSettingsOpen(false)} className="btn btn-outline btn-sm">
                  Close
                </button>
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
            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-900/95 border border-white/10 backdrop-blur-xl text-left shadow-2xl transition-all">
              <div className="border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  Save Workflow
                </h3>
              </div>

              <div className="px-6 py-4">
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
                    <Button variant="primary" onClick={saveWorkflow}>
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

const WorkflowBuilder: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
};

export default WorkflowBuilder;
