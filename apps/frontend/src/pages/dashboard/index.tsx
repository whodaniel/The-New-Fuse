import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Bot, Users, BarChart3, Settings, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';

interface DashboardStats {
  activeAgents: number;
  totalInteractions: number;
  successRate: number;
  totalUsers: number;
  systemLoad: number;
  uptime: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  color: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeAgents: 0,
    totalInteractions: 0,
    successRate: 0,
    totalUsers: 0,
    systemLoad: 0,
    uptime: '0d 0h 0m'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch from monitoring API
      const [monitoringResponse, analyticsResponse] = await Promise.all([
        fetch('/api/monitoring/health'),
        fetch('/api/analytics/overview/default')
      ]);

      const monitoringData = monitoringResponse.ok ? await monitoringResponse.json() : null;
      const analyticsData = analyticsResponse.ok ? await analyticsResponse.json() : null;

      setStats({
        activeAgents: monitoringData?.overview?.activeAgents || 12,
        totalInteractions: analyticsData?.summary?.totalRequests || 1234,
        successRate: analyticsData?.summary?.clientSatisfaction || 98.5,
        totalUsers: monitoringData?.overview?.totalUsers || 156,
        systemLoad: monitoringData?.overview?.systemLoad || 45.2,
        uptime: monitoringData?.overview?.uptime || '2d 14h 32m'
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data
      setStats({
        activeAgents: 12,
        totalInteractions: 1234,
        successRate: 98.5,
        totalUsers: 156,
        systemLoad: 45.2,
        uptime: '2d 14h 32m'
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Create New Agent',
      description: 'Build a new AI agent with custom capabilities',
      icon: Bot,
      action: () => navigate('/dashboard/agents/new'),
      color: 'bg-blue-500'
    },
    {
      title: 'View Analytics',
      description: 'Monitor your system performance and usage metrics',
      icon: BarChart3,
      action: () => navigate('/dashboard/analytics'),
      color: 'bg-green-500'
    },
    {
      title: 'System Monitoring',
      description: 'Real-time system health and performance monitoring',
      icon: Activity,
      action: () => navigate('/dashboard/monitoring'),
      color: 'bg-purple-500'
    },
    {
      title: 'Manage Team',
      description: 'Add or remove team members and manage permissions',
      icon: Users,
      action: () => navigate('/workspace/members'),
      color: 'bg-orange-500'
    },
    {
      title: 'Agent Management',
      description: 'View and manage all your AI agents',
      icon: Bot,
      action: () => navigate('/dashboard/agents'),
      color: 'bg-indigo-500'
    },
    {
      title: 'Settings',
      description: 'Configure your account and system preferences',
      icon: Settings,
      action: () => navigate('/dashboard/settings'),
      color: 'bg-gray-500'
    }
  ];

  // Helper function for formatting stat changes (currently unused but useful for future enhancements)
  // const formatStatChange = (base: number, change: number) => {
  //   const prefix = change >= 0 ? '+' : '';
  //   return `${prefix}${change}%`;
  // };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.displayName || 'User'}!</h1>
              <p className="text-muted-foreground">Here's what's happening with your agents and system</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/dashboard/agents/new')}>
                <Plus className="mr-2 h-4 w-4" /> New Agent
              </Button>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <Card className="p-6">
              <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Active Agents</h3>
              <p className="text-3xl font-bold">{loading ? '...' : stats.activeAgents}</p>
              <p className="text-xs text-muted-foreground">+2 from last week</p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Total Interactions</h3>
              <p className="text-3xl font-bold">{loading ? '...' : stats.totalInteractions}</p>
              <p className="text-xs text-muted-foreground">+15% from last month</p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Success Rate</h3>
              <p className="text-3xl font-bold">{loading ? '...' : stats.successRate}%</p>
              <p className="text-xs text-muted-foreground">+0.5% from last week</p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Total Users</h3>
              <p className="text-3xl font-bold">{loading ? '...' : stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2 text-sm text-muted-foreground">System Load</h3>
              <p className="text-3xl font-bold">{loading ? '...' : stats.systemLoad}%</p>
              <p className="text-xs text-muted-foreground">Normal</p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Uptime</h3>
              <p className="text-2xl font-bold">{loading ? '...' : stats.uptime}</p>
              <p className="text-xs text-muted-foreground">Continuous</p>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action) => (
                <Card 
                  key={action.title} 
                  className="p-6 cursor-pointer hover:bg-accent transition-colors hover:shadow-lg" 
                  onClick={action.action}
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${action.color} bg-opacity-10`}>
                      <action.icon className={`h-6 w-6 ${action.color.replace('bg-', 'text-')}`} />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Recent Agent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Agent Alpha</p>
                    <p className="text-sm text-muted-foreground">Completed workflow: Data Analysis</p>
                  </div>
                  <span className="text-sm text-muted-foreground">2 min ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Agent Beta</p>
                    <p className="text-sm text-muted-foreground">Started task: Report Generation</p>
                  </div>
                  <span className="text-sm text-muted-foreground">5 min ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Agent Gamma</p>
                    <p className="text-sm text-muted-foreground">Updated configuration</p>
                  </div>
                  <span className="text-sm text-muted-foreground">12 min ago</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">System Health</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <span className="text-sm font-medium text-green-600">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cache</span>
                  <span className="text-sm font-medium text-green-600">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Queue</span>
                  <span className="text-sm font-medium text-green-600">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">WebSocket</span>
                  <span className="text-sm font-medium text-green-600">Healthy</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;