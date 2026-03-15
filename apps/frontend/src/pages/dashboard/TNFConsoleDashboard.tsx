import { ActionCard, GlassCard, StatsCard } from '@/components/ui/premium';
import { useAuthorization } from '@/hooks/useAuthorization';
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
  Settings,
  Shield,
  Wrench,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

type ConsoleSection = 'overview' | 'architecture' | 'observability' | 'logs' | 'settings';

type ConsoleSnapshot = {
  activeAgents: number;
  activeWorkflows: number;
  healthScore: number;
  lastDeployText: string;
  incidents: number;
  errorRatePercent: number;
  systemStatus: 'healthy' | 'degraded' | 'offline';
};

type EndpointResolution<T = unknown> = {
  data: T;
  source: string;
};

const SOURCE_UNAVAILABLE = 'unavailable';

const resolveSection = (pathname: string): ConsoleSection => {
  if (pathname === '/dashboard/architecture') return 'architecture';
  if (pathname === '/dashboard/observability') return 'observability';
  if (pathname === '/dashboard/logs') return 'logs';
  if (pathname === '/dashboard/settings') return 'settings';
  return 'overview';
};

const sectionLink = (section: ConsoleSection): string => {
  if (section === 'overview') return '/dashboard';
  return `/dashboard/${section}`;
};

const fetchFirstJson = async (
  paths: string[],
  validateStatus = true
): Promise<EndpointResolution | null> => {
  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (validateStatus && !response.ok) continue;
      const data = await response.json().catch(() => null);
      return { data: data ?? {}, source: path };
    } catch {
      // Try next alias.
    }
  }
  return null;
};

const formatRelative = (value?: string): string => {
  if (!value) return 'No deployment data';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No deployment data';
  const diffMs = Date.now() - parsed.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Updated just now';
  if (mins < 60) return `Updated ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Updated ${days}d ago`;
};

