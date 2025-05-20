import React, { useState, useEffect } from 'react';
import {
  Box, 
  Heading, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Text,
  Select,
  HStack,
  Input,
  Button,
  Switch,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Progress,
  Tooltip
} from '@chakra-ui/react';
import { useAPIMonitoring } from '../../hooks/useAPIMonitoring.js';
import { LineChart } from '../Charts/LineChart.js';

export const APIMonitoring: React.FC = () => {
  const { 
    providers, 
    stats, 
    costBreakdown, 
    dailyUsage,
    requestRate,
    errorRate,
    settings,
    updateSettings,
    resetProvider,
    clearCache,
    loading
  } = useAPIMonitoring();
  
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  
  if (loading) {
    return <Box p={4}><Progress isIndeterminate /></Box>;
  }

  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>API Monitoring Dashboard</Heading>
      
      <Tabs>
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Providers</Tab>
          <Tab>Cost Analysis</Tab>
          <Tab>Cache Management</Tab>
          <Tab>Settings</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <StatGroup mb={6}>
              <Stat>
                <StatLabel>Total Requests (24h)</StatLabel>
                <StatNumber>{stats.totalRequests.toLocaleString()}</StatNumber>
                <StatHelpText>
                  {stats.requestDelta > 0 ? `↑` : `↓`} {Math.abs(stats.requestDelta)}%
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Success Rate</StatLabel>
                <StatNumber>{stats.successRate.toFixed(1)}%</StatNumber>
                <StatHelpText>
                  {stats.successDelta > 0 ? `↑` : `↓`} {Math.abs(stats.successDelta)}%
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Avg. Response Time</StatLabel>
                <StatNumber>{stats.avgResponseTime.toFixed(0)}ms</StatNumber>
                <StatHelpText>
                  {stats.responseDelta > 0 ? `↑` : `↓`} {Math.abs(stats.responseDelta)}%
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Total API Cost (24h)</StatLabel>
                <StatNumber>${stats.totalCost.toFixed(2)}</StatNumber>
                <StatHelpText>
                  {stats.costDelta > 0 ? `↑` : `↓`} {Math.abs(stats.costDelta)}%
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Cache Hit Rate</StatLabel>
                <StatNumber>{stats.cacheHitRate.toFixed(1)}%</StatNumber>
                <StatHelpText>
                  Saved ~${stats.cacheSavings.toFixed(2)}
                </StatHelpText>
              </Stat>
            </StatGroup>
            
            <SimpleGrid columns={{ sm: 1, md: 2 }} spacing={6} mb={6}>
              <Card>
                <CardHeader>
                  <Heading size="sm">Request Volume</Heading>
                </CardHeader>
                <CardBody>
                  <Box h="200px">
                    <LineChart 
                      data={requestRate} 
                      xKey="timestamp" 
                      yKey="count" 
                      height={200} 
                    />
                  </Box>
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <Heading size="sm">Error Rate</Heading>
                </CardHeader>
                <CardBody>
                  <Box h="200px">
                    <LineChart 
                      data={errorRate} 
                      xKey="timestamp" 
                      yKey="rate" 
                      height={200} 
                    />
                  </Box>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>
          
          <TabPanel>
            <HStack justifyContent="flex-end" mb={4}>
              <Select
                placeholder="All providers"
                value={selectedProvider || ''}
                onChange={(e) => setSelectedProvider(e.target.value || null)}
                w="200px"
              >
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </Select>
            </HStack>
            
            <Table>
              <Thead>
                <Tr>
                  <Th>Provider</Th>
                  <Th>Status</Th>
                  <Th>Success Rate</Th>
                  <Th>Avg. Latency</Th>
                  <Th>Request Count</Th>
                  <Th>Rate Limit</Th>
                  <Th>Total Cost</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {providers
                  .filter(p => !selectedProvider || p.id === selectedProvider)
                  .map(provider => (
                    <Tr key={provider.id}>
                      <Td>{provider.name}</Td>
                      <Td>
                        <Badge colorScheme={provider.active ? 'green' : 'red'}>
                          {provider.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td>
                        {provider.successRate.toFixed(1)}%
                      </Td>
                      <Td>{provider.avgLatency.toFixed(0)}ms</Td>
                      <Td>{provider.requestCount.toLocaleString()}</Td>
                      <Td>
                        <Tooltip label={`${provider.currentRate}/${provider.maxRate} per minute`}>
                          <Progress 
                            value={(provider.currentRate / provider.maxRate) * 100} 
                            colorScheme={provider.currentRate > provider.maxRate * 0.8 ? 'orange' : 'blue'}
                            size="sm"
                            w="100px"
                          />
                        </Tooltip>
                      </Td>
                      <Td>${provider.totalCost.toFixed(2)}</Td>
                      <Td>
                        <Button size="sm" onClick={() => resetProvider(provider.id)}>
                          Reset
                        </Button>
                      </Td>
                    </Tr>
                  ))}
              </Tbody>
            </Table>
          </TabPanel>
          
          <TabPanel>
            <HStack justifyContent="space-between" mb={4}>
              <Heading size="md">Cost Analysis</Heading>
              <Select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                w="150px"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </Select>
            </HStack>
            
            <SimpleGrid columns={{ sm: 1, md: 2 }} spacing={6}>
              <Card>
                <CardHeader>
                  <Heading size="sm">Cost by Provider</Heading>
                </CardHeader>
                <CardBody>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Provider</Th>
                        <Th>Cost</Th>
                        <Th>% of Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {costBreakdown.byProvider.map(item => (
                        <Tr key={item.id}>
                          <Td>{item.name}</Td>
                          <Td>${item.cost.toFixed(2)}</Td>
                          <Td>{item.percentage.toFixed(1)}%</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader>
                  <Heading size="sm">Daily Usage</Heading>
                </CardHeader>
                <CardBody>
                  <Box h="200px">
                    <LineChart 
                      data={dailyUsage} 
                      xKey="date" 
                      yKey="cost" 
                      height={200} 
                    />
                  </Box>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>
          
          <TabPanel>
            <HStack justifyContent="space-between" mb={4}>
              <Heading size="md">Cache Performance</Heading>
              <Button colorScheme="red" size="sm" onClick={clearCache}>
                Clear Cache
              </Button>
            </HStack>
            
            <SimpleGrid columns={{ sm: 1, md: 2 }} spacing={6} mb={6}>
              <Card>
                <CardHeader>
                  <Heading size="sm">Cache Statistics</Heading>
                </CardHeader>
                <CardBody>
                  <StatGroup>
                    <Stat>
                      <StatLabel>Hit Rate</StatLabel>
                      <StatNumber>{stats.cacheHitRate.toFixed(1)}%</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Total Hits</StatLabel>
                      <StatNumber>{stats.cacheHits.toLocaleString()}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Estimated Savings</StatLabel>
                      <StatNumber>${stats.cacheSavings.toFixed(2)}</StatNumber>
                    </Stat>
                  </StatGroup>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader>
                  <Heading size="sm">Cache Settings</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={1} spacing={4}>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Enable Caching</FormLabel>
                      <Switch 
                        isChecked={settings.cacheEnabled} 
                        onChange={(e) => updateSettings({ cacheEnabled: e.target.checked })}
                      />
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Enable Semantic Caching</FormLabel>
                      <Switch 
                        isChecked={settings.semanticCacheEnabled} 
                        onChange={(e) => updateSettings({ semanticCacheEnabled: e.target.checked })}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Cache TTL (seconds)</FormLabel>
                      <Input 
                        type="number" 
                        value={settings.cacheTTL}
                        onChange={(e) => updateSettings({ cacheTTL: parseInt(e.target.value) })}
                      />
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>
          
          <TabPanel>
            <Heading size="md" mb={4}>API Gateway Settings</Heading>
            
            <SimpleGrid columns={{ sm: 1, md: 2 }} spacing={6}>
              <Card>
                <CardHeader>
                  <Heading size="sm">General Settings</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={1} spacing={4}>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Enable Cost Tracking</FormLabel>
                      <Switch 
                        isChecked={settings.costTrackingEnabled} 
                        onChange={(e) => updateSettings({ costTrackingEnabled: e.target.checked })}
                      />
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Enable Provider Failover</FormLabel>
                      <Switch 
                        isChecked={settings.failoverEnabled} 
                        onChange={(e) => updateSettings({ failoverEnabled: e.target.checked })}
                      />
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader>
                  <Heading size="sm">Provider Management</Heading>
                </CardHeader>
                <CardBody>
                  <Alert status="info" mb={4}>
                    <AlertIcon />
                    Provider API keys and priority settings can be configured in the Provider Management section.
                  </Alert>
                  <Button colorScheme="blue" size="sm">
                    Go to Provider Management
                  </Button>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};
