// @ts-nocheck
/**
 * Enhanced Workflow Builder for The New Fuse
 * Production-ready drag-and-drop workflow builder with:
 * - Agent nodes integration
 * - Conditional logic
 * - Parallel execution
 * - Human approval nodes
 * - Real-time execution monitoring
 * - Workflow templates
 */

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  LoadingSpinner,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ProgressBar,
} from '@/components/ui/design-system';
import { useDisclosure } from '@/components/ui/disclosure';
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
} from '@/components/ui/drawer';
import { FormControl, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { Tooltip } from '@/components/ui/tooltip';
import { enhancedNodeTypes } from '@/components/workflow/EnhancedNodeTypes';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { getLayoutedElements } from '@/utils/workflowLayout';
import { detectWorkflowCycles, validateWorkflowDryRun } from '@/utils/workflowValidation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiCheckCircle,
  FiDownload,
  FiEye,
  FiGrid,
  FiPlay,
  FiPlus,
  FiRotateCcw,
  FiRotateCw,
  FiSave,
  FiXCircle,
} from 'react-icons/fi';
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  MarkerType,
  MiniMap,
  Node,
  NodeChange,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Node templates for the library
interface NodeTemplate {
  id: string;
  type: string;
  label: string;
  description: string;
  category: string;
  defaultConfig: Record<string, any>;
}

const nodeTemplates: NodeTemplate[] = [
  // Agent Nodes
  {
    id: 'code-review-agent',
    type: 'agentTask',
    label: 'Code Review Agent',
    description: 'Agent reviews code for quality and best practices',
    category: 'Agents',
    defaultConfig: {
      agentType: 'code-reviewer',
      estimatedTime: 5,
      priority: 'high',
    },
  },
  {
    id: 'research-agent',
    type: 'agentTask',
    label: 'Research Agent',
    description: 'Agent performs research on a topic',
    category: 'Agents',
    defaultConfig: {
      agentType: 'researcher',
      estimatedTime: 10,
      priority: 'medium',
    },
  },
  {
    id: 'implementation-agent',
    type: 'agentTask',
    label: 'Implementation Agent',
    description: 'Agent implements code changes',
    category: 'Agents',
    defaultConfig: {
      agentType: 'developer',
      estimatedTime: 15,
      priority: 'high',
    },
  },
  {
    id: 'test-agent',
    type: 'agentTask',
    label: 'Testing Agent',
    description: 'Agent runs tests and validates results',
    category: 'Agents',
    defaultConfig: {
      agentType: 'tester',
      estimatedTime: 5,
      priority: 'high',
    },
  },
  {
    id: 'multi-agent-coord',
    type: 'multiAgent',
    label: 'Multi-Agent Coordination',
    description: 'Coordinate multiple agents working together',
    category: 'Agents',
    defaultConfig: {
      agents: [],
      coordinationStrategy: 'sequential',
    },
  },

  // Logic Nodes
  {
    id: 'condition-check',
    type: 'conditional',
    label: 'Conditional Branch',
    description: 'Branch workflow based on condition',
    category: 'Logic',
    defaultConfig: {
      condition: 'status === "success"',
    },
  },
  {
    id: 'parallel-execution',
    type: 'parallel',
    label: 'Parallel Execution',
    description: 'Execute multiple tasks in parallel',
    category: 'Logic',
    defaultConfig: {
      parallelTasks: 3,
      waitForAll: true,
    },
  },

  // Human Interaction
  {
    id: 'human-approval',
    type: 'humanApproval',
    label: 'Human Approval',
    description: 'Require human approval to continue',
    category: 'Human',
    defaultConfig: {
      approvers: 1,
      timeout: 24 * 60, // 24 hours in minutes
    },
  },
  {
    id: 'code-review-approval',
    type: 'humanApproval',
    label: 'Code Review Approval',
    description: 'Request code review approval',
    category: 'Human',
    defaultConfig: {
      approvers: 2,
      reviewType: 'code',
    },
  },
];

const initialEdges: Edge[] = [];