export const TNFConsoleDashboard: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { hasRole } = useAuthorization();
  const section = resolveSection(pathname);

  const [snapshot, setSnapshot] = useState<ConsoleSnapshot>({
    activeAgents: 0,
    activeWorkflows: 0,
    healthScore: 0,
    lastDeployText: 'No deployment data',
    incidents: 0,
    errorRatePercent: 0,
    systemStatus: 'offline',
  });
  const [loading, setLoading] = useState(true);
  const [dataSources, setDataSources] = useState({
    systemHealth: SOURCE_UNAVAILABLE,
    workflows: SOURCE_UNAVAILABLE,
    agents: SOURCE_UNAVAILABLE,
    audits: SOURCE_UNAVAILABLE,
  });

  const loadConsoleData = useCallback(async () => {
    setLoading(true);
    try {
      const [healthResult, workflowResult, agentsResult, auditsResult] = await Promise.all([
        fetchFirstJson(['/api/system/health', '/system/health', '/api/health', '/health']),
        fetchFirstJson(['/api/workflows']),
        fetchFirstJson(['/api/agents']),
        fetchFirstJson(['/api/admin/audit-logs', '/admin/audit-logs'], false),
      ]);

      const health = (healthResult?.data as any) || {};
      const workflows = Array.isArray(workflowResult?.data) ? (workflowResult?.data as any[]) : [];
      const agents = Array.isArray(agentsResult?.data) ? (agentsResult?.data as any[]) : [];
      const audits = Array.isArray(auditsResult?.data) ? (auditsResult?.data as any[]) : [];

      const activeWorkflows = workflows.filter((w) =>
        ['active', 'running'].includes(String(w?.status || '').toLowerCase())
      ).length;
      const activeAgents = agents.filter(
        (a) => String(a?.status || '').toLowerCase() === 'active'
      ).length;
      const incidents = audits.filter((entry) =>
        ['error', 'fatal', 'critical'].includes(String(entry?.level || '').toLowerCase())
      ).length;

      const checks = Object.values(health?.checks || {}) as Array<any>;
      const healthyChecks = checks.filter((c) => String(c?.status || '').toLowerCase() === 'ok');
      const healthScore =
        checks.length > 0 ? Math.round((healthyChecks.length / checks.length) * 100) : 0;
      const systemStatus: ConsoleSnapshot['systemStatus'] =
        health?.status === 'ok' || health?.status === 'healthy'
          ? 'healthy'
          : health?.status
            ? 'degraded'
            : 'offline';

      const errorRatePercent = health?.metrics?.errorRate
        ? Number(health.metrics.errorRate)
        : incidents > 0
          ? Math.min(incidents * 2, 100)
          : 0;

      setSnapshot({
        activeAgents,
        activeWorkflows,
        healthScore,
        lastDeployText: formatRelative(health?.timestamp || health?.updatedAt),
        incidents,
        errorRatePercent: Number.isFinite(errorRatePercent)
          ? Number(errorRatePercent.toFixed(1))
          : 0,
        systemStatus,
      });

      setDataSources({
        systemHealth: healthResult?.source || SOURCE_UNAVAILABLE,
        workflows: workflowResult?.source || SOURCE_UNAVAILABLE,
        agents: agentsResult?.source || SOURCE_UNAVAILABLE,
        audits: auditsResult?.source || SOURCE_UNAVAILABLE,
      });
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
      { id: 'logs' as const, label: 'Logs', icon: FileText },
      { id: 'settings' as const, label: 'Settings', icon: Settings },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <GlassCard className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-300">TNF Control Plane</p>
            <h1 className="text-2xl font-bold text-white mt-2">Production Operations Console</h1>
            <p className="text-slate-300 mt-2">
              Unified surface for architecture, observability, logs, and governance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">
              {import.meta.env.MODE}
            </span>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">
              {snapshot.lastDeployText}
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
                  <Icon className="h-4 w-4" />
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
                  value={snapshot.activeAgents}
                  icon={Boxes}
                  gradient="blue"
                  change={snapshot.activeAgents > 0 ? 'Fleet online' : 'No active agents'}
                  changeType={snapshot.activeAgents > 0 ? 'positive' : 'neutral'}
                />
                <StatsCard
                  label="Active Workflows"
                  value={snapshot.activeWorkflows}
                  icon={FolderKanban}
                  gradient="purple"
                  change={
                    snapshot.activeWorkflows > 0 ? 'Executions in progress' : 'Execution queue idle'
                  }
                  changeType={snapshot.activeWorkflows > 0 ? 'positive' : 'neutral'}
                />
                <StatsCard
                  label="Health Score"
                  value={`${snapshot.healthScore}%`}
                  icon={Shield}
                  gradient="green"
                  change={snapshot.systemStatus === 'healthy' ? 'Stable' : 'Needs attention'}
                  changeType={snapshot.systemStatus === 'healthy' ? 'positive' : 'negative'}
                />
                <StatsCard
                  label="Open Incidents"
                  value={snapshot.incidents}
                  icon={AlertTriangle}
                  gradient="orange"
                  change={`${snapshot.errorRatePercent}% error-rate signal`}
                  changeType={snapshot.incidents > 0 ? 'negative' : 'neutral'}
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
                  title="Operational Logs"
                  description="Review audit events, failures, and execution traces."
                  icon={FileText}
                  gradient="pink"
                  onClick={() => navigate('/dashboard/logs')}
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
                    <span className="text-white">Dashboard → Workflows → Executions → Logs</span>
                  </p>
                  <p>
                    Current health source:{' '}
                    <span className="text-white">{dataSources.systemHealth}</span>
                  </p>
                  <p>
                    Agents source: <span className="text-white">{dataSources.agents}</span>
                  </p>
                  <p>
                    Workflows source: <span className="text-white">{dataSources.workflows}</span>
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

          {section === 'logs' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <GlassCard className="p-4" title="Log Channels" icon={FileText} gradient="orange">
                <div className="space-y-3 text-sm text-slate-300">
                  <p>
                    Audit source: <span className="text-white">{dataSources.audits}</span>
                  </p>
                  <p>
                    Incident signal:{' '}
                    <span className="text-white">{snapshot.incidents} open incidents</span>
                  </p>
                  <p>
                    Error-rate signal:{' '}
                    <span className="text-white">{snapshot.errorRatePercent}%</span>
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
