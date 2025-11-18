/**
 * Enhanced Node Types for The New Fuse Workflow Builder
 * Includes: Agent Nodes, Conditional Logic, Parallel Execution, Human Approval
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Card,
  CardBody,
  Avatar,
  Progress,
  Tooltip
} from '@chakra-ui/react';
import {
  FiUser,
  FiCpu,
  FiGitBranch,
  FiGrid,
  FiCheckCircle,
  FiPlay,
  FiPause,
  FiAlertCircle,
  FiClock,
  FiUsers
} from 'react-icons/fi';

// Base Node Component
interface BaseNodeProps {
  data: {
    label: string;
    description?: string;
    status?: 'idle' | 'running' | 'completed' | 'error' | 'waiting';
    progress?: number;
    [key: string]: any;
  };
  selected?: boolean;
}

// Agent Task Node
export const AgentTaskNode: React.FC<BaseNodeProps> = ({ data, selected }) => {
  const getStatusColor = () => {
    switch (data.status) {
      case 'running':
        return 'blue';
      case 'completed':
        return 'green';
      case 'error':
        return 'red';
      case 'waiting':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'running':
        return FiPlay;
      case 'completed':
        return FiCheckCircle;
      case 'error':
        return FiAlertCircle;
      case 'waiting':
        return FiPause;
      default:
        return FiCpu;
    }
  };

  return (
    <Card
      bg="purple.50"
      borderColor={selected ? 'purple.500' : 'purple.200'}
      borderWidth={selected ? 3 : 2}
      boxShadow={selected ? 'lg' : 'md'}
      minW="200px"
      maxW="300px"
    >
      <Handle type="target" position={Position.Top} style={{ background: '#805AD5' }} />

      <CardBody p={3}>
        <VStack spacing={2} align="stretch">
          <HStack>
            <Avatar size="xs" bg="purple.500" icon={<Icon as={FiCpu} />} />
            <VStack align="start" spacing={0} flex={1}>
              <Text fontSize="sm" fontWeight="bold" color="purple.900">
                {data.label}
              </Text>
              {data.agentName && (
                <Text fontSize="xs" color="purple.600">
                  Agent: {data.agentName}
                </Text>
              )}
            </VStack>
            {data.status && (
              <Tooltip label={data.status}>
                <Icon as={getStatusIcon()} color={`${getStatusColor()}.500`} />
              </Tooltip>
            )}
          </HStack>

          {data.description && (
            <Text fontSize="xs" color="gray.600" noOfLines={2}>
              {data.description}
            </Text>
          )}

          {data.status === 'running' && data.progress !== undefined && (
            <Box>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" color="gray.600">Progress</Text>
                <Text fontSize="xs" color="gray.600">{data.progress}%</Text>
              </HStack>
              <Progress
                value={data.progress}
                size="xs"
                colorScheme={getStatusColor()}
                borderRadius="full"
              />
            </Box>
          )}

          {data.estimatedTime && (
            <HStack>
              <Icon as={FiClock} color="gray.500" boxSize={3} />
              <Text fontSize="xs" color="gray.600">
                ~{data.estimatedTime}min
              </Text>
            </HStack>
          )}
        </VStack>
      </CardBody>

      <Handle type="source" position={Position.Bottom} style={{ background: '#805AD5' }} />
    </Card>
  );
};

// Conditional Logic Node
export const ConditionalNode: React.FC<BaseNodeProps> = ({ data, selected }) => {
  return (
    <Card
      bg="orange.50"
      borderColor={selected ? 'orange.500' : 'orange.200'}
      borderWidth={selected ? 3 : 2}
      boxShadow={selected ? 'lg' : 'md'}
      minW="180px"
      style={{ position: 'relative' }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#DD6B20' }} />

      <CardBody p={3}>
        <VStack spacing={2}>
          <Icon as={FiGitBranch} color="orange.600" boxSize={5} />
          <Text fontSize="sm" fontWeight="bold" color="orange.900" textAlign="center">
            {data.label}
          </Text>
          {data.condition && (
            <Badge colorScheme="orange" fontSize="xs" textAlign="center">
              {data.condition}
            </Badge>
          )}
          {data.description && (
            <Text fontSize="xs" color="gray.600" textAlign="center" noOfLines={2}>
              {data.description}
            </Text>
          )}
        </VStack>
      </CardBody>

      {/* Multiple output handles for true/false branches */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ background: '#48BB78', top: '30%' }}
      />
      <Text
        fontSize="xs"
        position="absolute"
        right="-35px"
        top="25%"
        color="green.600"
        fontWeight="bold"
      >
        True
      </Text>

      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ background: '#F56565', top: '70%' }}
      />
      <Text
        fontSize="xs"
        position="absolute"
        right="-38px"
        top="65%"
        color="red.600"
        fontWeight="bold"
      >
        False
      </Text>
    </Card>
  );
};

