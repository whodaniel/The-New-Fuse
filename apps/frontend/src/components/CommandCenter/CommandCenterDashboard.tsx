import { useState } from 'react';
import PerformanceDashboard from '../PerformanceDashboard';
import ErrorMonitoringDashboard from '../ErrorMonitoringDashboard';
import { AgentCollaborationDashboard } from '../agent-collaboration-dashboard';
import { Activity, AlertTriangle, Users, LayoutDashboard } from 'lucide-react';

export const CommandCenterDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'collaboration' | 'performance' | 'errors'>('overview');

  return (
    <div className="flex flex-col w-full h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <h1 className="text-2xl font-bold flex items-center">
          <LayoutDashboard className="w-6 h-6 mr-2 text-blue-500" />
          TNF Command Center
        </h1>
        <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
          <button 
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'overview' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center ${activeTab === 'collaboration' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => setActiveTab('collaboration')}
          >
            <Users className="w-4 h-4 mr-2" />
            Collaboration
          </button>
          <button 
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center ${activeTab === 'performance' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => setActiveTab('performance')}
          >
            <Activity className="w-4 h-4 mr-2" />
            Performance
          </button>
          <button 
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center ${activeTab === 'errors' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => setActiveTab('errors')}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Errors
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-[500px]">
              <AgentCollaborationDashboard />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-[500px]">
              <PerformanceDashboard />
            </div>
          </div>
        )}
        {activeTab === 'collaboration' && <AgentCollaborationDashboard />}
        {activeTab === 'performance' && <PerformanceDashboard />}
        {activeTab === 'errors' && <ErrorMonitoringDashboard />}
      </div>
    </div>
  );
};