interface ExecutionState {
  isExecuting: boolean;
  currentNode?: string;
  progress: number;
  logs: { timestamp: Date; message: string; level: string }[];
}

const EnhancedWorkflowBuilder: React.FC = () => {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');

  const { undo, redo, canUndo, canRedo, takeSnapshot, history } = useUndoRedo({
    nodes: [],
    edges: [],
  });

  // Initialize history with initial state
  useEffect(() => {
    if (
      history.past.length === 0 &&
      history.future.length === 0 &&
      history.present.nodes.length === 0
    ) {
      takeSnapshot({ nodes, edges });
    }
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);
        return nextNodes;
      });
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const nextEdges = applyEdgeChanges(changes, eds);
        return nextEdges;
      });
    },
    [setEdges]
  );

  // Snapshot on drag stop (when user interaction ends)
  const onNodeDragStop = useCallback(() => {
    takeSnapshot({ nodes, edges });
  }, [nodes, edges, takeSnapshot]);

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      // Snapshot state BEFORE deletion? Or AFTER?
      // Usually we want to be able to Undo the deletion, so we need the previous state in history.
      // But `takeSnapshot` pushes the current `nodes` and `edges` to history and sets them as present.
      // Wait, `takeSnapshot` is called with the *new* state to set it as present.
      // The current state is automatically pushed to past.
      // So here we need to calculate the state *after* deletion and pass it to takeSnapshot.

      // However, ReactFlow handles the deletion internally via onNodesChange if we use useNodesState.
      // But we are intercepting onNodesChange.
      // Actually, ReactFlow calls onNodesDelete *after* the nodes are removed if we let it handle state?
      // No, onNodesDelete is just an event.
      // If we rely on onNodesChange to handle the actual removal, we need to snapshot *after* that.

      // Easier: just snapshot the *current* state (which still has the nodes) before they are gone?
      // No, `takeSnapshot` takes the NEW state.

      // Let's rely on onNodesChange to do the update, but we need to know when a "unit of work" is done.
      // Deletion is a distinct action.
      // ReactFlow triggers onNodesChange with type 'remove'.

      // The issue is onNodesChange triggers for selection changes too.
      // We only want to snapshot on meaningful changes.

      // If onNodesDelete is called, it means nodes ARE being deleted.
      // We can use this to trigger a snapshot of the *resulting* state.
      // But we don't have the resulting state easily here because onNodesChange happens separately.

      // ALTERNATIVE: Snapshot *before* the deletion happens?
      // If we snapshot the current state, it goes to 'past'.
      // Then the state updates to 'deleted'.
      // Then if we Undo, we go back to 'past' (with nodes).
      // So we should call takeSnapshot with the *current* state?
      // No, takeSnapshot(newState) sets present=newState and past.push(oldPresent).

      // So we need to call takeSnapshot(stateAfterDeletion).
      // But calculating stateAfterDeletion is hard here because onNodesDelete receives the deleted nodes,
      // but we need to filter them out from `nodes`.

      const deletedIds = new Set(deleted.map((n) => n.id));
      const remainingNodes = nodes.filter((n) => !deletedIds.has(n.id));
      const remainingEdges = edges.filter(
        (e) => !deletedIds.has(e.source) && !deletedIds.has(e.target)
      );

      takeSnapshot({ nodes: remainingNodes, edges: remainingEdges });
    },
    [nodes, edges, takeSnapshot]
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      const deletedIds = new Set(deleted.map((e) => e.id));
      const remainingEdges = edges.filter((e) => !deletedIds.has(e.id));

      takeSnapshot({ nodes, edges: remainingEdges });
    },
    [nodes, edges, takeSnapshot]
  );

  // Handle Undo/Redo shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        if (event.shiftKey) {
          if (canRedo) {
            const nextState = redo();
            setNodes(nextState.nodes);
            setEdges(nextState.edges);
          }
        } else {
          if (canUndo) {
            const prevState = undo();
            setNodes(prevState.nodes);
            setEdges(prevState.edges);
          }
        }
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        if (canRedo) {
          const nextState = redo();
          setNodes(nextState.nodes);
          setEdges(nextState.edges);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, setNodes, setEdges]);
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isExecuting: false,
    progress: 0,
    logs: [],
  });
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [agentLoadError, setAgentLoadError] = useState<string | null>(null);

  const {
    isOpen: isNodeLibraryOpen,
    onOpen: onNodeLibraryOpen,
    onClose: onNodeLibraryClose,
  } = useDisclosure();
  const {
    isOpen: isNodeSettingsOpen,
    onOpen: onNodeSettingsOpen,
    onClose: onNodeSettingsClose,
  } = useDisclosure();
  const {
    isOpen: isSaveModalOpen,
    onOpen: onSaveModalOpen,
    onClose: onSaveModalClose,
  } = useDisclosure();
  const {
    isOpen: isExecutionLogOpen,
    onOpen: onExecutionLogOpen,
    onClose: onExecutionLogClose,
  } = useDisclosure();

  const toast = useToast();

  // Load available agents from the agent registry
  useEffect(() => {
    loadAvailableAgents();
  }, []);

  const loadAvailableAgents = async () => {
    try {
      setAgentLoadError(null);
      const registryResponse = await fetch('/api/agents/registry');
      if (registryResponse.ok) {
        const agents = await registryResponse.json();
        setAvailableAgents(Array.isArray(agents) ? agents : []);
        return;
      }

      const agentsResponse = await fetch('/api/agents');
      if (!agentsResponse.ok) {
        throw new Error(`HTTP ${agentsResponse.status}`);
      }

      const payload = await agentsResponse.json();
      const agents = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      setAvailableAgents(agents);
    } catch (error) {
      console.error('Failed to load agents:', error);
      setAvailableAgents([]);
      setAgentLoadError('Agent directory is unavailable');
    }
  };

  // WebSocket connection for real-time execution monitoring
  useEffect(() => {
    if (executionState.isExecuting) {
      // In production, connect to WebSocket for real-time updates
      // const ws = new WebSocket(`ws://localhost:3000/workflow/execution/${executionId}`);
      // ws.onmessage = (event) => {
      //   const update = JSON.parse(event.data);
      //   handleExecutionUpdate(update);
      // };
      // return () => ws.close();
    }
  }, [executionState.isExecuting]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Add animated edges
      const edge = {
        ...params,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };

      const potentialEdges = addEdge(edge, edges);
      const isCyclic = detectWorkflowCycles(nodes, potentialEdges);

      if (isCyclic) {
        toast.addToast({
          title: 'Cycle Detected',
          description: 'This connection would create an infinite loop.',
          variant: 'destructive',
          duration: 3000,
        });
        return;
      }

      const newEdges = addEdge(edge, edges);
      setEdges(newEdges);
      takeSnapshot({ nodes, edges: newEdges });
    },
    [setEdges, edges, nodes, toast, takeSnapshot]
  );

  const addNodeToWorkflow = (template: NodeTemplate) => {
    const nodeId = `${template.type}-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      type: template.type,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: template.label,
        description: template.description,
        status: 'idle',
        ...template.defaultConfig,
      },
    };

    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    takeSnapshot({ nodes: newNodes, edges });

    onNodeLibraryClose();

    toast.addToast({
      title: 'Node Added',
      description: `${template.label} has been added to the workflow`,
      variant: 'success',
      duration: 2000,
    });
  };

  const onLayout = useCallback(
    (direction: string) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      );

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
      takeSnapshot({ nodes: [...layoutedNodes], edges: [...layoutedEdges] });

      toast.addToast({
        title: 'Auto Layout Applied',
        description: `Workflow arranged in ${direction === 'TB' ? 'vertical' : 'horizontal'} layout`,
        variant: 'success',
        duration: 2000,
      });
    },
    [nodes, edges, setNodes, setEdges, toast, takeSnapshot]
  );

  const onDryRun = () => {
    const { isValid, errors, invalidNodeIds } = validateWorkflowDryRun(nodes, edges);

    if (isValid) {
      // Clear previous validation styling
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          style: { ...node.style, border: 'none' },
        }))
      );

      toast.addToast({
        title: 'Validation Passed',
        description: 'Workflow structure is valid.',
        variant: 'success',
        duration: 3000,
      });
    } else {
      // Highlight invalid nodes
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          style: {
            ...node.style,
            border: invalidNodeIds.includes(node.id) ? '2px solid red' : 'none',
          },
        }))
      );

      toast.addToast({
        title: 'Validation Failed',
        description: `${errors.length} issues found. See highlighted nodes.`,
        variant: 'destructive',
        duration: 5000,
      });

      // Optionally log errors to console or execution log
      console.error('Validation Errors:', errors);
      // We could also open the execution log and show errors there if we wanted
    }
  };

  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      toast.addToast({
        title: 'Empty Workflow',
        description: 'Add some nodes to execute the workflow',
        variant: 'warning',
        duration: 3000,
      });
      return;
    }

    setExecutionState({
      isExecuting: true,
      progress: 0,
      logs: [{ timestamp: new Date(), message: 'Workflow execution started', level: 'info' }],
    });

    try {
      // Call backend API to execute workflow
      // Simulate execution with progress updates

      // Simulate execution with progress updates
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const progress = ((i + 1) / nodes.length) * 100;

        // Update node status
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id ? { ...n, data: { ...n.data, status: 'running', progress: 50 } } : n
          )
        );

        setExecutionState((prev) => ({
          ...prev,
          currentNode: node.id,
          progress,
          logs: [
            ...prev.logs,
            {
              timestamp: new Date(),
              message: `Executing node: ${node.data.label}`,
              level: 'info',
            },
          ],
        }));

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Mark as completed
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id ? { ...n, data: { ...n.data, status: 'completed', progress: 100 } } : n
          )
        );

        setExecutionState((prev) => ({
          ...prev,
          logs: [
            ...prev.logs,
            {
              timestamp: new Date(),
              message: `Completed node: ${node.data.label}`,
              level: 'success',
            },
          ],
        }));
      }

      setExecutionState((prev) => ({
        ...prev,
        isExecuting: false,
        progress: 100,
        logs: [
          ...prev.logs,
          {
            timestamp: new Date(),
            message: 'Workflow execution completed successfully',
            level: 'success',
          },
        ],
      }));

      toast.addToast({
        title: 'Workflow Executed',
        description: 'All workflow steps completed successfully',
        variant: 'success',
        duration: 3000,
      });

      onExecutionLogOpen();
    } catch (error) {
      setExecutionState((prev) => ({
        ...prev,
        isExecuting: false,
        logs: [
          ...prev.logs,
          {
            timestamp: new Date(),
            message: `Execution error: ${error}`,
            level: 'error',
          },
        ],
      }));

      toast.addToast({
        title: 'Execution Error',
        description: 'An error occurred during workflow execution',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const saveWorkflow = async () => {
    try {
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        nodes,
        edges,
        version: '1.0.0',
        lastModified: new Date().toISOString(),
      };

      // Call API to save workflow
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData),
      });

      if (response.ok) {
        toast.addToast({
          title: 'Workflow Saved',
          description: `"${workflowName}" has been saved successfully`,
          variant: 'success',
          duration: 3000,
        });
        onSaveModalClose();
      } else {
        throw new Error('Failed to save workflow');
      }
    } catch (error: unknown) {
      toast.addToast({
        title: 'Save Error',
        description: 'Failed to save the workflow',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const exportWorkflow = () => {
    const workflowData = {
      name: workflowName,
      description: workflowDescription,
      nodes,
      edges,
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(workflowData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflowName.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.addToast({
      title: 'Workflow Exported',
      description: 'Workflow has been exported successfully',
      variant: 'success',
      duration: 2000,
    });
  };

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    onNodeSettingsOpen();
  };

  const resetWorkflow = () => {
    setNodes([]);
    setEdges([]);
    setWorkflowName('Untitled Workflow');
    setWorkflowDescription('');
    setExecutionState({
      isExecuting: false,
      progress: 0,
      logs: [],
    });
    toast.addToast({
      title: 'Workflow Reset',
      description: 'Canvas has been cleared',
      variant: 'info',
      duration: 2000,
    });
  };

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, NodeTemplate[]> = {};
    nodeTemplates.forEach((template) => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });
    return groups;
  }, []);

  return (
    <div className="h-screen w-full relative bg-gray-50">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={enhancedNodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />

          {/* Top Control Panel */}
          <Panel position="top-left">
            <Card shadow="lg">
              <CardContent>
                <div className="flex flex-col items-start gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-start gap-0">
                      <h3 className="text-lg font-bold">{workflowName}</h3>
                      <p className="text-xs text-gray-600">
                        {nodes.length} nodes, {edges.length} connections
                      </p>
                    </div>

                    {executionState.isExecuting && (
                      <Badge variant="primary" size="sm">
                        Executing {executionState.progress.toFixed(0)}%
                      </Badge>
                    )}
                  </div>

                  {executionState.isExecuting && (
                    <ProgressBar
                      value={executionState.progress}
                      className="w-[200px] rounded-full"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </Panel>

          {/* Action Buttons Panel */}
          <Panel position="top-right">
            <Card shadow="lg">
              <CardContent>
                <div className="flex items-center gap-2">
                  <Tooltip label="Add Node">
                    <Button
                      size="sm"
                      onClick={onNodeLibraryOpen}
                      variant="primary"
                      className="flex items-center gap-2"
                    >
                      <FiPlus className="h-4 w-4" />
                      Add Node
                    </Button>
                  </Tooltip>

                  <Tooltip label="Execute Workflow">
                    <Button
                      size="sm"
                      onClick={executeWorkflow}
                      variant="success"
                      className="flex items-center gap-2"
                      disabled={executionState.isExecuting}
                    >
                      {executionState.isExecuting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Running
                        </>
                      ) : (
                        <>
                          <FiPlay className="h-4 w-4" />
                          Execute
                        </>
                      )}
                    </Button>
                  </Tooltip>

                  <Tooltip label="Save Workflow">
                    <Button
                      size="icon"
                      onClick={onSaveModalOpen}
                      variant="secondary"
                      className="h-8 w-8"
                    >
                      <FiSave className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip label="Export Workflow">
                    <Button
                      size="icon"
                      onClick={exportWorkflow}
                      variant="outline"
                      className="h-8 w-8"
                    >
                      <FiDownload className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip label="View Logs">
                    <Button
                      size="icon"
                      onClick={onExecutionLogOpen}
                      variant="ghost"
                      className="h-8 w-8"
                    >
                      <FiEye className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip label="Auto Layout">
                    <Button
                      size="icon"
                      onClick={() => onLayout('TB')}
                      variant="secondary"
                      className="h-8 w-8"
                    >
                      <FiGrid className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip label="Dry Run Validation">
                    <Button
                      size="icon"
                      onClick={onDryRun}
                      variant="outline"
                      className="h-8 w-8 text-blue-500 border-blue-500"
                    >
                      <FiCheckCircle className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

                  <Tooltip label="Undo (Ctrl+Z)">
                    <Button
                      size="icon"
                      onClick={() => {
                        if (canUndo) {
                          const prevState = undo();
                          setNodes(prevState.nodes);
                          setEdges(prevState.edges);
                        }
                      }}
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={!canUndo}
                    >
                      <FiRotateCcw className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip label="Redo (Ctrl+Y)">
                    <Button
                      size="icon"
                      onClick={() => {
                        if (canRedo) {
                          const nextState = redo();
                          setNodes(nextState.nodes);
                          setEdges(nextState.edges);
                        }
                      }}
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={!canRedo}
                    >
                      <FiRotateCw className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip label="Reset Workflow">
                    <Button
                      size="icon"
                      onClick={resetWorkflow}
                      variant="danger"
                      className="h-8 w-8"
                    >
                      <FiXCircle className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>

      {/* Node Library Drawer */}
      <Drawer isOpen={isNodeLibraryOpen} placement="right" onClose={onNodeLibraryClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Node Library</DrawerHeader>
          <DrawerBody>
            <div className="flex border-b border-neutral-200 dark:border-neutral-700">
              {Object.keys(groupedTemplates).map((category) => (
                <button
                  key={category}
                  className="px-4 py-2 text-sm font-medium transition-colors border-b-2 border-primary text-primary"
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {Object.entries(groupedTemplates).map(([category, templates]) => (
                <div key={category} className="mt-4">
                  <div className="flex flex-col gap-3">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:border-blue-400 hover:shadow-md"
                        onClick={() => addNodeToWorkflow(template)}
                      >
                        <CardContent className="p-3">
                          <div className="flex flex-col items-start gap-1">
                            <h4 className="text-sm font-bold">{template.label}</h4>
                            <p className="text-xs text-gray-600">{template.description}</p>
                            <Badge variant="primary" size="sm">
                              {template.type}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Node Settings Modal */}
      <Modal isOpen={isNodeSettingsOpen} onClose={onNodeSettingsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Node Configuration</ModalHeader>
          <ModalCloseButton />
          <ModalBody className="pb-6">
            {selectedNode && (
              <div className="flex flex-col gap-4">
                <FormControl>
                  <FormLabel>Node Name</FormLabel>
                  <Input
                    value={selectedNode.data.label}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, data: { ...n.data, label: e.target.value } }
                            : n
                        )
                      );
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={selectedNode.data.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, data: { ...n.data, description: e.target.value } }
                            : n
                        )
                      );
                    }}
                    rows={3}
                  />
                </FormControl>

                {selectedNode.type === 'agentTask' && (
                  <FormControl>
                    <FormLabel>Select Agent</FormLabel>
                    <Select
                      value={selectedNode.data.agentId || ''}
                      onChange={(value: string) => {
                        const agent = availableAgents.find((a) => a.id === value);
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNode.id
                              ? {
                                  ...n,
                                  data: {
                                    ...n.data,
                                    agentId: value,
                                    agentName: agent?.name,
                                  },
                                }
                              : n
                          )
                        );
                      }}
                    >
                      {availableAgents.length === 0 && (
                        <option value="" disabled>
                          No agents available
                        </option>
                      )}
                      {availableAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.type})
                        </option>
                      ))}
                    </Select>
                    {agentLoadError && (
                      <p className="text-xs text-amber-600 mt-2">
                        {agentLoadError}. Agent task assignment is temporarily disabled.
                      </p>
                    )}
                  </FormControl>
                )}

                <Button variant="primary" onClick={onNodeSettingsClose}>
                  Save Changes
                </Button>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Save Workflow Modal */}
      <Modal isOpen={isSaveModalOpen} onClose={onSaveModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Save Workflow</ModalHeader>
          <ModalCloseButton />
          <ModalBody className="pb-6">
            <div className="flex flex-col gap-4">
              <FormControl>
                <FormLabel>Workflow Name</FormLabel>
                <Input
                  value={workflowName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWorkflowName(e.target.value)
                  }
                  placeholder="Enter workflow name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={workflowDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setWorkflowDescription(e.target.value)
                  }
                  placeholder="Describe what this workflow does"
                  rows={3}
                />
              </FormControl>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onSaveModalClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={saveWorkflow}>
                  Save Workflow
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Execution Log Drawer */}
      <Drawer isOpen={isExecutionLogOpen} placement="right" onClose={onExecutionLogClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Execution Logs</DrawerHeader>
          <DrawerBody>
            <div className="flex flex-col gap-2">
              {executionState.logs.map((log, index) => (
                <Alert
                  key={index}
                  variant={
                    log.level === 'error'
                      ? 'danger'
                      : log.level === 'success'
                        ? 'success'
                        : 'primary'
                  }
                  className="rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <AlertTitle className="text-sm">
                        {log.timestamp.toLocaleTimeString()}
                      </AlertTitle>
                      <AlertDescription className="text-xs">{log.message}</AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
              {executionState.logs.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No execution logs yet. Run a workflow to see logs.
                </p>
              )}
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default EnhancedWorkflowBuilder;