// Parallel Execution Node
export const ParallelNode: React.FC<BaseNodeProps> = ({ data, selected }) => {
  return (
    <Card
      bg="cyan.50"
      borderColor={selected ? 'cyan.500' : 'cyan.200'}
      borderWidth={selected ? 3 : 2}
      boxShadow={selected ? 'lg' : 'md'}
      minW="200px"
    >
      <Handle type="target" position={Position.Top} style={{ background: '#0BC5EA' }} />

      <CardBody p={3}>
        <VStack spacing={2}>
          <Icon as={FiGrid} color="cyan.600" boxSize={5} />
          <Text fontSize="sm" fontWeight="bold" color="cyan.900" textAlign="center">
            {data.label}
          </Text>
          {data.parallelTasks && (
            <Badge colorScheme="cyan">
              {data.parallelTasks} parallel tasks
            </Badge>
          )}
          {data.description && (
            <Text fontSize="xs" color="gray.600" textAlign="center" noOfLines={2}>
              {data.description}
            </Text>
          )}
          {data.status === 'running' && (
            <HStack spacing={1}>
              <Box w="8px" h="8px" borderRadius="full" bg="cyan.500" />
              <Text fontSize="xs" color="cyan.600">Executing in parallel</Text>
            </HStack>
          )}
        </VStack>
      </CardBody>

      {/* Multiple output handles for parallel branches */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output-1"
        style={{ background: '#0BC5EA', left: '25%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output-2"
        style={{ background: '#0BC5EA', left: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output-3"
        style={{ background: '#0BC5EA', left: '75%' }}
      />
    </Card>
  );
};

// Human Approval Node
export const HumanApprovalNode: React.FC<BaseNodeProps> = ({ data, selected }) => {
  return (
    <Card
      bg="pink.50"
      borderColor={selected ? 'pink.500' : 'pink.200'}
      borderWidth={selected ? 3 : 2}
      boxShadow={selected ? 'lg' : 'md'}
      minW="200px"
    >
      <Handle type="target" position={Position.Top} style={{ background: '#D53F8C' }} />

      <CardBody p={3}>
        <VStack spacing={2}>
          <Icon as={FiUser} color="pink.600" boxSize={5} />
          <Text fontSize="sm" fontWeight="bold" color="pink.900" textAlign="center">
            {data.label}
          </Text>
          {data.approvers && (
            <HStack>
              <Icon as={FiUsers} color="pink.500" boxSize={3} />
              <Text fontSize="xs" color="pink.600">
                {data.approvers} approver(s)
              </Text>
            </HStack>
          )}
          {data.status === 'waiting' && (
            <Badge colorScheme="yellow" fontSize="xs">
              Waiting for approval
            </Badge>
          )}
          {data.status === 'completed' && (
            <Badge colorScheme="green" fontSize="xs">
              ✓ Approved
            </Badge>
          )}
          {data.description && (
            <Text fontSize="xs" color="gray.600" textAlign="center" noOfLines={2}>
              {data.description}
            </Text>
          )}
        </VStack>
      </CardBody>

      <Handle type="source" position={Position.Bottom} style={{ background: '#D53F8C' }} />
    </Card>
  );
};

// Multi-Agent Coordination Node
export const MultiAgentNode: React.FC<BaseNodeProps> = ({ data, selected }) => {
  return (
    <Card
      bg="teal.50"
      borderColor={selected ? 'teal.500' : 'teal.200'}
      borderWidth={selected ? 3 : 2}
      boxShadow={selected ? 'lg' : 'md'}
      minW="220px"
    >
      <Handle type="target" position={Position.Top} style={{ background: '#319795' }} />

      <CardBody p={3}>
        <VStack spacing={2}>
          <Icon as={FiUsers} color="teal.600" boxSize={5} />
          <Text fontSize="sm" fontWeight="bold" color="teal.900" textAlign="center">
            {data.label}
          </Text>
          {data.agents && (
            <HStack spacing={1} flexWrap="wrap">
              {data.agents.slice(0, 3).map((agent: string, idx: number) => (
                <Badge key={idx} colorScheme="teal" fontSize="xs">
                  {agent}
                </Badge>
              ))}
              {data.agents.length > 3 && (
                <Badge colorScheme="teal" fontSize="xs">
                  +{data.agents.length - 3}
                </Badge>
              )}
            </HStack>
          )}
          {data.description && (
            <Text fontSize="xs" color="gray.600" textAlign="center" noOfLines={2}>
              {data.description}
            </Text>
          )}
          {data.status === 'running' && data.activeAgent && (
            <Text fontSize="xs" color="teal.600">
              Active: {data.activeAgent}
            </Text>
          )}
        </VStack>
      </CardBody>

      <Handle type="source" position={Position.Bottom} style={{ background: '#319795' }} />
    </Card>
  );
};

// Export all node types
export const enhancedNodeTypes = {
  agentTask: AgentTaskNode,
  conditional: ConditionalNode,
  parallel: ParallelNode,
  humanApproval: HumanApprovalNode,
  multiAgent: MultiAgentNode,
};
