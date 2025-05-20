import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Heading,
  Text,
  Card,
  CardHeader,
  CardBody,
  Stack,
  StackDivider,
  Flex,
  Icon,
  Progress,
  HStack,
  Badge
} from '@chakra-ui/react';
import { 
  FiUsers, 
  FiActivity, 
  FiMessageSquare, 
  FiServer,
  FiAlertCircle
} from 'react-icons/fi';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalAgents: 0,
    activeAgents: 0,
    systemHealth: 0,
    userGrowth: 0,
    agentGrowth: 0
  });
  
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    type: string;
    user: string;
    action: string;
    timestamp: Date;
  }>>([]);
  
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>>([]);
  
  // Simulate fetching data
  useEffect(() => {
    // In a real implementation, this would fetch data from an API
    setStats({
      totalUsers: 256,
      activeUsers: 124,
      totalAgents: 78,
      activeAgents: 42,
      systemHealth: 98,
      userGrowth: 12,
      agentGrowth: 24
    });
    
    setRecentActivities([
      {
        id: '1',
        type: 'user',
        user: 'John Doe',
        action: 'Created a new workspace',
        timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
      },
      {
        id: '2',
        type: 'agent',
        user: 'Research Assistant',
        action: 'Completed a task',
        timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
      },
      {
        id: '3',
        type: 'system',
        user: 'System',
        action: 'Backup completed',
        timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        id: '4',
        type: 'user',
        user: 'Jane Smith',
        action: 'Updated profile',
        timestamp: new Date(Date.now() - 1000 * 60 * 45) // 45 minutes ago
      },
      {
        id: '5',
        type: 'agent',
        user: 'Code Assistant',
        action: 'Generated code',
        timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      }
    ]);
    
    setAlerts([
      {
        id: '1',
        level: 'info',
        message: 'System update scheduled for tomorrow',
        timestamp: new Date(Date.now() - 1000 * 60 * 120) // 2 hours ago
      },
      {
        id: '2',
        level: 'warning',
        message: 'High CPU usage detected',
        timestamp: new Date(Date.now() - 1000 * 60 * 180) // 3 hours ago
      }
    ]);
  }, []);
  
  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  return (
    <Box>
      <Heading mb={6}>Admin Dashboard</Heading>
      
      {/* Stats */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>Total Users</StatLabel>
          <Flex align="center">
            <Icon as={FiUsers} mr={2} color="blue.500" />
            <StatNumber>{stats.totalUsers}</StatNumber>
          </Flex>
          <StatHelpText>
            <StatArrow type="increase" />
            {stats.userGrowth}% since last month
          </StatHelpText>
        </Stat>
        
        <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>Active Users</StatLabel>
          <StatNumber>{stats.activeUsers}</StatNumber>
          <StatHelpText>
            {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total users
          </StatHelpText>
        </Stat>
        
        <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>Total Agents</StatLabel>
          <Flex align="center">
            <Icon as={FiMessageSquare} mr={2} color="green.500" />
            <StatNumber>{stats.totalAgents}</StatNumber>
          </Flex>
          <StatHelpText>
            <StatArrow type="increase" />
            {stats.agentGrowth}% since last month
          </StatHelpText>
        </Stat>
        
        <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>System Health</StatLabel>
          <Flex align="center">
            <Icon as={FiServer} mr={2} color="purple.500" />
            <StatNumber>{stats.systemHealth}%</StatNumber>
          </Flex>
          <Progress value={stats.systemHealth} colorScheme="green" size="sm" mt={2} />
        </Stat>
      </SimpleGrid>
      
      {/* Recent Activity and Alerts */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card>
          <CardHeader>
            <Heading size="md">Recent Activity</Heading>
          </CardHeader>
          <CardBody>
            <Stack divider={<StackDivider />} spacing={4}>
              {recentActivities.map((activity) => (
                <Box key={activity.id}>
                  <HStack justify="space-between">
                    <HStack>
                      <Icon 
                        as={activity.type === 'user' ? FiUsers : activity.type === 'agent' ? FiMessageSquare : FiActivity} 
                        color={activity.type === 'user' ? 'blue.500' : activity.type === 'agent' ? 'green.500' : 'purple.500'} 
                      />
                      <Text fontWeight="bold">{activity.user}</Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      {formatTime(activity.timestamp)}
                    </Text>
                  </HStack>
                  <Text mt={1}>{activity.action}</Text>
                </Box>
              ))}
            </Stack>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <Heading size="md">System Alerts</Heading>
          </CardHeader>
          <CardBody>
            {alerts.length === 0 ? (
              <Text>No alerts at this time.</Text>
            ) : (
              <Stack divider={<StackDivider />} spacing={4}>
                {alerts.map((alert) => (
                  <Box key={alert.id}>
                    <HStack justify="space-between">
                      <HStack>
                        <Icon 
                          as={FiAlertCircle} 
                          color={alert.level === 'error' ? 'red.500' : alert.level === 'warning' ? 'orange.500' : 'blue.500'} 
                        />
                        <Badge 
                          colorScheme={alert.level === 'error' ? 'red' : alert.level === 'warning' ? 'orange' : 'blue'}
                        >
                          {alert.level.toUpperCase()}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.500">
                        {formatTime(alert.timestamp)}
                      </Text>
                    </HStack>
                    <Text mt={1}>{alert.message}</Text>
                  </Box>
                ))}
              </Stack>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};
