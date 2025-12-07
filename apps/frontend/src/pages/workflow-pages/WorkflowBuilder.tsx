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
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
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
    <Card bg="green.50" borderColor="green.200" borderWidth={2}>
      <CardBody p={3}>
        <VStack spacing={2}>
          <Box color="green.600">{data.icon}</Box>
          <Text fontSize="sm" fontWeight="bold">
            {data.label}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  ),
  action: ({ data }: any) => (
    <Card bg="blue.50" borderColor="blue.200" borderWidth={2}>
      <CardBody p={3}>
        <VStack spacing={2}>
          <Box color="blue.600">{data.icon}</Box>
          <Text fontSize="sm" fontWeight="bold">
            {data.label}
          </Text>
          {data.status && (
            <Badge size="sm" colorScheme={data.status === 'completed' ? 'green' : 'yellow'}>
              {data.status}
            </Badge>
          )}
        </VStack>
      </CardBody>
    </Card>
  ),
  condition: ({ data }: any) => (
    <Card bg="orange.50" borderColor="orange.200" borderWidth={2}>
      <CardBody p={3}>
        <VStack spacing={2}>
          <Box color="orange.600">{data.icon}</Box>
          <Text fontSize="sm" fontWeight="bold">
            {data.label}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  ),
  ai: ({ data }: any) => (
    <Card bg="purple.50" borderColor="purple.200" borderWidth={2}>
      <CardBody p={3}>
        <VStack spacing={2}>
          <Box color="purple.600">{data.icon}</Box>
          <Text fontSize="sm" fontWeight="bold">
            {data.label}
          </Text>
          {data.model && (
            <Badge size="sm" colorScheme="purple">
              {data.model}
            </Badge>
          )}
        </VStack>
      </CardBody>
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
  const [executionResults, setExecutionResults] = useState<any[]>([]);

  const {
    isOpen: isNodePanelOpen,
    onOpen: onNodePanelOpen,
    onClose: onNodePanelClose,
  } = useDisclosure();
  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onClose: onSettingsClose,
  } = useDisclosure();
  const {
    isOpen: isSaveModalOpen,
    onOpen: onSaveModalOpen,
    onClose: onSaveModalClose,
  } = useDisclosure();

  const toast = useToast();

  useEffect(() => {
    // Load existing workflow if editing
    loadWorkflow();
  }, []);

  const loadWorkflow = async () => {
    // Simulate loading existing workflow
    const urlParams = new URLSearchParams(window.location.search);
    const workflowId = urlParams.get('id');

    if (workflowId) {
      // Load workflow from API
      console.log('Loading workflow:', workflowId);
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
    onNodePanelClose();

    toast({
      title: 'Node Added',
      description: `${nodeTemplate.label} has been added to the workflow`,
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

    setIsExecuting(true);
    try {
      // Simulate workflow execution
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Update node status
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id ? { ...n, data: { ...n.data, status: 'executing' } } : n
          )
        );

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mark as completed
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id ? { ...n, data: { ...n.data, status: 'completed' } } : n
          )
        );
      }

      toast({
        title: 'Workflow Executed',
        description: 'All workflow steps completed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Execution Error',
        description: 'An error occurred during workflow execution',
        status: 'error',
        duration: 3000,
        isClosable: true,
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
        version: '1.0.0',
        lastModified: new Date().toISOString(),
      };

      // Simulate API save
      console.log('Saving workflow:', workflowData);

      toast({
        title: 'Workflow Saved',
        description: `"${workflowName}" has been saved successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSaveModalClose();
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

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    onSettingsOpen();
  };

  return (
    <Box h="100vh" w="100%" position="relative">
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
          <Background variant="dots" gap={12} size={1} />

          {/* Top Panel */}
          <Panel position="top-left">
            <Card>
              <CardBody>
                <HStack spacing={4}>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight="bold">
                      {workflowName}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {nodes.length} nodes, {edges.length} connections
                    </Text>
                  </VStack>

                  <HStack>
                    <Button
                      size="sm"
                      leftIcon={<FiPlus />}
                      onClick={onNodePanelOpen}
                      colorScheme="blue"
                    >
                      Add Node
                    </Button>

                    <Button
                      size="sm"
                      leftIcon={<FiPlay />}
                      onClick={executeWorkflow}
                      colorScheme="green"
                      isLoading={isExecuting}
                      loadingText="Executing"
                    >
                      Execute
                    </Button>

                    <Button
                      size="sm"
                      leftIcon={<FiSave />}
                      onClick={onSaveModalOpen}
                      colorScheme="purple"
                    >
                      Save
                    </Button>
                  </HStack>
                </HStack>
              </CardBody>
            </Card>
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>

      {/* Node Library Drawer */}
      <Drawer isOpen={isNodePanelOpen} placement="right" onClose={onNodePanelClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Workflow Nodes</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Drag and drop nodes onto the canvas to build your workflow
              </Text>

              {/* Group nodes by category */}
              {['Triggers', 'AI', 'Data', 'Communication', 'Logic', 'Human'].map((category) => {
                const categoryNodes = availableNodes.filter((node) => node.category === category);
                if (categoryNodes.length === 0) return null;

                return (
                  <VStack key={category} align="stretch" spacing={2}>
                    <Text
                      fontWeight="bold"
                      color="gray.700"
                      fontSize="sm"
                      textTransform="uppercase"
                    >
                      {category}
                    </Text>

                    {categoryNodes.map((node) => (
                      <Card
                        key={node.id}
                        cursor="pointer"
                        _hover={{ borderColor: 'blue.300' }}
                        onClick={() => addNode(node)}
                      >
                        <CardBody p={3}>
                          <HStack>
                            <Box color="blue.600">{node.icon}</Box>
                            <VStack align="start" spacing={0} flex={1}>
                              <Text fontSize="sm" fontWeight="bold">
                                {node.label}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                {node.description}
                              </Text>
                            </VStack>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                );
              })}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Node Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Node Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedNode && (
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="bold">
                  {selectedNode.data.label}
                </Text>
                <Text color="gray.600">{selectedNode.data.description}</Text>

                <FormControl>
                  <FormLabel>Node Name</FormLabel>
                  <Input defaultValue={selectedNode.data.label} />
                </FormControl>

                <FormControl>
                  <FormLabel>Configuration</FormLabel>
                  <Textarea
                    placeholder="Enter node configuration (JSON)"
                    rows={6}
                    fontFamily="mono"
                    fontSize="sm"
                  />
                </FormControl>

                <Button colorScheme="blue">Update Node</Button>
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
    </Box>
  );
};

export default WorkflowBuilder;
