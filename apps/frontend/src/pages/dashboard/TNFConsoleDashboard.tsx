import { ActionCard, GlassCard, StatsCard } from '@/components/ui';
import { useAuthorization } from '@/hooks/useAuthorization';
import {
  fetchMeshTelemetry,
  type MeshTelemetrySnapshot,
} from '@/services/orchestrationTelemetry.service';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  CircuitBoard,
  Clock3,
  FileText,
  FolderKanban,
  Layers,
  Loader2,
  Radio,
  Settings,
  Shield,
  Wrench,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

type ConsoleSection = 'overview' | 'architecture' | 'observability' | 'audit' | 'settings';

const resolveSection = (pathname: string): ConsoleSection => {
  if (pathname === '/dashboard/architecture') return 'architecture';
  if (pathname === '/dashboard/observability') return 'observability';
  if (pathname === '/dashboard/logs' || pathname === '/dashboard/audit') return 'audit';
  if (pathname === '/dashboard/settings') return 'settings';
  return 'overview';
};

const sectionLink = (section: ConsoleSection): string => {
  if (section === 'overview') return '/dashboard';
  if (section === 'audit') return '/dashboard/audit';
  return `/dashboard/${section}`;
};

export const TNFConsoleDashboard: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { hasRole } = useAuthorization();
  const section = resolveSection(pathname);

  const [snapshot, setSnapshot] = useState<MeshTelemetrySnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConsoleData = useCallback(async () => {
    setLoading(true);
    try {
      const telemetry = await fetchMeshTelemetry();
      setSnapshot(telemetry);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConsoleData();
    const interval = setInterval(loadConsoleData, 30000);
    return () => clearInterval(interval);
  }, [loadConsoleData]);

  const sectionNav = useMemo(
    () => [
      { id: 'overview' as const, label: 'Overview', icon: Layers },
      { id: 'architecture' as const, label: 'Architecture', icon: CircuitBoard },
      { id: 'observability' as const, label: 'Observability', icon: Activity },
      { id: 'audit' as const, label: 'Audit Channels', icon: FileText },
      { id: 'settings' as const, label: 'Settings', icon: Settings },
    ],
    []
  );

  const metrics = snapshot ?? {
    activeAgents: 0,
    activeWorkflows: 0,
    totalAgents: 0,
    totalWorkflows: 0,
    healthScore: 0,
    errorRatePercent: 0,
    incidents: 0,
    systemStatus: 'offline' as const,
    lastDeployText: 'No deployment data',
    sources: {
      agents: 'unavailable',
      workflows: 'unavailable',
      health: 'unavailable',
      audits: 'unavailable',
    },
    trends: { agentsPct: 0, workflowsPct: 0, healthPct: 0 },
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-blue-300">TNF Control Plane</p>
            <h1 className="text-2xl font-bold text-white mt-2">Production Operations Console</h1>
            <p className="text-slate-300 mt-2">
              Unified surface for architecture, observability, audit channels, and governance.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <span className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200 leading-none">
              {import.meta.env.MODE}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 leading-none">
              <Radio className="h-3 w-3" />
              {metrics.lastDeployText}
            </span>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {sectionNav.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <Link
                key={item.id}
                to={sectionLink(item.id)}
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  active
                    ? 'border-blue-400/40 bg-blue-500/15 text-blue-200'
                    : 'border-white/10 bg-black/20 text-slate-300 hover:border-white/25 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard className="p-10">
          <div className="flex items-center justify-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading TNF runtime snapshot...</span>
          </div>
        </GlassCard>
      ) : (
        <>
          {section === 'overview' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatsCard
                  label="Active Agents"
                  value={metrics.activeAgents}
                  icon={Boxes}
                  gradient="blue"
                  change={metrics.activeAgents > 0 ? 'Fleet online' : 'Awaiting mesh signal'}
                  changeType={metrics.activeAgents > 0 ? 'positive' : 'neutral'}
                  trendPct={metrics.trends.agentsPct}
                  sparkline={[12, 14, 13, 16, metrics.activeAgents || 15, metrics.activeAgents + 2]}
                />
                <StatsCard
                  label="Active Workflows"
                  value={metrics.activeWorkflows}
                  icon={FolderKanban}
                  gradient="purple"
                  change={
                    metrics.activeWorkflows > 0 ? 'Executions in progress' : 'Execution queue idle'
                  }
                  changeType={metrics.activeWorkflows > 0 ? 'positive' : 'neutral'}
                  trendPct={metrics.trends.workflowsPct}
                  sparkline={[
                    4,
                    5,
                    6,
                    5,
                    metrics.activeWorkflows || 7,
                    metrics.activeWorkflows + 1,
                  ]}
                />
                <StatsCard
                  label="Health Score"
                  value={`${metrics.healthScore}%`}
                  icon={Shield}
                  gradient="green"
                  change={metrics.systemStatus === 'healthy' ? 'Stable' : 'Needs attention'}
                  changeType={metrics.systemStatus === 'healthy' ? 'positive' : 'negative'}
                  trendPct={metrics.trends.healthPct}
                  sparkline={[82, 84, 86, 85, metrics.healthScore || 88, metrics.healthScore]}
                />
                <StatsCard
                  label="Open Incidents"
                  value={metrics.incidents}
                  icon={AlertTriangle}
                  gradient="orange"
                  change={`${metrics.errorRatePercent}% error-rate signal`}
                  changeType={metrics.incidents > 0 ? 'negative' : 'neutral'}
                  trendPct={metrics.incidents > 0 ? -4.5 : 1.2}
                  sparkline={[2, 1, 1, 0, metrics.incidents, metrics.incidents]}
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <ActionCard
                  title="System Architecture"
                  description="Inspect core services, orchestration mesh, and runtime topology."
                  icon={CircuitBoard}
                  gradient="cyan"
                  onClick={() => navigate('/dashboard/architecture')}
                />
                <ActionCard
                  title="Audit Channels"
                  description="Review audit events, failures, and execution traces."
                  icon={FileText}
                  gradient="pink"
                  onClick={() => navigate('/dashboard/audit')}
                />
              </div>
            </>
          )}

          {section === 'architecture' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <GlassCard
                className="p-4"
                title="Runtime Topology"
                icon={CircuitBoard}
                gradient="blue"
              >
                <div className="space-y-3 text-sm text-slate-300">
                  <p>
                    Canonical control path:{' '}
                    <span className="text-white">
                      Dashboard → Workflows → Executions → Audit Logs
                    </span>
                  </p>
                  <p>
                    Current health source:{' '}
                    <span className="text-white">{metrics.sources.health}</span>
                  </p>
                  <p>
                    Agents source: <span className="text-white">{metrics.sources.agents}</span>
                  </p>
                  <p>
                    Workflows source:{' '}
                    <span className="text-white">{metrics.sources.workflows}</span>
                  </p>
                </div>
              </GlassCard>
              <GlassCard className="p-4" title="Control Surface" icon={Wrench} gradient="purple">
                <div className="grid gap-2">
                  <Link
                    to="/workflows"
                    className="rounded-md border border-white/10 px-3 py-2 text-sm hover:border-white/25"
                  >
                    Workflow Orchestration
                  </Link>
                  <Link
                    to="/agents"
                    className="rounded-md border border-white/10 px-3 py-2 text-sm hover:border-white/25"
                  >
                    Agent Fleet Management
                  </Link>
                  <Link
                    to="/mcp-hub"
                    className="rounded-md border border-white/10 px-3 py-2 text-sm hover:border-white/25"
                  >
                    MCP Integration Hub
                  </Link>
                </div>
              </GlassCard>
            </div>
          )}

          {section === 'observability' && (
            <div className="grid gap-4 lg:grid-cols-3">
              <ActionCard
                title="System Observatory"
                description="Deep infrastructure telemetry and semantic topology."
                icon={Activity}
                gradient="blue"
                onClick={() => navigate('/observatory')}
              />
              <ActionCard
                title="Operational Analytics"
                description="Execution throughput, latency, and performance trends."
                icon={BarChart3}
                gradient="green"
                onClick={() => navigate('/analytics')}
              />
              <ActionCard
                title="System Health"
                description="Availability and subsystem status checks."
                icon={CheckCircle2}
                gradient="cyan"
                onClick={() => navigate('/admin/system-health')}
              />
            </div>
          )}

          {section === 'audit' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <GlassCard className="p-4" title="Audit Channels" icon={FileText} gradient="orange">
                <div className="space-y-3 text-sm text-slate-300">
                  <p>
                    Audit source: <span className="text-white">{metrics.sources.audits}</span>
                  </p>
                  <p>
                    Incident signal:{' '}
                    <span className="text-white">{metrics.incidents} open incidents</span>
                  </p>
                  <p>
                    Error-rate signal:{' '}
                    <span className="text-white">{metrics.errorRatePercent}%</span>
                  </p>
                  <p className="text-xs text-slate-400 pt-2 border-t border-white/10">
                    Use sidebar Observatory for live mesh telemetry. This console links to durable
                    audit trails only.
                  </p>
                </div>
              </GlassCard>
              <GlassCard className="p-4" title="Access Paths" icon={Clock3} gradient="pink">
                <div className="grid gap-2">
                  <Link
                    to="/admin/audit-logs"
                    className="rounded-md border border-white/10 px-3 py-2 text-sm hover:border-white/25"
                  >
                    Open Full Audit Logs
                  </Link>
                  <Link
                    to="/workflows/executions"
                    className="rounded-md border border-white/10 px-3 py-2 text-sm hover:border-white/25"
                  >
                    Workflow Execution History
                  </Link>
                  <Link
                    to="/timeline"
                    className="rounded-md border border-white/10 px-3 py-2 text-sm hover:border-white/25"
                  >
                    Timeline Activity Stream
                  </Link>
                </div>
              </GlassCard>
            </div>
          )}

          {section === 'settings' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <GlassCard
                className="p-4"
                title="Governance Settings"
                icon={Settings}
                gradient="purple"
              >
                <div className="grid gap-2">
                  <Link
                    to="/settings/general"
                    className="rounded-md border border-white/10 px-3 py-2 text-sm hover:border-white/25"
                  >
                    General Configuration
                  </Link>
                  <Link
                    to="/settings/security"
                    className="rounded-md border border-white/10 px-3 py-2 text-sm hover:border-white/25"
                  >
                    Security Controls
                  </Link>
                  <Link
                    to="/settings/api"
                    className="rounded-md border border-white/10 px-3 py-2 text-sm hover:border-white/25"
                  >
                    API & Integrations
                  </Link>
                </div>
              </GlassCard>
              <GlassCard className="p-4" title="Privileged Controls" icon={Shield} gradient="blue">
                {hasRole(['SUPER_ADMIN']) ? (
                  <div className="grid gap-2">
                    <Link
                      to="/admin"
                      className="rounded-md border border-white/10 px-3 py-2 text-sm hover:border-white/25"
                    >
                      Admin Command Deck
                    </Link>
                    <Link
                      to="/admin/configuration"
                      className="rounded-md border border-white/10 px-3 py-2 text-sm hover:border-white/25"
                    >
                      Infrastructure Configuration
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-slate-300">
                    Elevated controls are restricted. Request SUPER_ADMIN access for governance
                    surfaces.
                  </p>
                )}
              </GlassCard>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TNFConsoleDashboard;
