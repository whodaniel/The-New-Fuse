import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalWorkspaces: number;
  activeWorkspaces: number;
  totalAgents: number;
  runningAgents: number;
  systemUptime: string;
  serverHealth: 'healthy' | 'warning' | 'critical';
  memoryUsage: number;
  cpuUsage: number;
}

export default function AdminPanel() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with API call
  useEffect(() => {
    setTimeout(() => {
      setMetrics({
        totalUsers: 147,
        activeUsers: 23,
        totalWorkspaces: 12,
        activeWorkspaces: 8,
        totalAgents: 34,
        runningAgents: 12,
        systemUptime: '15 days, 4 hours',
        serverHealth: 'healthy',
        memoryUsage: 68,
        cpuUsage: 34
      });
      setLoading(false);
    }, 1000);
  }, []);

  const getHealthBadge = (health: SystemMetrics['serverHealth']) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHealthIcon = (health: SystemMetrics['serverHealth']) => {
    switch (health) {
      case 'healthy':
        return '💚';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '🔴';
      default:
        return '⚫';
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'bg-green-500';
    if (usage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: '👥',
      link: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      title: 'Workspace Management',
      description: 'Manage workspaces and organizations',
      icon: '🏢',
      link: '/admin/workspaces',
      color: 'bg-green-500'
    },
    {
      title: 'System Health',
      description: 'Monitor system performance and status',
      icon: '💚',
      link: '/admin/system-health',
      color: 'bg-emerald-500'
    },
    {
      title: 'Feature Flags',
      description: 'Enable/disable features and experiments',
      icon: '🏴',
      link: '/admin/feature-flags',
      color: 'bg-purple-500'
    },
    {
      title: 'Port Management',
      description: 'Manage application ports and services',
      icon: '🔌',
      link: '/admin/port-management',
      color: 'bg-orange-500'
    },
    {
      title: 'Admin Settings',
      description: 'Configure admin panel preferences',
      icon: '⚙️',
      link: '/admin/settings',
      color: 'bg-gray-500'
    }
  ];

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">👨‍💼 Admin Panel</h1>
            <p className="text-gray-600">System administration and management dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* System Overview */}
      {metrics && (
        <>
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-xs text-green-600">{metrics.activeUsers} active now</p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalWorkspaces}</p>
                  <p className="text-sm text-gray-600">Total Workspaces</p>
                  <p className="text-xs text-green-600">{metrics.activeWorkspaces} active</p>
                </div>
                <div className="text-3xl">🏢</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalAgents}</p>
                  <p className="text-sm text-gray-600">Total Agents</p>
                  <p className="text-xs text-green-600">{metrics.runningAgents} running</p>
                </div>
                <div className="text-3xl">🤖</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">System Health</p>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getHealthBadge(metrics.serverHealth)}`}>
                    {getHealthIcon(metrics.serverHealth)} {metrics.serverHealth}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Uptime: {metrics.systemUptime}</p>
                </div>
                <div className="text-3xl">{getHealthIcon(metrics.serverHealth)}</div>
              </div>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Used</span>
                <span className="text-sm font-medium">{metrics.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(metrics.memoryUsage)}`}
                  style={{ width: `${metrics.memoryUsage}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CPU Usage</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Used</span>
                <span className="text-sm font-medium">{metrics.cpuUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(metrics.cpuUsage)}`}
                  style={{ width: `${metrics.cpuUsage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-left">
            <div className="text-2xl mb-2">➕</div>
            <div className="font-medium">Create User</div>
            <div className="text-sm opacity-90">Add a new user to the system</div>
          </button>
          
          <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left">
            <div className="text-2xl mb-2">🏗️</div>
            <div className="font-medium">Create Workspace</div>
            <div className="text-sm opacity-90">Set up a new workspace</div>
          </button>
          
          <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-left">
            <div className="text-2xl mb-2">🤖</div>
            <div className="font-medium">Deploy Agent</div>
            <div className="text-sm opacity-90">Deploy a new AI agent</div>
          </button>
          
          <button className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors text-left">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">View Reports</div>
            <div className="text-sm opacity-90">Generate system reports</div>
          </button>
          
          <button className="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 transition-colors text-left">
            <div className="text-2xl mb-2">🚨</div>
            <div className="font-medium">System Alerts</div>
            <div className="text-sm opacity-90">Check system alerts</div>
          </button>
          
          <button className="bg-gray-600 text-white p-4 rounded-lg hover:bg-gray-700 transition-colors text-left">
            <div className="text-2xl mb-2">📋</div>
            <div className="font-medium">Audit Logs</div>
            <div className="text-sm opacity-90">Review system activity</div>
          </button>
        </div>
      </div>

      {/* Admin Sections */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Administration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section, index) => (
            <Link
              key={index}
              to={section.link}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${section.color} text-white text-2xl`}>
                  {section.icon}
                </div>
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors">→</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
              <p className="text-sm text-gray-600">{section.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl">👤</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">New user registered</p>
              <p className="text-xs text-gray-500">alice@example.com • 5 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl">🤖</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Agent deployment completed</p>
              <p className="text-xs text-gray-500">ChatBot v2.1 • 12 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl">🏢</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Workspace created</p>
              <p className="text-xs text-gray-500">Marketing Team • 1 hour ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl">⚙️</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">System configuration updated</p>
              <p className="text-xs text-gray-500">Feature flags modified • 2 hours ago</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All Activity →
          </button>
        </div>
      </div>
    </div>
  );
}
