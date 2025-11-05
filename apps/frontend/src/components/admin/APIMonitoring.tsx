import React, { useState, useEffect } from 'react';
import { useAPIMonitoring } from '../../hooks/useAPIMonitoring';
import { LineChart } from '../Charts/LineChart';

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
  const [activeTab, setActiveTab] = useState('Overview');

  if (loading) {
    return <div className="p-4"><div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700"><div className="bg-blue-600 h-2.5 rounded-full" style={{width: "45%"}}></div></div></div>;
  }

  const renderTabs = () => {
    const tabs = ['Overview', 'Providers', 'Cost Analysis', 'Cache Management', 'Settings'];
    return (
      <div className="border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
          {tabs.map(tab => (
            <li className="mr-2" key={tab}>
              <button
                onClick={() => setActiveTab(tab)}
                className={`inline-block p-4 rounded-t-lg border-b-2 ${
                  activeTab === tab
                    ? 'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
              <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">Total Requests (24h)</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{stats.totalRequests.toLocaleString()}</div>
                <div className={`text-sm font-medium ${stats.requestDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.requestDelta > 0 ? `↑` : `↓`} {Math.abs(stats.requestDelta)}%
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">Success Rate</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{stats.successRate.toFixed(1)}%</div>
                <div className={`text-sm font-medium ${stats.successDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.successDelta > 0 ? `↑` : `↓`} {Math.abs(stats.successDelta)}%
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">Avg. Response Time</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{stats.avgResponseTime.toFixed(0)}ms</div>
                <div className={`text-sm font-medium ${stats.responseDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.responseDelta > 0 ? `↑` : `↓`} {Math.abs(stats.responseDelta)}%
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">Total API Cost (24h)</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">${stats.totalCost.toFixed(2)}</div>
                <div className={`text-sm font-medium ${stats.costDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.costDelta > 0 ? `↑` : `↓`} {Math.abs(stats.costDelta)}%
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">Cache Hit Rate</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{stats.cacheHitRate.toFixed(1)}%</div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Saved ~${stats.cacheSavings.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Request Volume</h3>
                </div>
                <div className="p-4">
                  <div style={{height: '200px'}}>
                    <LineChart data={requestRate} xKey="timestamp" yKey="count" height={200} />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Error Rate</h3>
                </div>
                <div className="p-4">
                  <div style={{height: '200px'}}>
                    <LineChart data={errorRate} xKey="timestamp" yKey="rate" height={200} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Providers':
        return (
          <div>
            <div className="flex justify-end mb-4">
              <select
                className="w-48 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                value={selectedProvider || ''}
                onChange={(e) => setSelectedProvider(e.target.value || null)}
              >
                <option value="">All providers</option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Success Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Avg. Latency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Request Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Rate Limit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Total Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {providers
                    .filter(p => !selectedProvider || p.id === selectedProvider)
                    .map(provider => (
                      <tr key={provider.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{provider.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${provider.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {provider.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{provider.successRate.toFixed(1)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{provider.avgLatency.toFixed(0)}ms</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{provider.requestCount.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <div className="relative group">
                            <div className="w-24 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${(provider.currentRate / provider.maxRate) * 100}%`}}></div>
                            </div>
                            <div className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-gray-900 text-white text-xs rounded py-1 px-2">
                              {`${provider.currentRate}/${provider.maxRate} per minute`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${provider.totalCost.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => resetProvider(provider.id)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            Reset
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'Cost Analysis':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cost Analysis</h2>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-40 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cost by Provider</h3>
                </div>
                <div className="p-4">
                  <table className="min-w-full text-sm">
                    <thead className="text-left">
                      <tr>
                        <th className="py-2">Provider</th>
                        <th className="py-2">Cost</th>
                        <th className="py-2">% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costBreakdown.byProvider.map(item => (
                        <tr key={item.id}>
                          <td className="py-2">{item.name}</td>
                          <td className="py-2">${item.cost.toFixed(2)}</td>
                          <td className="py-2">{item.percentage.toFixed(1)}%</td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </div>
              </div>
              
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
