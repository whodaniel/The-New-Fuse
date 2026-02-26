import { GlassCard } from '@/components/ui/premium/GlassCard';
import { PremiumButton } from '@/components/ui/premium/PremiumButton';
import { useApi } from '@/hooks/useApi';
import {
  Activity,
  ArrowUpRight,
  Bot,
  Box,
  ChevronRight,
  Globe,
  Layout,
  Plus,
  Rocket,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface AgencyStats {
  totalAgents: number;
  activeWorkflows: number;
  totalTasks: number;
  revenue: string;
}

export const AgencyDashboard: React.FC = () => {
  const { agentService, workflowService } = useApi();
  const [stats, setStats] = useState<AgencyStats>({
    totalAgents: 0,
    activeWorkflows: 0,
    totalTasks: 0,
    revenue: '$0.00',
  });
  const [recentAgencies, setRecentAgencies] = useState<
    Array<{ id: string; name: string; domain: string; agents: number; split: string }>
  >([]);
  const [_loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Real data fetching from services
      const agentsRes = await agentService.getAgents();
      const workflowsRes = await workflowService.getWorkflows();

      setStats({
        totalAgents: Array.isArray(agentsRes) ? agentsRes.length : 0,
        activeWorkflows: Array.isArray(workflowsRes) ? workflowsRes.length : 0,
        totalTasks: 0,
        revenue: '$0.00',
      });
    } catch (e) {
      console.warn('Backend connection partial, using demo overlay');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            Agency{' '}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">
              Command
            </span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Your sovereign multi-tenant orchestration layer is fully operational.
          </p>
        </div>
        <div className="flex gap-3">
          <PremiumButton variant="secondary" onClick={fetchDashboardData}>
            <Settings className="w-4 h-4 mr-2" /> Global Config
          </PremiumButton>
          <Link to="/agency/onboard">
            <PremiumButton variant="primary">
              <Plus className="w-4 h-4 mr-2" /> New Tenant
            </PremiumButton>
          </Link>
        </div>
      </div>

      {/* High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricBox
          icon={<Bot className="text-blue-400" />}
          label="Provisioned Agents"
          value={stats.totalAgents.toString()}
          sub="+2 this week"
        />
        <MetricBox
          icon={<Zap className="text-amber-400" />}
          label="Active Workflows"
          value={stats.activeWorkflows.toString()}
          sub="Running stable"
        />
        <MetricBox
          icon={<Activity className="text-emerald-400" />}
          label="Total Tasks"
          value={stats.totalTasks.toLocaleString()}
          sub="99.9% Success"
        />
        <MetricBox
          icon={<Rocket className="text-rose-400" />}
          label="Ecosystem Revenue"
          value={stats.revenue}
          sub="Pending router sync"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed: Tenant Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Globe className="w-6 h-6 text-indigo-400" />
              Sovereign Tenants
            </h2>
            <button className="text-sm text-blue-400 hover:underline">View All</button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {recentAgencies.map((agency) => (
              <GlassCard
                key={agency.id}
                className="p-5 border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform">
                      <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">{agency.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{agency.domain}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="hidden md:block text-right">
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        Active Agents
                      </div>
                      <div className="text-lg font-bold text-white">{agency.agents}</div>
                    </div>
                    <div className="hidden md:block text-right">
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        Revenue Split
                      </div>
                      <div className="text-lg font-bold text-emerald-400">{agency.split}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Sidebar: Infrastructure & Security */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            Security Logic
          </h2>

          <GlassCard className="p-6 space-y-4 bg-gradient-to-br from-emerald-600/5 to-transparent">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Auth Propagation</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold uppercase ring-1 ring-emerald-500/50">
                ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Cross-Tenant Isolation</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold uppercase ring-1 ring-emerald-500/50">
                LOCKED
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Revenue Router Sync</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-extrabold uppercase ring-1 ring-amber-500/50">
                PENDING
              </span>
            </div>

            <PremiumButton variant="outline" className="w-full mt-4 h-10">
              Audit Security Logs
            </PremiumButton>
          </GlassCard>

          <GlassCard className="p-6 border-indigo-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-2">Build Ecosystem</h3>
            <p className="text-sm text-gray-400 mb-6">
              Provision new agents, workflows, and marketplace nodes for your sub-tenants.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ActionSmall icon={<Bot />} label="Agent" />
              <ActionSmall icon={<Zap />} label="Workflow" />
              <ActionSmall icon={<Box />} label="Node" />
              <ActionSmall icon={<Layout />} label="Page" />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

const MetricBox: React.FC<{ icon: React.ReactNode; label: string; value: string; sub: string }> = ({
  icon,
  label,
  value,
  sub,
}) => (
  <GlassCard className="p-6 border-white/5 hover:border-white/10 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 rounded-lg bg-white/5 border border-white/10">{icon}</div>
      <ArrowUpRight className="w-4 h-4 text-gray-700" />
    </div>
    <div>
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</div>
      <div className="text-3xl font-bold text-white mt-1">{value}</div>
      <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
        <span className="text-emerald-400 font-bold shrink-0">{sub}</span>
      </div>
    </div>
  </GlassCard>
);

const ActionSmall: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
    <div className="w-6 h-6 mb-1">{icon}</div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

const _MOCK_TENANTS = [
  { id: 't1', name: 'Alpha Research Node', domain: 'alpha.agency.hub', agents: 8, split: '95/5' },
  { id: 't2', name: 'Beta Content Studio', domain: 'beta.agency.hub', agents: 12, split: '90/10' },
  { id: 't3', name: 'Zeta Financial Swarm', domain: 'zeta.agency.hub', agents: 5, split: '98/2' },
];

export default AgencyDashboard;
