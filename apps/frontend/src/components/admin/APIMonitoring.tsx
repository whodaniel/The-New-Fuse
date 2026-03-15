import React, { useState } from 'react';
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
    loading,
  } = useAPIMonitoring();

  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');

  if (loading) {
    return (
      <div className="p-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
        </div>
      </div>
    );
  }

  const renderTabs = () => {
    const tabs = ['Overview', 'Providers', 'Cost Analysis', 'Cache Management', 'Settings'];
    return (
      <div className="border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-muted-foreground dark:text-muted-foreground">
          {tabs.map((tab) => (
            <li className="mr-2" key={tab}>
              <button
                onClick={() => setActiveTab(tab)}
                className={`inline-block p-4 rounded-t-lg border-b-2 ${
                  activeTab === tab
                    ? 'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
                    : 'border-transparent hover:text-muted-foreground hover:border-gray-300 dark:hover:text-gray-300'
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <div className="p-4 bg-transparent rounded-md shadow-none dark:bg-transparent">
                <div className="text-sm font-medium text-muted-foreground truncate dark:text-muted-foreground">
                  Total Requests (24h)
                </div>
                <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.totalRequests.toLocaleString()}
                </div>
                <div
                  className={`text-sm font-medium ${stats.requestDelta > 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {stats.requestDelta > 0 ? `↑` : `↓`} {Math.abs(stats.requestDelta)}%
                </div>
              </div>
              <div className="p-4 bg-transparent rounded-md shadow-none dark:bg-transparent">
                <div className="text-sm font-medium text-muted-foreground truncate dark:text-muted-foreground">
                  Success Rate
                </div>
                <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.successRate.toFixed(1)}%
                </div>
                <div
                  className={`text-sm font-medium ${stats.successDelta > 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {stats.successDelta > 0 ? `↑` : `↓`} {Math.abs(stats.successDelta)}%
                </div>
              </div>
              <div className="p-4 bg-transparent rounded-md shadow-none dark:bg-transparent">
                <div className="text-sm font-medium text-muted-foreground truncate dark:text-muted-foreground">
                  Avg. Response Time
                </div>
                <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.avgResponseTime.toFixed(0)}ms
                </div>
                <div
                  className={`text-sm font-medium ${stats.responseDelta > 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {stats.responseDelta > 0 ? `↑` : `↓`} {Math.abs(stats.responseDelta)}%
                </div>
              </div>
              <div className="p-4 bg-transparent rounded-md shadow-none dark:bg-transparent">
                <div className="text-sm font-medium text-muted-foreground truncate dark:text-muted-foreground">
                  Total API Cost (24h)
                </div>
                <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  ${stats.totalCost.toFixed(2)}
                </div>
                <div
                  className={`text-sm font-medium ${stats.costDelta > 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {stats.costDelta > 0 ? `↑` : `↓`} {Math.abs(stats.costDelta)}%
                </div>
              </div>
              <div className="p-4 bg-transparent rounded-md shadow-none dark:bg-transparent">
                <div className="text-sm font-medium text-muted-foreground truncate dark:text-muted-foreground">
                  Cache Hit Rate
                </div>
                <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.cacheHitRate.toFixed(1)}%
                </div>
                <div className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Saved ~${stats.cacheSavings.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-transparent rounded-md shadow-none dark:bg-transparent">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Request Volume
                  </h3>
                </div>
                <div className="p-4">
                  <div style={{ height: '200px' }}>
                    <LineChart data={requestRate} xKey="timestamp" yKey="count" height={200} />
                  </div>
                </div>
              </div>
              <div className="bg-transparent rounded-md shadow-none dark:bg-transparent">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Error Rate
                  </h3>
                </div>
                <div className="p-4">
                  <div style={{ height: '200px' }}>
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
                {providers.map((provider: any) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-transparent dark:bg-transparent">
                <thead className="bg-transparent dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider dark:text-gray-300">
                      Provider
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider dark:text-gray-300">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider dark:text-gray-300">
                      Success Rate
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider dark:text-gray-300">
                      Avg. Latency
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider dark:text-gray-300">
                      Request Count
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider dark:text-gray-300">
                      Rate Limit
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider dark:text-gray-300">
                      Total Cost
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 dark:divide-border/40">
                  {providers
                    .filter((p: any) => !selectedProvider || p.id === selectedProvider)
                    .map((provider: any) => (
                      <tr key={provider.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {provider.name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${provider.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                          >
                            {provider.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-gray-300">
                          {provider.successRate.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-gray-300">
                          {provider.avgLatency.toFixed(0)}ms
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-gray-300">
                          {provider.requestCount.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-gray-300">
                          <div className="relative group">
                            <div className="w-24 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{
                                  width: `${(provider.currentRate / provider.maxRate) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <div className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-gray-900 text-white text-xs rounded py-1 px-2">
                              {`${provider.currentRate}/${provider.maxRate} per minute`}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-gray-300">
                          ${provider.totalCost.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => resetProvider(provider.id)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-transparent rounded-md shadow-none dark:bg-transparent">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Cost by Provider
                  </h3>
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
                      {costBreakdown.byProvider.map((item: any) => (
                        <tr key={item.id}>
                          <td className="py-2">{item.name}</td>
                          <td className="py-2">${item.cost.toFixed(2)}</td>
                          <td className="py-2">{item.percentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-transparent rounded-md shadow-none dark:bg-transparent">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Daily Usage
                  </h3>
                </div>
                <div className="p-4">
                  <div style={{ height: '200px' }}>
                    <LineChart data={dailyUsage} xKey="date" yKey="cost" height={200} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Cache Management':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cache Management
              </h2>
              <button
                onClick={clearCache}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Clear Cache
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-transparent rounded-md shadow-none dark:bg-transparent">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Cache Statistics
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                        Hit Rate
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.cacheHitRate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                        Total Hits
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.cacheHits.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                        Estimated Savings
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${stats.cacheSavings.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-transparent rounded-md shadow-none dark:bg-transparent">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Cache Settings
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground dark:text-gray-300">
                        Enable Caching
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.cacheEnabled}
                        onChange={(e) => updateSettings({ cacheEnabled: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground dark:text-gray-300">
                        Enable Semantic Caching
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.semanticCacheEnabled}
                        onChange={(e) => updateSettings({ semanticCacheEnabled: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground dark:text-gray-300 mb-1">
                        Cache TTL (seconds)
                      </label>
                      <input
                        type="number"
                        value={settings.cacheTTL}
                        onChange={(e) => updateSettings({ cacheTTL: parseInt(e.target.value) })}
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Settings':
        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              API Gateway Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-transparent rounded-md shadow-none dark:bg-transparent">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    General Settings
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground dark:text-gray-300">
                        Enable Cost Tracking
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.costTrackingEnabled}
                        onChange={(e) => updateSettings({ costTrackingEnabled: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground dark:text-gray-300">
                        Enable Provider Failover
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.failoverEnabled}
                        onChange={(e) => updateSettings({ failoverEnabled: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-transparent rounded-md shadow-none dark:bg-transparent">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Provider Management
                  </h3>
                </div>
                <div className="p-4">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Provider API keys and priority settings can be configured in the Provider
                      Management section.
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                    Go to Provider Management
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      {renderTabs()}
      <div className="mt-6">{renderPanel()}</div>
    </div>
  );
};
