import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  Icon,
  useColorModeValue,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaPlus, FaPlay, FaPause, FaEdit, FaCopy, FaTrash, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';

export const Workflows: React.FC = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.300');

  // Mock workflow data
  const workflows = [
    {
      id: 1,
      name: 'Customer Onboarding',
      status: 'active',
      lastRun: '2 hours ago',
      success: 98,
      executions: 45,
      avgDuration: '3.2 min'
    },
    {
      id: 2,
      name: 'Data Processing Pipeline',
      status: 'active',
      lastRun: '15 minutes ago',
      success: 95,
      executions: 128,
      avgDuration: '8.7 min'
    },
    {
      id: 3,
      name: 'Content Moderation',
      status: 'paused',
      lastRun: '1 day ago',
      success: 100,
      executions: 76,
      avgDuration: '1.1 min'
    },
    {
      id: 4,
      name: 'Report Generation',
      status: 'failed',
      lastRun: '3 hours ago',
      success: 87,
      executions: 23,
      avgDuration: '12.4 min'
    }
  ];

  const recentExecutions = [
    {
      id: 'exec-001',
      workflow: 'Customer Onboarding',
      status: 'completed',
      duration: '2.8 min',
      timestamp: '2 minutes ago'
    },
    {
      id: 'exec-002',
      workflow: 'Data Processing Pipeline',
      status: 'running',
      duration: '4.2 min',
      timestamp: '5 minutes ago'
    },
    {
      id: 'exec-003',
      workflow: 'Customer Onboarding',
      status: 'completed',
      duration: '3.1 min',
      timestamp: '8 minutes ago'
    },
    {
      id: 'exec-004',
      workflow: 'Report Generation',
      status: 'failed',
      duration: '1.2 min',
      timestamp: '15 minutes ago'
    }
  ];

  const stats = [
    { label: 'Total Workflows', value: '4', change: '+1 this week' },
    { label: 'Active Workflows', value: '2', change: '2 paused, 1 failed' },
    { label: 'Executions Today', value: '47', change: '+23% from yesterday' },
    { label: 'Success Rate', value: '94.2%', change: 'Within target range' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return FaCheckCircle;
      case 'running':
        return FaClock;
      case 'failed':
        return FaExclamationTriangle;
      default:
        return FaClock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'green';
      case 'running':
        return 'blue';
      case 'paused':
        return 'orange';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="7xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={2}>
              <Heading size="xl" color={textColor}>
                Workflows
              </Heading>
              <Text color={subTextColor} fontSize="lg">
                Orchestrate complex AI agent workflows and automations
              </Text>
            </VStack>
            <HStack spacing={3}>
              <RouterLink to="/workflows/templates">
                <Button variant="outline">
                  Browse Templates
                </Button>
              </RouterLink>
              <RouterLink to="/workflows/new">
                <Button 
                  leftIcon={<FaPlus />} 
                  colorScheme="blue" 
                  size="lg"
                >
                  Create Workflow
                </Button>
              </RouterLink>
            </HStack>
          </HStack>

          {/* Stats Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {stats.map((stat, index) => (
              <Card key={index} bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel color={subTextColor}>{stat.label}</StatLabel>
                    <StatNumber color={textColor} fontSize="2xl">
                      {stat.value}
                    </StatNumber>
                    <StatHelpText color={subTextColor}>
                      {stat.change}
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* Workflows Grid */}
          <Box>
            <Heading size="lg" color={textColor} mb={6}>
              Your Workflows
            </Heading>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {workflows.map((workflow) => (
                <Card key={workflow.id} bg={cardBg}>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Heading size="md" color={textColor}>
                            {workflow.name}
                          </Heading>
                          <HStack>
                            <Badge colorScheme={getStatusColor(workflow.status)}>
                              {workflow.status}
                            </Badge>
                            <Text color={subTextColor} fontSize="sm">
                              Last run: {workflow.lastRun}
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>

                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text color={subTextColor} fontSize="sm">Success Rate</Text>
                          <HStack>
                            <Progress 
                              value={workflow.success} 
                              size="sm" 
                              width="60px"
                              colorScheme="green"
                            />
                            <Text color={textColor} fontSize="sm" fontWeight="medium">
                              {workflow.success}%
                            </Text>
                          </HStack>
                        </HStack>
                        
                        <HStack justify="space-between">
                          <Text color={subTextColor} fontSize="sm">Executions</Text>
                          <Text color={textColor} fontWeight="medium">
                            {workflow.executions}
                          </Text>
                        </HStack>
                        
                        <HStack justify="space-between">
                          <Text color={subTextColor} fontSize="sm">Avg Duration</Text>
                          <Text color={textColor} fontWeight="medium">
                            {workflow.avgDuration}
                          </Text>
                        </HStack>
                      </VStack>

                      <HStack spacing={2}>
                        <Button 
                          size="sm" 
                          leftIcon={workflow.status === 'active' ? <FaPause /> : <FaPlay />}
                          colorScheme={workflow.status === 'active' ? 'orange' : 'green'}
                          variant="outline"
                        >
                          {workflow.status === 'active' ? 'Pause' : 'Start'}
                        </Button>
                        <Button 
                          size="sm" 
                          leftIcon={<FaEdit />}
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          leftIcon={<FaCopy />}
                          variant="outline"
                        >
                          Clone
                        </Button>
                        <RouterLink to={`/workflows/${workflow.id}`}>
                          <Button 
                            size="sm" 
                            colorScheme="blue"
                          >
                            Details
                          </Button>
                        </RouterLink>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          {/* Recent Executions */}
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="lg" color={textColor}>
                  Recent Executions
                </Heading>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Workflow</Th>
                        <Th>Status</Th>
                        <Th>Duration</Th>
                        <Th>Timestamp</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {recentExecutions.map((execution) => (
                        <Tr key={execution.id}>
                          <Td>
                            <Text fontWeight="medium">{execution.workflow}</Text>
                          </Td>
                          <Td>
                            <HStack>
                              <Icon 
                                as={getStatusIcon(execution.status)} 
                                color={`${getStatusColor(execution.status)}.500`}
                              />
                              <Badge colorScheme={getStatusColor(execution.status)}>
                                {execution.status}
                              </Badge>
                            </HStack>
                          </Td>
                          <Td>{execution.duration}</Td>
                          <Td color={subTextColor}>{execution.timestamp}</Td>
                          <Td>
                            <Button size="xs" variant="outline">
                              View Logs
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default Workflows;