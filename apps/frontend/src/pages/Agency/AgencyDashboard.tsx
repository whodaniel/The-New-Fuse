import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
// import { useAgencyContract } from '../../hooks/useContracts'; // Future hook for on-chain data

// Types matching backend AgencyProfile
interface AgencyProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  ownerEmail?: string;
  settings: {
    branding: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
      customDomain?: string;
    };
    features: {
      enableAgentMarketplace: boolean;
      enableWorkflowBuilder: boolean;
      enableA2ACommunication: boolean;
      enableBlockchainFeatures: boolean;
    };
  };
  licenseId?: string;
  licenseStatus: 'none' | 'active' | 'expired' | 'sovereign';
  revenueShare: {
    house: number;
    investors: number;
    affiliates: number;
  };
  agentLimit: number;
  userLimit: number;
  stats: {
    totalAgents: number;
    activeAgents: number;
    totalUsers: number;
    activeUsers: number;
    totalWorkflows: number;
  };
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface SwarmStatus {
  agencyId: string;
  swarmEnabled: boolean;
  status: {
    totalAgents: number;
    onlineAgents: number;
    busyAgents: number;
    activeExecutions: number;
  };
}

interface AgencyAnalytics {
  agencyId: string;
  period: string;
  agents: {
    total: number;
    active: number;
    byType: Record<string, number>;
  };
  tasks: {
    total: number;
    completed: number;
    failed: number;
    successRate: number;
  };
  swarm: {
    enabled: boolean;
    totalAgents: number;
    onlineAgents: number;
    activeExecutions: number;
  };
}

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AgencyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [agencyData, setAgencyData] = useState<AgencyProfile | null>(null);
  const [swarmStatus, setSwarmStatus] = useState<SwarmStatus | null>(null);
  const [analytics, setAnalytics] = useState<AgencyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  // Mock Data for development/fallback
  const MOCK_AGENCY: AgencyProfile = {
    id: 'mock-agency-001',
    name: 'Alpha Corp',
    slug: 'alpha',
    description: 'Mock agency for development',
    ownerId: user?.id || 'mock-owner',
    licenseId: '0x123...abc',
    licenseStatus: 'sovereign',
    revenueShare: {
      house: 60,
      investors: 30,
      affiliates: 10
    },
    settings: {
      branding: {
        customDomain: 'alpha.thenewfuse.hub'
      },
      features: {
        enableAgentMarketplace: true,
        enableWorkflowBuilder: true,
        enableA2ACommunication: true,
        enableBlockchainFeatures: true
      }
    },
    agentLimit: 50,
    userLimit: 500,
    stats: {
      totalAgents: 12,
      activeAgents: 8,
      totalUsers: 342,
      activeUsers: 156,
      totalWorkflows: 24
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  };

  const MOCK_ANALYTICS: AgencyAnalytics = {
    agencyId: 'mock-agency-001',
    period: '30d',
    agents: { total: 12, active: 8, byType: { ASSISTANT: 5, WORKFLOW: 4, CHAT: 3 } },
    tasks: { total: 1240, completed: 1180, failed: 60, successRate: 95 },
    swarm: { enabled: true, totalAgents: 12, onlineAgents: 8, activeExecutions: 3 }
  };

  // Fetch agency data from API
  const fetchAgencyData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch agency list for the current user
      const response = await fetch(`${API_BASE_URL}/api/agencies?ownerId=${user.id}`, {
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if available
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch agencies: ${response.statusText}`);
      }

      const agencies: AgencyProfile[] = await response.json();
      
      if (agencies.length > 0) {
        // Use the first agency for now (could add agency selector later)
        const primaryAgency = agencies[0];
        setAgencyData(primaryAgency);

        // Fetch swarm status
        try {
          const swarmRes = await fetch(`${API_BASE_URL}/api/agencies/${primaryAgency.id}/swarm/status`);
          if (swarmRes.ok) {
            setSwarmStatus(await swarmRes.json());
          }
        } catch (e) {
          console.warn('Failed to fetch swarm status:', e);
        }

        // Fetch analytics
        try {
          const analyticsRes = await fetch(`${API_BASE_URL}/api/agencies/${primaryAgency.id}/analytics?timeframe=30d`);
          if (analyticsRes.ok) {
            setAnalytics(await analyticsRes.json());
          }
        } catch (e) {
          console.warn('Failed to fetch analytics:', e);
        }
      } else {
        // No agencies found, show create option or fallback to mock
        setUseMockData(true);
        setAgencyData(MOCK_AGENCY);
        setAnalytics(MOCK_ANALYTICS);
      }
    } catch (err) {
      console.error('Error fetching agency data:', err);
      setError((err as Error).message);
      // Fallback to mock data
      setUseMockData(true);
      setAgencyData(MOCK_AGENCY);
      setAnalytics(MOCK_ANALYTICS);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAgencyData();
  }, [fetchAgencyData]);

  const getTierDisplay = (status: string): string => {
    switch (status) {
      case 'sovereign': return 'Sovereign (0% Fee)';
      case 'active': return 'Licensed (5% Fee)';
      case 'expired': return 'Expired License';
      default: return 'Free Tier (10% Fee)';
    }
  };

  const getSubdomain = (agency: AgencyProfile): string => {
    return agency.settings.branding.customDomain || `${agency.slug}.thenewfuse.hub`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="animate-pulse">Loading Agency Portal...</div>
        </div>
      </div>
    );
  }

  if (!agencyData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">No agency found</p>
          <button 
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg"
            onClick={() => window.location.href = '/agency/onboarding'}
          >
            Create Your Agency
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      {/* Mock Data Banner */}
      {useMockData && (
        <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-3 mb-6 flex items-center justify-between">
          <span className="text-yellow-300 text-sm">
            ⚠️ Showing mock data. API unavailable or no agencies found.
          </span>
          <button 
            onClick={fetchAgencyData}
            className="text-yellow-400 hover:text-yellow-200 text-sm underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && !useMockData && (
        <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 mb-6">
          <span className="text-red-300 text-sm">Error: {error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {agencyData.name} HQ
          </h1>
          <p className="text-slate-400 mt-1">
            License: <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded">{agencyData.licenseId || 'Not Licensed'}</span>
            <span className="ml-4 text-green-400 font-bold">• {getTierDisplay(agencyData.licenseStatus)}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Agency ID</p>
          <p className="text-sm font-mono text-slate-400">{agencyData.id.slice(0, 8)}...</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h3 className="text-slate-500 text-sm uppercase">Active Agents</h3>
          <p className="text-3xl font-bold text-white mt-2">
            {analytics?.agents.active || agencyData.stats.activeAgents}
            <span className="text-lg text-slate-500">/{analytics?.agents.total || agencyData.stats.totalAgents}</span>
          </p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h3 className="text-slate-500 text-sm uppercase">End Users</h3>
          <p className="text-3xl font-bold text-white mt-2">{agencyData.stats.activeUsers}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h3 className="text-slate-500 text-sm uppercase">Task Success Rate</h3>
          <p className="text-3xl font-bold text-green-400 mt-2">
            {analytics?.tasks.successRate || 0}%
          </p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-purple-900/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-purple-500/10"></div>
          <h3 className="text-purple-300 text-sm uppercase relative z-10">White Label Domain</h3>
          <p className="text-xl font-bold text-white mt-2 relative z-10 truncate">
            {getSubdomain(agencyData)}
          </p>
          <button className="mt-4 text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded relative z-10">
            Configure Branding
          </button>
        </div>
      </div>

      {/* Swarm Status (if enabled) */}
      {swarmStatus?.swarmEnabled && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-6 rounded-xl border border-blue-800/50 mb-12">
          <h2 className="text-xl font-bold mb-4">🐝 Swarm Orchestration Status</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Total Agents</p>
              <p className="text-2xl font-bold">{swarmStatus.status.totalAgents}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Online</p>
              <p className="text-2xl font-bold text-green-400">{swarmStatus.status.onlineAgents}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Busy</p>
              <p className="text-2xl font-bold text-yellow-400">{swarmStatus.status.busyAgents}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Active Executions</p>
              <p className="text-2xl font-bold text-blue-400">{swarmStatus.status.activeExecutions}</p>
            </div>
          </div>
        </div>
      )}

      {/* Financial Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Logic Visualization */}
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-800">
          <h2 className="text-xl font-bold mb-6">Revenue Waterfall</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-32 text-slate-400">House (You)</div>
              <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${agencyData.revenueShare.house}%` }}></div>
              </div>
              <div className="w-16 text-right font-bold text-blue-400">{agencyData.revenueShare.house}%</div>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-slate-400">Investors</div>
              <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${agencyData.revenueShare.investors}%` }}></div>
              </div>
              <div className="w-16 text-right font-bold text-purple-400">{agencyData.revenueShare.investors}%</div>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-slate-400">Affiliates</div>
              <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${agencyData.revenueShare.affiliates}%` }}></div>
              </div>
              <div className="w-16 text-right font-bold text-green-400">{agencyData.revenueShare.affiliates}%</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-6">
            {agencyData.licenseStatus === 'sovereign' 
              ? '* As a Sovereign Agency, 0% goes to TNF Platform. You control the split fully via `FuseRevenueRouter`.'
              : '* Platform fee applies based on your license tier. Upgrade to Sovereign for 0% platform fees.'}
          </p>
        </div>

        {/* Agent Types Distribution */}
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Agent Distribution</h2>
            <button className="text-sm text-blue-400 hover:text-blue-300">Manage Agents</button>
          </div>
          {analytics?.agents.byType && Object.keys(analytics.agents.byType).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.agents.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-slate-400">{type}</span>
                  <span className="text-white font-bold">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 text-center py-8">
              <p>No agents deployed yet</p>
              <button className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
                Deploy Your First Agent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="bg-slate-800 hover:bg-slate-700 p-4 rounded-lg text-left transition-colors">
          <span className="text-2xl">🤖</span>
          <p className="text-white font-bold mt-2">Deploy Agent</p>
          <p className="text-slate-400 text-sm">Add new AI agents</p>
        </button>
        <button className="bg-slate-800 hover:bg-slate-700 p-4 rounded-lg text-left transition-colors">
          <span className="text-2xl">⚙️</span>
          <p className="text-white font-bold mt-2">Configure Swarm</p>
          <p className="text-slate-400 text-sm">Orchestration settings</p>
        </button>
        <button className="bg-slate-800 hover:bg-slate-700 p-4 rounded-lg text-left transition-colors">
          <span className="text-2xl">👥</span>
          <p className="text-white font-bold mt-2">Manage Users</p>
          <p className="text-slate-400 text-sm">Tenant management</p>
        </button>
        <button className="bg-slate-800 hover:bg-slate-700 p-4 rounded-lg text-left transition-colors">
          <span className="text-2xl">📊</span>
          <p className="text-white font-bold mt-2">View Analytics</p>
          <p className="text-slate-400 text-sm">Detailed reports</p>
        </button>
      </div>
    </div>
  );
};

export default AgencyDashboard;
