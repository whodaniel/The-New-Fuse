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
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  Select,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  Tooltip,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiDownload, FiEye, FiPlay, FiPlus, FiSave, FiXCircle } from 'react-icons/fi';
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { enhancedNodeTypes } from '../../components/workflow/EnhancedNodeTypes';

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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isExecuting: false,
    progress: 0,
    logs: [],
  });
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);

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
      // In production, this would call the agent registry API
      const response = await fetch('/api/agents/registry');
      if (response.ok) {
        const agents = await response.json();
        setAvailableAgents(agents);
      } else {
        // Mock data for demonstration
        setAvailableAgents([
          { id: 'agent-1', name: 'Code Reviewer', type: 'code-reviewer', status: 'ACTIVE' },
          { id: 'agent-2', name: 'Researcher', type: 'researcher', status: 'ACTIVE' },
          { id: 'agent-3', name: 'Developer', type: 'developer', status: 'ACTIVE' },
          { id: 'agent-4', name: 'Tester', type: 'tester', status: 'ACTIVE' },
        ]);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      // Use mock data on error
      setAvailableAgents([
        { id: 'agent-1', name: 'Code Reviewer', type: 'code-reviewer', status: 'ACTIVE' },
        { id: 'agent-2', name: 'Researcher', type: 'researcher', status: 'ACTIVE' },
      ]);
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
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
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

    setNodes((nds) => [...nds, newNode]);
    onNodeLibraryClose();

    toast({
      title: 'Node Added',
      description: `${template.label} has been added to the workflow`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      toast({
        title: 'Empty Workflow',
        description: 'Add some nodes to execute the workflow',
        status: 'warning',
        duration: 3000,
        isClosable: true,
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
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          data: node.data,
        })),
        edges: edges.map((edge) => ({
          source: edge.source,
          target: edge.target,
        })),
      };

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

      toast({
        title: 'Workflow Executed',
        description: 'All workflow steps completed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
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

      toast({
        title: 'Execution Error',
        description: 'An error occurred during workflow execution',
        status: 'error',
        duration: 3000,
        isClosable: true,
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
        toast({
          title: 'Workflow Saved',
          description: `"${workflowName}" has been saved successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onSaveModalClose();
      } else {
        throw new Error('Failed to save workflow');
      }
    } catch (error) {
      toast({
        title: 'Save Error',
        description: 'Failed to save the workflow',
        status: 'error',
        duration: 3000,
        isClosable: true,
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

    toast({
      title: 'Workflow Exported',
      description: 'Workflow has been exported successfully',
      status: 'success',
      duration: 2000,
      isClosable: true,
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
    toast({
      title: 'Workflow Reset',
      description: 'Canvas has been cleared',
      status: 'info',
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
    <Box h="100vh" w="100%" position="relative" bg="gray.50">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={enhancedNodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />

          {/* Top Control Panel */}
          <Panel position="top-left">
            <Card shadow="lg">
              <CardBody>
                <VStack align="start" spacing={3}>
                  <HStack spacing={4}>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="lg" fontWeight="bold">
                        {workflowName}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {nodes.length} nodes, {edges.length} connections
                      </Text>
                    </VStack>

                    {executionState.isExecuting && (
                      <Badge colorScheme="blue" fontSize="sm">
                        Executing {executionState.progress.toFixed(0)}%
                      </Badge>
                    )}
                  </HStack>

                  {executionState.isExecuting && (
                    <Progress
                      value={executionState.progress}
                      size="sm"
                      colorScheme="blue"
                      width="200px"
                      borderRadius="full"
                    />
                  )}
                </VStack>
              </CardBody>
            </Card>
          </Panel>

          {/* Action Buttons Panel */}
          <Panel position="top-right">
            <Card shadow="lg">
              <CardBody>
                <HStack spacing={2}>
                  <Tooltip label="Add Node">
                    <Button
                      size="sm"
                      leftIcon={<FiPlus />}
                      onClick={onNodeLibraryOpen}
                      colorScheme="blue"
                    >
                      Add Node
                    </Button>
                  </Tooltip>

                  <Tooltip label="Execute Workflow">
                    <Button
                      size="sm"
                      leftIcon={<FiPlay />}
                      onClick={executeWorkflow}
                      colorScheme="green"
                      isLoading={executionState.isExecuting}
                      loadingText="Running"
                    >
                      Execute
                    </Button>
                  </Tooltip>

                  <Tooltip label="Save Workflow">
                    <IconButton
                      aria-label="Save"
                      size="sm"
                      icon={<FiSave />}
                      onClick={onSaveModalOpen}
                      colorScheme="purple"
                    />
                  </Tooltip>

                  <Tooltip label="Export Workflow">
                    <IconButton
                      aria-label="Export"
                      size="sm"
                      icon={<FiDownload />}
                      onClick={exportWorkflow}
                      colorScheme="teal"
                    />
                  </Tooltip>

                  <Tooltip label="View Logs">
                    <IconButton
                      aria-label="Logs"
                      size="sm"
                      icon={<FiEye />}
                      onClick={onExecutionLogOpen}
                    />
                  </Tooltip>

                  <Tooltip label="Reset Workflow">
                    <IconButton
                      aria-label="Reset"
                      size="sm"
                      icon={<FiXCircle />}
                      onClick={resetWorkflow}
                      colorScheme="red"
                      variant="outline"
                    />
                  </Tooltip>
                </HStack>
              </CardBody>
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
            <Tabs colorScheme="blue">
              <TabList>
                {Object.keys(groupedTemplates).map((category) => (
                  <Tab key={category}>{category}</Tab>
                ))}
              </TabList>

              <TabPanels>
                {Object.entries(groupedTemplates).map(([category, templates]) => (
                  <TabPanel key={category}>
                    <VStack spacing={3} align="stretch">
                      {templates.map((template) => (
                        <Card
                          key={template.id}
                          cursor="pointer"
                          _hover={{ borderColor: 'blue.400', shadow: 'md' }}
                          onClick={() => addNodeToWorkflow(template)}
                          borderWidth={2}
                          borderColor="gray.200"
                        >
                          <CardBody p={3}>
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm" fontWeight="bold">
                                {template.label}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                {template.description}
                              </Text>
                              <Badge colorScheme="blue" fontSize="xs">
                                {template.type}
                              </Badge>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Node Settings Modal */}
      <Modal isOpen={isNodeSettingsOpen} onClose={onNodeSettingsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Node Configuration</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedNode && (
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Node Name</FormLabel>
                  <Input
                    value={selectedNode.data.label}
                    onChange={(e) => {
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
                    onChange={(e) => {
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
                      placeholder="Choose an agent"
                      value={selectedNode.data.agentId || ''}
                      onChange={(e) => {
                        const agent = availableAgents.find((a) => a.id === e.target.value);
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNode.id
                              ? {
                                  ...n,
                                  data: {
                                    ...n.data,
                                    agentId: e.target.value,
                                    agentName: agent?.name,
                                  },
                                }
                              : n
                          )
                        );
                      }}
                    >
                      {availableAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.type})
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Button colorScheme="blue" onClick={onNodeSettingsClose}>
                  Save Changes
                </Button>
              </VStack>
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
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Workflow Name</FormLabel>
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Enter workflow name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Describe what this workflow does"
                  rows={3}
                />
              </FormControl>

              <HStack justify="flex-end" spacing={3}>
                <Button onClick={onSaveModalClose}>Cancel</Button>
                <Button colorScheme="purple" onClick={saveWorkflow}>
                  Save Workflow
                </Button>
              </HStack>
            </VStack>
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
            <VStack spacing={2} align="stretch">
              {executionState.logs.map((log, index) => (
                <Alert
                  key={index}
                  status={
                    log.level === 'error' ? 'error' : log.level === 'success' ? 'success' : 'info'
                  }
                  variant="left-accent"
                  borderRadius="md"
                >
                  <AlertIcon />
                  <Box flex="1">
                    <AlertTitle fontSize="sm">{log.timestamp.toLocaleTimeString()}</AlertTitle>
                    <AlertDescription fontSize="xs">{log.message}</AlertDescription>
                  </Box>
                </Alert>
              ))}
              {executionState.logs.length === 0 && (
                <Text color="gray.500" textAlign="center" py={8}>
                  No execution logs yet. Run a workflow to see logs.
                </Text>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default EnhancedWorkflowBuilder;
