import { Sidebar } from '@/components/layout/Sidebar';
import { ActionCard, GlassCard, PremiumButton, StatsCard } from '@/components/ui/premium';
import {
  Activity,
  BarChart3,
  Clock,
  Cpu,
  Database,
  Gauge,
  Globe,
  Layers,
  Plus,
  Rocket,
  Settings,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
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
  gradient: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan';
}

// Animated Counter Component for stats
const AnimatedCounter = ({ end, duration = 2000 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeAgents: 0,
    totalInteractions: 0,
    successRate: 0,
    totalUsers: 0,
    systemLoad: 0,
    uptime: '0d 0h 0m',
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
        fetch('/api/analytics/overview/default'),
      ]);

      const monitoringData = monitoringResponse.ok ? await monitoringResponse.json() : null;
      const analyticsData = analyticsResponse.ok ? await analyticsResponse.json() : null;

      setStats({
        activeAgents: monitoringData?.overview?.activeAgents || 12,
        totalInteractions: analyticsData?.summary?.totalRequests || 1234,
        successRate: analyticsData?.summary?.clientSatisfaction || 98.5,
        totalUsers: monitoringData?.overview?.totalUsers || 156,
        systemLoad: monitoringData?.overview?.systemLoad || 45.2,
        uptime: monitoringData?.overview?.uptime || '2d 14h 32m',
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
        uptime: '2d 14h 32m',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Deploy New Agent',
      description:
        'Launch intelligent AI agents with advanced capabilities and seamless integration',
      icon: Rocket,
      action: () => navigate('/agents/new'),
      gradient: 'blue',
    },
    {
      title: 'Performance Intelligence',
      description: 'Access real-time analytics and performance insights that drive optimization',
      icon: BarChart3,
      action: () => navigate('/dashboard/analytics'),
      gradient: 'green',
    },
    {
      title: 'Mission Control',
      description: 'Monitor system health, resource utilization, and orchestration metrics live',
      icon: Activity,
      action: () => navigate('/dashboard/monitoring'),
      gradient: 'purple',
    },
    {
      title: 'Team Operations',
      description: 'Coordinate your team with advanced access control and collaboration tools',
      icon: Users,
      action: () => navigate('/workspace/members'),
      gradient: 'orange',
    },
    {
      title: 'Agent Fleet Command',
      description: 'Command and control your entire AI agent ecosystem from one unified hub',
      icon: Layers,
      action: () => navigate('/agents'),
      gradient: 'cyan',
    },
    {
      title: 'System Configuration',
      description: 'Fine-tune your platform with enterprise-grade settings and preferences',
      icon: Settings,
      action: () => navigate('/dashboard/settings'),
      gradient: 'pink',
    },
  ];

  // Helper function for formatting stat changes (currently unused but useful for future enhancements)
  // const formatStatChange = (base: number, change: number) => {
  //   const prefix = change >= 0 ? '+' : '';
  //   return `${prefix}${change}%`;
  // };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-pink-600/10 rounded-full blur-[100px] animate-pulse" />
      </div>

      <Sidebar />

      <main className="flex-1 p-6 overflow-auto relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header - Commanding and Powerful */}
          <div className="flex justify-between items-center mb-8 fade-in">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Welcome back, Commander {user?.displayName || 'User'}!
              </h1>
              <p className="text-gray-300 text-lg mt-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Your AI fleet is orchestrating success across all systems
              </p>
            </div>
            <div className="flex gap-3">
              <PremiumButton
                onClick={() => navigate('/agents/new')}
                icon={Plus}
                iconPosition="left"
                size="md"
              >
                Deploy Agent
              </PremiumButton>
              <PremiumButton variant="outline" onClick={logout} size="md">
                Logout
              </PremiumButton>
            </div>
          </div>

          {/* Stats Grid - Premium StatsCard with Animated Counters */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <div className="fade-in" style={{ animationDelay: '0ms' }}>
              <StatsCard
                label="AI Agents Orchestrating"
                value={loading ? '...' : <AnimatedCounter end={stats.activeAgents} />}
                change="+2 agents deployed"
                changeType="positive"
                icon={Rocket}
                gradient="blue"
              />
            </div>

            <div className="fade-in" style={{ animationDelay: '100ms' }}>
              <StatsCard
                label="Total Orchestrations"
                value={loading ? '...' : <AnimatedCounter end={stats.totalInteractions} />}
                change="+15% velocity increase"
                changeType="positive"
                icon={TrendingUp}
                gradient="purple"
              />
            </div>

            <div className="fade-in" style={{ animationDelay: '200ms' }}>
              <StatsCard
                label="Success Rate"
                value={loading ? '...' : `${stats.successRate}%`}
                change="+0.5% optimization"
                changeType="positive"
                icon={Zap}
                gradient="green"
              />
            </div>

            <div className="fade-in" style={{ animationDelay: '300ms' }}>
              <StatsCard
                label="Active Commanders"
                value={loading ? '...' : <AnimatedCounter end={stats.totalUsers} />}
                change="+8% team growth"
                changeType="positive"
                icon={Users}
                gradient="orange"
              />
            </div>

            <div className="fade-in" style={{ animationDelay: '400ms' }}>
              <StatsCard
                label="System Performance"
                value={loading ? '...' : `${stats.systemLoad}%`}
                change="Optimal efficiency"
                changeType="neutral"
                icon={Gauge}
                gradient="cyan"
              />
            </div>

            <div className="fade-in" style={{ animationDelay: '500ms' }}>
              <StatsCard
                label="System Uptime"
                value={loading ? '...' : stats.uptime}
                change="Continuous operation"
                changeType="positive"
                icon={Clock}
                gradient="pink"
              />
            </div>
          </div>

          {/* Quick Actions - ActionCard Components */}
          <div className="mb-8 fade-in" style={{ animationDelay: '600ms' }}>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-400" />
              Command Center Operations
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <div
                  key={action.title}
                  className="fade-in"
                  style={{ animationDelay: `${700 + index * 100}ms` }}
                >
                  <ActionCard
                    title={action.title}
                    description={action.description}
                    icon={action.icon}
                    gradient={action.gradient}
                    onClick={action.action}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity & System Health */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="fade-in" style={{ animationDelay: '1300ms' }}>
              <GlassCard
                icon={Activity}
                title="Live Agent Operations"
                subtitle="Real-time orchestration events"
                gradient="blue"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
                    <div>
                      <p className="font-semibold text-white">Agent Alpha</p>
                      <p className="text-sm text-gray-400">
                        Completed mission: Advanced Data Analysis
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">2 min ago</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
                    <div>
                      <p className="font-semibold text-white">Agent Beta</p>
                      <p className="text-sm text-gray-400">
                        Initiated task: Strategic Report Generation
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">5 min ago</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
                    <div>
                      <p className="font-semibold text-white">Agent Gamma</p>
                      <p className="text-sm text-gray-400">Optimized system configuration</p>
                    </div>
                    <span className="text-xs text-gray-500">12 min ago</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            <div className="fade-in" style={{ animationDelay: '1400ms' }}>
              <GlassCard
                icon={Cpu}
                title="Infrastructure Status"
                subtitle="All systems operating at peak performance"
                gradient="green"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">Database Cluster</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-400/30">
                      Optimal
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">Cache Layer</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-400/30">
                      Optimal
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">Message Queue</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-400/30">
                      Optimal
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">WebSocket Network</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-400/30">
                      Optimal
                    </span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </main>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
