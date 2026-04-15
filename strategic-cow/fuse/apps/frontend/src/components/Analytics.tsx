// @ts-nocheck
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import React, { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Tabs } from './ui/design-system';

// Components placeholders (assuming they exist or need to be mocked/imported)
// import { PerformanceMetrics } from './PerformanceMetrics';
// import { SystemMetrics } from './SystemMetrics';
// import { DynamicKnowledgeGraph } from './DynamicKnowledgeGraph';
// import { PredictiveTaskAllocator } from './PredictiveTaskAllocator';

// Mocking these for now as I don't want to break if they don't exist in the same path
const PerformanceMetrics = () => (
  <div className="p-4 bg-blue-50 text-blue-800 rounded">Performance Metrics Placehoder</div>
);
const SystemMetrics = () => (
  <div className="p-4 bg-green-50 text-green-800 rounded">System Metrics Placeholder</div>
);
const DynamicKnowledgeGraph = () => (
  <div className="p-4 bg-purple-50 text-purple-800 rounded">
    Dynamic Knowledge Graph Placeholder
  </div>
);
const PredictiveTaskAllocator = () => (
  <div className="p-4 bg-orange-50 text-orange-800 rounded">
    Predictive Task Allocator Placeholder
  </div>
);

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('performance');

  const performanceData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Response Time (ms)',
        data: [150, 230, 180, 400, 280, 250],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const resourceUsageData = {
    labels: ['CPU', 'Memory', 'GPU', 'Network'],
    datasets: [
      {
        label: 'Usage %',
        data: [65, 78, 45, 88],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
      },
    ],
  };

  const tabs = [
    {
      id: 'performance',
      title: 'Performance',
      content: (
        <div className="grid grid-cols-1 gap-6">
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4">System Performance</h2>
            <PerformanceMetrics />
            <div className="mt-4 h-80">
              <Line
                data={performanceData}
                options={{ maintainAspectRatio: false, responsive: true }}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'resources',
      title: 'Resources',
      content: (
        <div className="grid grid-cols-1 gap-6">
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Resource Usage</h2>
            <SystemMetrics />
            <div className="mt-4 h-80">
              <Bar
                data={resourceUsageData}
                options={{ maintainAspectRatio: false, responsive: true }}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'knowledge-graph',
      title: 'Knowledge Graph',
      content: (
        <div className="grid grid-cols-1 gap-6">
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Knowledge Graph Analysis</h2>
            <DynamicKnowledgeGraph />
          </div>
        </div>
      ),
    },
    {
      id: 'task-analysis',
      title: 'Task Analysis',
      content: (
        <div className="grid grid-cols-1 gap-6">
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Task Allocation Analysis</h2>
            <PredictiveTaskAllocator />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Monitor system performance and resource usage</p>
      </div>

      <Tabs tabs={tabs} onTabChange={setActiveTab} />
    </div>
  );
};

export default Analytics;
