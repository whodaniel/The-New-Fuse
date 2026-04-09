import { Activity, BarChart2, Plus, TrendingUp, Users, Zap } from 'lucide-react';
import React from 'react';
import { ActionCard, GlassCard, StatsCard } from '../ui/premium';
import { PremiumLayout } from './PremiumLayout';

/**
 * Example page demonstrating the PremiumLayout component
 * Shows how to use the layout with breadcrumbs, title, and glassmorphic cards
 */
export const PremiumLayoutExample: React.FC = () => {
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Overview', path: '/dashboard/overview' },
  ];

  return (
    <PremiumLayout
      title="Dashboard Overview"
      subtitle="Welcome back! Here's what's happening with your AI agents today."
      breadcrumbs={breadcrumbs}
      showSidebar={true}
      showHeader={true}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          label="Total Agents"
          value="24"
          change="+12% from last month"
          changeType="positive"
          icon={Users}
          gradient="blue"
        />
        <StatsCard
          label="Active Tasks"
          value="156"
          change="+8% from last week"
          changeType="positive"
          icon={Activity}
          gradient="purple"
        />
        <StatsCard
          label="Completed"
          value="1,234"
          change="+23% from last month"
          changeType="positive"
          icon={TrendingUp}
          gradient="green"
        />
        <StatsCard
          label="Performance"
          value="98.5%"
          change="Optimal"
          changeType="neutral"
          icon={Zap}
          gradient="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            title="Create New Agent"
            description="Deploy a new AI agent with custom capabilities and configurations."
            icon={Plus}
            gradient="blue"
            onClick={() => console.log('Create agent')}
          />
          <ActionCard
            title="View Analytics"
            description="Analyze performance metrics and insights from your AI agents."
            icon={BarChart2}
            gradient="purple"
            onClick={() => console.log('View analytics')}
          />
          <ActionCard
            title="Manage Team"
            description="Invite team members and manage permissions across your workspace."
            icon={Users}
            gradient="green"
            onClick={() => console.log('Manage team')}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <GlassCard title="Recent Activity" subtitle="Latest updates from your agents" icon={Activity}>
        <div className="space-y-4">
          <ActivityItem
            title="Agent Alpha completed task"
            description="Data analysis workflow finished successfully"
            time="2 minutes ago"
            status="success"
          />
          <ActivityItem
            title="New workflow started"
            description="Marketing campaign automation initiated"
            time="15 minutes ago"
            status="progress"
          />
          <ActivityItem
            title="Agent Beta requires attention"
            description="Configuration update needed for optimal performance"
            time="1 hour ago"
            status="warning"
          />
        </div>
      </GlassCard>
    </PremiumLayout>
  );
};

/**
 * Activity Item Component
 */
interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  status: 'success' | 'progress' | 'warning' | 'error';
}

const ActivityItem: React.FC<ActivityItemProps> = ({ title, description, time, status }) => {
  const statusColors = {
    success: 'bg-green-500',
    progress: 'bg-blue-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200">
      <div className={`w-2 h-2 rounded-full mt-2 ${statusColors[status]}`} />
      <div className="flex-1">
        <h4 className="text-white font-medium mb-1">{title}</h4>
        <p className="text-sm text-gray-400">{description}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
};

export default PremiumLayoutExample;
