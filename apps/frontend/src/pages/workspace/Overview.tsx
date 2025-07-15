import React from 'react';

export default function WorkspaceOverview() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Workspace Overview</h1>
        <p className="text-gray-600">Monitor your workspace activity and key metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🤖</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Active Agents</h3>
              <p className="text-3xl font-bold text-blue-600">12</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🔄</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Running Workflows</h3>
              <p className="text-3xl font-bold text-green-600">8</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-2xl mr-3">👥</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              <p className="text-3xl font-bold text-purple-600">24</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📊</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tasks Completed</h3>
              <p className="text-3xl font-bold text-orange-600">156</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg mr-3">🤖</div>
            <div className="flex-1">
              <p className="font-medium">AI Agent "Data Processor" completed analysis task</p>
              <p className="text-sm text-gray-500">2 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg mr-3">👥</div>
            <div className="flex-1">
              <p className="font-medium">John Smith joined the workspace</p>
              <p className="text-sm text-gray-500">15 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg mr-3">🔄</div>
            <div className="flex-1">
              <p className="font-medium">Workflow "Customer Onboarding" started</p>
              <p className="text-sm text-gray-500">1 hour ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}