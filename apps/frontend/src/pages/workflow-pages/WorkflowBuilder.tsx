import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from 'reactflow';
// ReactFlow styles will be imported via the build system
import {
  Badge,
  Button,
  Card,
  CardContent,
} from '../../components/ui';
import { Drawer } from '../../components/ui/drawer';
import { useToast } from '../../hooks/useToast';
import { FormLabel } from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
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
import { WorkflowApiService } from '../../api/workflow';

// Custom Node Types
const nodeTypes = {
  trigger: ({ data }: any) => (
    <Card className="bg-green-50 border-2 border-green-200">
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          <div className="text-green-600">{data.icon}</div>
          <p className="text-sm font-bold">
            {data.label}
          </p>
        </div>
      </CardContent>
    </Card>
  ),
  action: ({ data }: any) => (
    <Card className="bg-blue-50 border-2 border-blue-200">
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          <div className="text-blue-600">{data.icon}</div>
          <p className="text-sm font-bold">
            {data.label}
          </p>
          {data.status && (
            <Badge variant={data.status === 'completed' ? 'default' : 'secondary'}>
              {data.status}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  ),
  condition: ({ data }: any) => (
    <Card className="bg-orange-50 border-2 border-orange-200">
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          <div className="text-orange-600">{data.icon}</div>
          <p className="text-sm font-bold">
            {data.label}
          </p>
        </div>
      </CardContent>
    </Card>
  ),
  ai: ({ data }: any) => (
    <Card className="bg-purple-50 border-2 border-purple-200">
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          <div className="text-purple-600">{data.icon}</div>
          <p className="text-sm font-bold">
            {data.label}
          </p>
          {data.model && (
            <Badge variant="secondary">
              {data.model}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
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

const WorkflowBuilder: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isNodePanelOpen, setIsNodePanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // Load existing workflow if editing
    loadWorkflow();
  }, []);

  const loadWorkflow = async () => {
    // Load existing workflow if editing
    const urlParams = new URLSearchParams(window.location.search);
    const workflowId = urlParams.get('id');

    if (workflowId) {
      try {
        // Use actual API service to load workflow
        const workflowService = new WorkflowApiService();
        const response = await workflowService.getWorkflow(workflowId);

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
              ...node.data
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

  const addNode = (nodeTemplate: WorkflowNode) => {
    const newNode: Node = {
      id: `${nodeTemplate.id}-${Date.now()}`,
      type: nodeTemplate.type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
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

    setIsExecuting(true);
    try {
      // Use actual API service for workflow execution
      const workflowService = new WorkflowApiService();
      const response = await workflowService.executeWorkflow('current-workflow-id', {
        nodes: nodes,
        edges: edges
      });

      if (response.success && response.data) {
        // Update all nodes to completed status
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: { ...n.data, status: 'completed' }
          }))
        );

        toast({
          title: 'Workflow Executed',
          description: `Workflow execution started: ${response.data.id}`,
          variant: 'success',
          duration: 3000,
        });
      } else {
        throw new Error(response.error || 'Failed to execute workflow');
      }
    } catch (error) {
      toast({
        title: 'Execution Error',
        description: error instanceof Error ? error.message : 'An error occurred during workflow execution',
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
        name: workflowName,
        description: workflowDescription,
        nodes: nodes,
        edges: edges,
      };

      // Use actual API service for workflow save
      const workflowService = new WorkflowApiService();
      const response = await workflowService.saveWorkflow(workflowData);

      if (response.success && response.data) {
        toast({
          title: 'Workflow Saved',
          description: `"${workflowName}" has been saved successfully`,
          variant: 'success',
          duration: 3000,
        });
      } else {
        throw new Error(response.error || 'Failed to save workflow');
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

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsSettingsOpen(true);
  };

  return (
    <div className="h-screen w-full relative">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
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
                    <h3 className="text-lg font-bold">
                      {workflowName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {nodes.length} nodes, {edges.length} connections
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsNodePanelOpen(true)}
                      variant="primary"
                    >
                      <FiPlus className="mr-2" />
                      Add Node
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

                    <Button
                      size="sm"
                      onClick={() => setIsSaveModalOpen(true)}
                      variant="primary"
                    >
                      <FiSave className="mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>

      {/* Node Library Drawer */}
      <Drawer
        isOpen={isNodePanelOpen}
        onClose={() => setIsNodePanelOpen(false)}
        placement="right"
        size="md"
        title="Workflow Nodes"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Drag and drop nodes onto the canvas to build your workflow
          </p>

          {/* Group nodes by category */}
          {['Triggers', 'AI', 'Data', 'Communication', 'Logic', 'Human'].map((category) => {
            const categoryNodes = availableNodes.filter((node) => node.category === category);
            if (categoryNodes.length === 0) return null;

            return (
              <div key={category} className="flex flex-col gap-2">
                <h4
                  className="font-bold text-gray-700 text-sm uppercase"
                >
                  {category}
                </h4>

                {categoryNodes.map((node) => (
                  <Card
                    key={node.id}
                    className="cursor-pointer hover:border-blue-300"
                    onClick={() => addNode(node)}
                  >
                    <CardContent className="p-3">
                      <div className="flex gap-2">
                        <div className="text-blue-600">{node.icon}</div>
                        <div className="flex flex-col gap-0 flex-1">
                          <p className="text-sm font-bold">
                            {node.label}
                          </p>
                          <p className="text-xs text-gray-600">
                            {node.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      </Drawer>

      {/* Node Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-modal overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSettingsOpen(false)}
          />

          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-left shadow-xl transition-all">
              <div className="border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  Node Settings
                </h3>
              </div>

              <div className="px-6 py-4">
                {selectedNode && (
                  <div className="flex flex-col gap-4">
                    <h4 className="text-lg font-bold">
                      {selectedNode.data.label}
                    </h4>
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
        <div className="fixed inset-0 z-modal overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSaveModalOpen(false)}
          />

          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-left shadow-xl transition-all">
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkflowName(e.target.value)}
                      placeholder="Enter workflow name"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      value={workflowDescription}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setWorkflowDescription(e.target.value)}
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

export default WorkflowBuilder;
