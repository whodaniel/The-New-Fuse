// @ts-nocheck
import { Box, Button, Flex, Heading, Input, Spinner, Text, useToast } from '@chakra-ui/react';
import { RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node Components
const ConceptNode = ({ data }) => (
  <Box bg="white" border="2px solid" borderColor="blue.500" p={2} borderRadius="md" minW="150px">
    <Text
      fontWeight="bold"
      fontSize="sm"
      borderBottom="1px solid"
      borderColor="gray.200"
      pb={1}
      mb={1}
    >
      {data.label}
    </Text>
    <Text fontSize="xs" color="gray.600">
      {data.description || 'System Concept'}
    </Text>
  </Box>
);

const RelationNode = ({ data }) => (
  <Box bg="white" border="2px solid" borderColor="green.500" px={4} py={2} borderRadius="full">
    <Text fontWeight="bold" fontSize="sm" textAlign="center">
      {data.label}
    </Text>
    <Text fontSize="xs" textAlign="center" color="gray.500">
      {data.relationType}
    </Text>
  </Box>
);

const EntityNode = ({ data }) => (
  <Box bg="white" border="2px solid" borderColor="purple.500" p={2} borderRadius="md" minW="150px">
    <Text
      fontWeight="bold"
      fontSize="sm"
      borderBottom="1px solid"
      borderColor="gray.200"
      pb={1}
      mb={1}
    >
      {data.label}
    </Text>
    <Box fontSize="xs">
      {Object.entries(data.properties || {}).map(([key, value]) => (
        <Text key={key} isTruncated>
          <Text as="span" fontWeight="semibold">
            {key}:
          </Text>{' '}
          {String(value)}
        </Text>
      ))}
    </Box>
  </Box>
);

const nodeTypes = {
  concept: ConceptNode,
  relation: RelationNode,
  entity: EntityNode,
};

export const SystemKnowledgeMap = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [autoLayout, setAutoLayout] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  const fetchKnowledgeData = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from /api/knowledge/graph
      // For now, we'll provide a high-fidelity system-wide mock based on TNF structure
      const mockData = {
        nodes: [
          {
            id: 'tnf-core',
            type: 'concept',
            label: 'TNF Core',
            description: 'Central Orchestration Engine',
          },
          {
            id: 'almanac',
            type: 'entity',
            label: 'Almanac v1.7.0',
            properties: { status: 'Anchored', version: '1.7.0' },
          },
          {
            id: 'openclaw',
            type: 'concept',
            label: 'OpenClaw OS',
            description: 'Agentic Operating System',
          },
          {
            id: 'relay',
            type: 'entity',
            label: 'Relay Server',
            properties: { transport: 'WebSocket/Redis' },
          },
          {
            id: 'individual',
            type: 'concept',
            label: 'Sovereign Individual',
            description: 'Highest unit of consideration',
          },
          {
            id: 'attribution',
            type: 'concept',
            label: 'Strict Attribution',
            description: 'Discipline of truth',
          },
        ],
        edges: [
          { id: 'e1', source: 'tnf-core', target: 'almanac', label: 'governed by' },
          { id: 'e2', source: 'tnf-core', target: 'openclaw', label: 'integrates with' },
          { id: 'e3', source: 'openclaw', target: 'relay', label: 'routes via' },
          { id: 'e4', source: 'almanac', target: 'individual', label: 'anchors' },
          { id: 'e5', source: 'almanac', target: 'attribution', label: 'enforces' },
        ],
      };

      const formattedNodes = mockData.nodes.map((node, index) => ({
        ...node,
        position: { x: index * 200, y: 100 + (index % 2) * 150 },
        data: { ...node },
      }));

      const formattedEdges = mockData.edges.map((edge) => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#718096' },
      }));

      setNodes(formattedNodes);
      setEdges(formattedEdges);
    } catch (error) {
      console.error('Failed to load system knowledge:', error);
      toast({ title: 'Error', description: 'Failed to fetch knowledge graph.', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeData();
  }, []);

  if (loading) {
    return (
      <Flex h="600px" align="center" justify="center" direction="column">
        <Spinner size="xl" color="purple.500" mb={4} />
        <Text>Mapping System Ontology...</Text>
      </Flex>
    );
  }

  return (
    <Box
      bg="white"
      p={4}
      borderRadius="xl"
      boxShadow="md"
      border="1px solid"
      borderColor="gray.200"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Heading size="md" color="gray.700">
            System Knowledge Map
          </Heading>
          <Text fontSize="xs" color="gray.500">
            Ontological relationships within the TNF mesh
          </Text>
        </Box>
        <Flex gap={2} align="center">
          <Input
            size="sm"
            placeholder="Search concepts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            w="200px"
          />
          <Button size="sm" leftIcon={<RotateCcw size={14} />} onClick={fetchKnowledgeData}>
            Reset
          </Button>
        </Flex>
      </Flex>

      <Box
        h="600px"
        bg="gray.50"
        borderRadius="lg"
        overflow="hidden"
        border="1px solid"
        borderColor="gray.100"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.LOOSE}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </Box>
    </Box>
  );
};

export default SystemKnowledgeMap;
