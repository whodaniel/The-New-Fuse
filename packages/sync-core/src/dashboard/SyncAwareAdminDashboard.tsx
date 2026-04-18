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
  Badge,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Spinner,
  Tooltip,
  useToast
} from '@chakra-ui/react';
import { 
  FiUsers, 
  FiActivity, 
  FiMessageSquare, 
  FiServer,
  FiAlertCircle,
  FiRefreshCw,
  FiClock,
  FiDatabase,
  FiWifi,
  FiHardDrive,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle
} from 'react-icons/fi';
import { 
  useSyncDashboard, 
  useFilteredAlerts, 
  useRecentOperations, 
  useHealthScore,
  type SystemAlert,
  type SyncOperation 
} from './useSyncDashboard.js';

/**
 * Props for the SyncAwareAdminDashboard component
 */
export interface SyncAwareAdminDashboardProps {
  tenantId?: string;
  userId?: string;
  showSyncMetrics?: boolean;
  showHealthStatus?: boolean;
  showAlerts?: boolean;
  showOperations?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Enhanced AdminDashboard component with real-time sync updates
 * Integrates with existing AdminDashboard while adding sync-aware features
 */
export const SyncAwareAdminDashboard: React.FC<SyncAwareAdminDashboardProps> = ({
  tenantId,
  userId,
  showSyncMetrics = true,
  showHealthStatus = true,
  showAlerts = true,
  showOperations = true,
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const toast = useToast();
  
  // Sync dashboard hook
  const {
    data,
    isConnected,
    isLoading,
    error,
    refresh,
    clearAlerts,
    acknowledgeAlert
  } = useSyncDashboard({
    tenantId,
    userId,
    autoConnect: true,
    updateInterval: autoRefresh ? refreshInterval : 0
  });

  // Filter alerts by severity
  const criticalAlerts = useFilteredAlerts(data.alerts, 'critical');
  const warningAlerts = useFilteredAlerts(data.alerts, 'warning');
  const infoAlerts = useFilteredAlerts(data.alerts, 'info');
  
  // Get recent operations
  const recentOperations = useRecentOperations(data.operations, 5);
  
  // Calculate health score
  const healthScore = useHealthScore(data.health);

  // Legacy dashboard state (for backward compatibility)
  const [legacyStats, setLegacyStats] = useState({
    totalUsers: 256,
    activeUsers: 124,
    totalAgents: 78,
    activeAgents: 42,
    userGrowth: 12,
    agentGrowth: 24
  });

  // Show error toast when connection fails
  useEffect(() => {
    if (error) {
      toast({
        title: 'Dashboard Connection Error',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  }, [error, toast]);

  // Format timestamp
  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  // Get status color for service health
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'degraded': return 'yellow';
      case 'unhealthy': return 'red';
      default: return 'gray';
    }
  };

  // Get alert color scheme
  const getAlertColorScheme = (level: SystemAlert['level']) => {
    switch (level) {
      case 'critical': return 'red';
      case 'error': return 'red';
      case 'warning': return 'orange';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };

  // Get operation status icon
  const getOperationIcon = (operation: SyncOperation) => {
    switch (operation.status) {
      case 'completed': return FiCheckCircle;
      case 'failed': return FiXCircle;
      case 'in_progress': return FiActivity;
      default: return FiClock;
    }
  };

  return (
    <Box>
      {/* Header with connection status */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>Admin Dashboard</Heading>
        <HStack>
          <Tooltip label={isConnected ? 'Connected to sync system' : 'Disconnected from sync system'}>
            <Badge colorScheme={isConnected ? 'green' : 'red'}>
              <Icon as={FiWifi} mr={1} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </Tooltip>
          <Button
            size="sm"
            leftIcon={<Icon as={FiRefreshCw} />}
            onClick={refresh}
            isLoading={isLoading}
            loadingText="Refreshing"
          >
            Refresh
          </Button>
        </HStack>
      </Flex>

      {/* Legacy Stats (for backward compatibility) */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>Total Users</StatLabel>
          <Flex align="center">
            <Icon as={FiUsers} mr={2} color="blue.500" />
            <StatNumber>{legacyStats.totalUsers}</StatNumber>
          </Flex>
          <StatHelpText>
            <StatArrow type="increase" />
            {legacyStats.userGrowth}% since last month
          </StatHelpText>
        </Stat>
        
        <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>Active Users</StatLabel>
          <StatNumber>{legacyStats.activeUsers}</StatNumber>
          <StatHelpText>
            {Math.round((legacyStats.activeUsers / legacyStats.totalUsers) * 100)}% of total users
          </StatHelpText>
        </Stat>
        
        <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>Total Agents</StatLabel>
          <Flex align="center">
            <Icon as={FiMessageSquare} mr={2} color="green.500" />
            <StatNumber>{legacyStats.totalAgents}</StatNumber>
          </Flex>
          <StatHelpText>
            <StatArrow type="increase" />
            {legacyStats.agentGrowth}% since last month
          </StatHelpText>
        </Stat>
        
        <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>System Health</StatLabel>
          <Flex align="center">
            <Icon as={FiServer} mr={2} color="purple.500" />
            <StatNumber>{healthScore}%</StatNumber>
          </Flex>
          <Progress value={healthScore} colorScheme="green" size="sm" mt={2} />
        </Stat>
      </SimpleGrid>

      {/* Sync Metrics (if enabled) */}
      {showSyncMetrics && data.metrics && (
        <Box mb={8}>
          <Heading size="md" mb={4}>Sync Metrics</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Card>
              <CardHeader>
                <Heading size="sm">Operations</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={3}>
                  <HStack justify="space-between">
                    <Text>Sync Operations</Text>
                    <Badge colorScheme="blue">{data.metrics.operations.sync}</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Conflicts</Text>
                    <Badge colorScheme="orange">{data.metrics.operations.conflicts}</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>File Changes</Text>
                    <Badge colorScheme="green">{data.metrics.operations.fileChanges}</Badge>
                  </HStack>
                </Stack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="sm">Performance</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={3}>
                  <HStack justify="space-between">
                    <Text>Avg Sync Time</Text>
                    <Text>{data.metrics.performance.avgSyncTime.toFixed(2)}ms</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Success Rate</Text>
                    <Text>{data.metrics.performance.successRate.toFixed(1)}%</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Throughput</Text>
                    <Text>{data.metrics.performance.throughput.toFixed(1)}/s</Text>
                  </HStack>
                </Stack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="sm">Errors</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={3}>
                  <HStack justify="space-between">
                    <Text>Network Errors</Text>
                    <Badge colorScheme="red">{data.metrics.errors.networkErrors}</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Conflict Errors</Text>
                    <Badge colorScheme="orange">{data.metrics.errors.conflictErrors}</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Validation Errors</Text>
                    <Badge colorScheme="yellow">{data.metrics.errors.validationErrors}</Badge>
                  </HStack>
                </Stack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>
      )}

      {/* System Health (if enabled) */}
      {showHealthStatus && data.health && (
        <Box mb={8}>
          <Heading size="md" mb={4}>System Health</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Card>
              <CardHeader>
                <Heading size="sm">Service Status</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={3}>
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FiDatabase} />
                      <Text>Database</Text>
                    </HStack>
                    <Badge colorScheme={getStatusColor(data.health.services.database)}>
                      {data.health.services.database}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FiServer} />
                      <Text>Redis</Text>
                    </HStack>
                    <Badge colorScheme={getStatusColor(data.health.services.redis)}>
                      {data.health.services.redis}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FiWifi} />
                      <Text>WebSocket</Text>
                    </HStack>
                    <Badge colorScheme={getStatusColor(data.health.services.webSocket)}>
                      {data.health.services.webSocket}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FiHardDrive} />
                      <Text>File System</Text>
                    </HStack>
                    <Badge colorScheme={getStatusColor(data.health.services.fileSystem)}>
                      {data.health.services.fileSystem}
                    </Badge>
                  </HStack>
                </Stack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="sm">Clock Synchronization</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={3}>
                  <HStack justify="space-between">
                    <Text>Status</Text>
                    <Badge colorScheme={getStatusColor(data.health.clockSync.status)}>
                      {data.health.clockSync.status}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Drift</Text>
                    <Text>{data.health.clockSync.drift}ms</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Last Sync</Text>
                    <Text fontSize="sm">{formatTime(data.health.clockSync.lastSync)}</Text>
                  </HStack>
                </Stack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>
      )}

      {/* Alerts and Operations */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* System Alerts */}
        {showAlerts && (
          <Card>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md">System Alerts</Heading>
                {data.alerts.length > 0 && (
                  <Button size="sm" onClick={clearAlerts}>
                    Clear All
                  </Button>
                )}
              </Flex>
            </CardHeader>
            <CardBody>
              {data.alerts.length === 0 ? (
                <Text color="gray.500">No alerts at this time.</Text>
              ) : (
                <Stack spacing={3} maxH="400px" overflowY="auto">
                  {data.alerts.slice(0, 10).map((alert) => (
                    <Alert
                      key={alert.id}
                      status={alert.level === 'critical' || alert.level === 'error' ? 'error' : 
                             alert.level === 'warning' ? 'warning' : 'info'}
                      borderRadius="md"
                    >
                      <AlertIcon />
                      <Box flex="1">
                        <AlertTitle fontSize="sm">
                          {alert.component} - {alert.level.toUpperCase()}
                        </AlertTitle>
                        <AlertDescription fontSize="sm">
                          {alert.message}
                        </AlertDescription>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {formatTime(alert.timestamp)}
                        </Text>
                      </Box>
                      <CloseButton
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      />
                    </Alert>
                  ))}
                </Stack>
              )}
            </CardBody>
          </Card>
        )}

        {/* Recent Operations */}
        {showOperations && (
          <Card>
            <CardHeader>
              <Heading size="md">Recent Operations</Heading>
            </CardHeader>
            <CardBody>
              {recentOperations.length === 0 ? (
                <Text color="gray.500">No recent operations.</Text>
              ) : (
                <Stack divider={<StackDivider />} spacing={4} maxH="400px" overflowY="auto">
                  {recentOperations.map((operation) => (
                    <Box key={operation.id}>
                      <HStack justify="space-between">
                        <HStack>
                          <Icon 
                            as={getOperationIcon(operation)}
                            color={
                              operation.status === 'completed' ? 'green.500' :
                              operation.status === 'failed' ? 'red.500' :
                              operation.status === 'in_progress' ? 'blue.500' : 'gray.500'
                            }
                          />
                          <Text fontWeight="bold" fontSize="sm">
                            {operation.type.replace('_', ' ').toUpperCase()}
                          </Text>
                          <Badge size="sm" colorScheme={
                            operation.status === 'completed' ? 'green' :
                            operation.status === 'failed' ? 'red' :
                            operation.status === 'in_progress' ? 'blue' : 'gray'
                          }>
                            {operation.status}
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" color="gray.500">
                          {formatTime(operation.startedAt)}
                        </Text>
                      </HStack>
                      <Text mt={1} fontSize="sm">
                        {operation.resourceType}: {operation.resourceId}
                      </Text>
                      {operation.error && (
                        <Text mt={1} fontSize="xs" color="red.500">
                          Error: {operation.error}
                        </Text>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </CardBody>
          </Card>
        )}
      </SimpleGrid>

      {/* Last Updated */}
      {data.lastUpdated && (
        <Text fontSize="sm" color="gray.500" mt={4} textAlign="center">
          Last updated: {formatTime(data.lastUpdated)}
        </Text>
      )}
    </Box>
  );
};

export default SyncAwareAdminDashboard;