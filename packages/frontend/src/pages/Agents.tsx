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
  Avatar,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaPlus, FaRobot, FaCog, FaPlay, FaPause, FaChartLine } from 'react-icons/fa';

export const Agents: React.FC = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.300');

  // Mock agent data
  const agents = [
    {
      id: 1,
      name: 'Data Analyzer',
      status: 'active',
      type: 'Analytics',
      tasksCompleted: 45,
      uptime: '99.2%',
      lastActivity: '2 minutes ago'
    },
    {
      id: 2,
      name: 'Content Generator',
      status: 'active',
      type: 'Content',
      tasksCompleted: 28,
      uptime: '98.7%',
      lastActivity: '1 hour ago'
    },
    {
      id: 3,
      name: 'Customer Support Bot',
      status: 'paused',
      type: 'Support',
      tasksCompleted: 156,
      uptime: '97.1%',
      lastActivity: '3 hours ago'
    },
    {
      id: 4,
      name: 'Code Reviewer',
      status: 'active',
      type: 'Development',
      tasksCompleted: 12,
      uptime: '100%',
      lastActivity: '5 minutes ago'
    }
  ];

  const stats = [
    { label: 'Total Agents', value: '4', change: '+2 this week' },
    { label: 'Active Agents', value: '3', change: 'All systems operational' },
    { label: 'Tasks Completed', value: '241', change: '+18% from last week' },
    { label: 'Average Uptime', value: '98.7%', change: 'Within SLA targets' }
  ];

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="7xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={2}>
              <Heading size="xl" color={textColor}>
                AI Agents
              </Heading>
              <Text color={subTextColor} fontSize="lg">
                Manage and monitor your AI agent ecosystem
              </Text>
            </VStack>
            <RouterLink to="/agents/new">
              <Button 
                leftIcon={<FaPlus />} 
                colorScheme="blue" 
                size="lg"
              >
                Create Agent
              </Button>
            </RouterLink>
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

          {/* Agents Grid */}
          <Box>
            <Heading size="lg" color={textColor} mb={6}>
              Your Agents
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {agents.map((agent) => (
                <Card key={agent.id} bg={cardBg} _hover={{ shadow: 'lg' }} cursor="pointer">
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <HStack>
                          <Avatar 
                            size="md" 
                            icon={<FaRobot />}
                            bg="blue.500"
                          />
                          <VStack align="start" spacing={0}>
                            <Heading size="md" color={textColor}>
                              {agent.name}
                            </Heading>
                            <Text color={subTextColor} fontSize="sm">
                              {agent.type}
                            </Text>
                          </VStack>
                        </HStack>
                        <Badge 
                          colorScheme={agent.status === 'active' ? 'green' : 'orange'}
                        >
                          {agent.status}
                        </Badge>
                      </HStack>

                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text color={subTextColor} fontSize="sm">
                            Tasks Completed
                          </Text>
                          <Text color={textColor} fontWeight="medium">
                            {agent.tasksCompleted}
                          </Text>
                        </HStack>
                        
                        <HStack justify="space-between">
                          <Text color={subTextColor} fontSize="sm">
                            Uptime
                          </Text>
                          <Text color={textColor} fontWeight="medium">
                            {agent.uptime}
                          </Text>
                        </HStack>
                        
                        <HStack justify="space-between">
                          <Text color={subTextColor} fontSize="sm">
                            Last Activity
                          </Text>
                          <Text color={textColor} fontWeight="medium" fontSize="sm">
                            {agent.lastActivity}
                          </Text>
                        </HStack>
                      </VStack>

                      <HStack spacing={2}>
                        <Button 
                          size="sm" 
                          leftIcon={agent.status === 'active' ? <FaPause /> : <FaPlay />}
                          colorScheme={agent.status === 'active' ? 'orange' : 'green'}
                          variant="outline"
                          flex={1}
                        >
                          {agent.status === 'active' ? 'Pause' : 'Start'}
                        </Button>
                        <Button 
                          size="sm" 
                          leftIcon={<FaCog />}
                          variant="outline"
                          flex={1}
                        >
                          Configure
                        </Button>
                        <RouterLink to={`/agents/${agent.id}`}>
                          <Button 
                            size="sm" 
                            leftIcon={<FaChartLine />}
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

          {/* Quick Actions */}
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={4}>
                <Heading size="md" color={textColor}>
                  Quick Actions
                </Heading>
                <HStack spacing={4} wrap="wrap" justify="center">
                  <RouterLink to="/agents/marketplace">
                    <Button variant="outline">
                      Browse Marketplace
                    </Button>
                  </RouterLink>
                  <RouterLink to="/workflows">
                    <Button variant="outline">
                      Manage Workflows
                    </Button>
                  </RouterLink>
                  <RouterLink to="/analytics">
                    <Button variant="outline">
                      View Analytics
                    </Button>
                  </RouterLink>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default Agents;