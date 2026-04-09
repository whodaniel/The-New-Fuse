import React, { useState, useEffect } from 'react';
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
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-4 shadow-md border border-gray-200 rounded-md">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="flex items-center">
            <FiUsers className="mr-2 text-blue-500" />
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </div>
          <div className="text-sm text-gray-500">
            <span className="text-green-500">↑</span>
            {stats.userGrowth}% since last month
          </div>
        </div>
        
        <div className="p-4 shadow-md border border-gray-200 rounded-md">
          <div className="text-sm text-gray-500">Active Users</div>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <div className="text-sm text-gray-500">
            {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total users
          </div>
        </div>
        
        <div className="p-4 shadow-md border border-gray-200 rounded-md">
          <div className="text-sm text-gray-500">Total Agents</div>
          <div className="flex items-center">
            <FiMessageSquare className="mr-2 text-green-500" />
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
          </div>
          <div className="text-sm text-gray-500">
            <span className="text-green-500">↑</span>
            {stats.agentGrowth}% since last month
          </div>
        </div>
        
        <div className="p-4 shadow-md border border-gray-200 rounded-md">
          <div className="text-sm text-gray-500">System Health</div>
          <div className="flex items-center">
            <FiServer className="mr-2 text-purple-500" />
            <div className="text-2xl font-bold">{stats.systemHealth}%</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
            <div className="bg-green-600 h-2.5 rounded-full" style={{width: `${stats.systemHealth}%`}}></div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          <div className="p-4">
            <div className="divide-y divide-gray-200">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="py-4">
                  <div className="flex justify-between">
                    <div className="flex">
                      <FiActivity 
                        className={`mr-3 ${activity.type === 'user' ? 'text-blue-500' : activity.type === 'agent' ? 'text-green-500' : 'text-gray-500'}`}
                      />
                      <div>
                        <div className="font-semibold">{activity.user}</div>
                        <div className="text-sm text-gray-600">{activity.action}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{formatTime(activity.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">System Alerts</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-md flex items-start ${alert.level === 'info' ? 'bg-blue-100 text-blue-800' : alert.level === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  <FiAlertCircle className="mr-3 mt-1" />
                  <div>
                    <div className="font-semibold">{alert.level.charAt(0).toUpperCase() + alert.level.slice(1)}</div>
                    <div className="text-sm">{alert.message}</div>
                    <div className="text-xs mt-1">{formatTime(alert.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
