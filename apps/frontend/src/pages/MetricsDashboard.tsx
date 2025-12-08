import React from 'react';
import { Activity, Cpu, Database, Users } from 'lucide-react';

/**
 * Metrics Dashboard - System performance and metrics
 */
const MetricsDashboard: React.FC = () => {
  const stats = [
    {
      label: 'Active Users',
      value: '1,234',
      helpText: '+12% from last month',
      icon: Activity,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/10'
    },
    {
      label: 'CPU Usage',
      value: '45%',
      helpText: 'Normal',
      icon: Cpu,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/10'
    },
    {
      label: 'Database Size',
      value: '2.4 GB',
      helpText: '75% capacity',
      icon: Database,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/10'
    },
    {
      label: 'API Requests',
      value: '50K',
      helpText: 'Last 24 hours',
      icon: Users,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/10'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Metrics Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor system performance and usage metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.helpText}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Health</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-100 dark:border-green-800">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="font-medium">All systems are operating normally. No issues detected.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
