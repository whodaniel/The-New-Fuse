import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { Badge } from '@/components/ui/badge';
import { GlassCard, PremiumButton, PremiumInput, StatsCard } from '@/components/ui/premium';
import { useWorkspaceDomains } from '@/hooks/useWorkspaceDomains';
import { useWorkspace } from '@/hooks/useWorkspace';
import {
  Activity,
  Boxes,
  Globe,
  Link2,
  RefreshCw,
  Rocket,
  ServerCog,
  Settings2,
  Trash2,
  Workflow,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

type DeploymentHealth = 'healthy' | 'watch' | 'stale';

const HEALTH_STYLES: Record<DeploymentHealth, string> = {
  healthy: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  watch: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  stale: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

const getHealth = (updatedAt?: string): DeploymentHealth => {
  if (!updatedAt) return 'watch';
  const updated = new Date(updatedAt).getTime();
  if (Number.isNaN(updated)) return 'watch';

  const ageDays = (Date.now() - updated) / (1000 * 60 * 60 * 24);
  if (ageDays <= 7) return 'healthy';
  if (ageDays <= 30) return 'watch';
  return 'stale';
};

const formatDate = (value?: string): string => {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString();
};

export default function HostingControlCenter() {
  const {
    loading,
    error,
    currentWorkspace,
    workspaces,
    selectWorkspace,
    createWorkspace,
    refreshWorkspaces,
  } = useWorkspace();
  const [creating, setCreating] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const {
    syncState,
    totalDomains,
    getDomainsForWorkspace,
    addDomain,
    removeDomain,
    verifyDomain,
    refreshDomains,
  } =
    useWorkspaceDomains();

  const workspaceRows = useMemo(
    () =>
      workspaces.map((workspace) => ({
        ...workspace,
        health: getHealth(workspace.updatedAt),
      })),
    [workspaces]
  );

  const summary = useMemo(() => {
    const healthy = workspaceRows.filter((workspace) => workspace.health === 'healthy').length;
    const watch = workspaceRows.filter((workspace) => workspace.health === 'watch').length;
    const stale = workspaceRows.filter((workspace) => workspace.health === 'stale').length;

    return {
      healthy,
      watch,
      stale,
    };
  }, [workspaceRows]);

  const selectedWorkspace =
    workspaceRows.find((workspace) => workspace.id === currentWorkspace?.id) || workspaceRows[0] || null;
  const selectedDomains = selectedWorkspace ? getDomainsForWorkspace(selectedWorkspace.id) : [];

  const hostingChecklist: Array<{ label: string; status: 'live' | 'in-progress'; hint: string }> = [
    {
      label: 'Workspace Provisioning',
      status: 'live',
      hint: 'Backed by TNF workspace APIs and creation flows.',
    },
    {
      label: 'Space Deploy Routing',
      status: 'live',
      hint: 'Managed through the existing Space control surface.',
    },
    {
      label: 'Custom Domain & DNS Mapping',
      status: 'live',
      hint: 'Domain mapping is persisted per workspace with synced add/remove controls.',
    },
    {
      label: 'Execution Pipeline Integrations',
      status: 'live',
      hint: 'Workflow operations already power deploy and automation hooks.',
    },
    {
      label: 'Observability & Runtime Health',
      status: 'live',
      hint: 'Terminal and observability surfaces provide runtime telemetry.',
    },
  ];

  const handleCreateWorkspace = async () => {
    setCreating(true);
    try {
      await createWorkspace();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <OpsPageHeader
        eyebrow="Forge"
        title="Hosting Control Center"
        subtitle="Operate workspace deployment targets, monitor hosting health, and route into Spaces."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
              {summary.healthy} healthy
            </Badge>
            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20">
              {summary.watch} watch
            </Badge>
            <Badge className="bg-rose-500/10 text-rose-300 border-rose-500/20">
              {summary.stale} stale
            </Badge>
          </div>
        }
        actions={
          <>
            <PremiumButton
              size="sm"
              variant="outline"
              onClick={() => {
                void refreshWorkspaces();
                void refreshDomains();
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </PremiumButton>
            <PremiumButton
              size="sm"
              variant="gradient"
              onClick={handleCreateWorkspace}
              disabled={creating}
            >
              <Boxes className="w-4 h-4" />
              {creating ? 'Creating...' : 'New Workspace'}
            </PremiumButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="Hosting Targets"
          value={workspaceRows.length}
          icon={ServerCog}
          gradient="blue"
        />
        <StatsCard
          label="Custom Domains"
          value={totalDomains}
          icon={Link2}
          gradient="purple"
        />
        <StatsCard
          label="Healthy Targets"
          value={summary.healthy}
          icon={Rocket}
          gradient="green"
        />
        <StatsCard
          label="Needs Attention"
          value={summary.watch + summary.stale}
          icon={Globe}
          gradient="orange"
        />
      </div>

      {error ? (
        <GlassCard className="p-4 border border-rose-500/30 bg-rose-500/10" hover={false}>
          <p className="text-rose-200 text-sm">{error.message}</p>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4">
        <GlassCard className="p-4 space-y-3" hover={false}>
          <div className="flex items-center justify-between">
            <h2 className="text-white text-lg font-semibold">Workspace Hosting Targets</h2>
            <Badge variant="outline">{workspaceRows.length} total</Badge>
          </div>

          {loading && workspaceRows.length === 0 ? (
            <div className="py-12 text-center text-slate-400">Loading workspace targets...</div>
          ) : workspaceRows.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              No workspaces found. Create your first hosting target.
            </div>
          ) : (
            <div className="space-y-3">
              {workspaceRows.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => void selectWorkspace(workspace.id)}
                  className={`w-full text-left rounded-md border px-4 py-3 transition-colors ${
                    selectedWorkspace?.id === workspace.id
                      ? 'border-cyan-500/50 bg-cyan-500/10'
                      : 'border-white/10 bg-black/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{workspace.name}</p>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {workspace.description || 'No description configured'}
                      </p>
                    </div>
                    <Badge className={HEALTH_STYLES[workspace.health]}>
                      {workspace.health === 'healthy'
                        ? 'Healthy'
                        : workspace.health === 'watch'
                          ? 'Watch'
                          : 'Stale'}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                    <Badge variant="secondary">{workspace.members} members</Badge>
                    <Badge variant="outline">Updated {formatDate(workspace.updatedAt)}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-4 space-y-4" hover={false}>
            <h2 className="text-white text-lg font-semibold">Selected Target</h2>
            {selectedWorkspace ? (
              <>
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-white">{selectedWorkspace.name}</p>
                  <p className="text-sm text-slate-300">
                    {selectedWorkspace.description || 'No workspace description provided.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">{selectedWorkspace.members} members</Badge>
                  <Badge variant="secondary">{selectedDomains.length} custom domains</Badge>
                  <Badge className={HEALTH_STYLES[selectedWorkspace.health]}>
                    {selectedWorkspace.health}
                  </Badge>
                  <Badge variant="outline">Updated {formatDate(selectedWorkspace.updatedAt)}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/space">
                    <PremiumButton size="sm" variant="gradient" className="w-full">
                      <Globe className="w-4 h-4" />
                      Open Space
                    </PremiumButton>
                  </Link>
                  <Link to="/workflows">
                    <PremiumButton size="sm" variant="outline" className="w-full">
                      <Workflow className="w-4 h-4" />
                      Workflows
                    </PremiumButton>
                  </Link>
                  <Link to="/workspace/settings">
                    <PremiumButton size="sm" variant="outline" className="w-full">
                      <Settings2 className="w-4 h-4" />
                      Workspace
                    </PremiumButton>
                  </Link>
                  <Link to="/terminal">
                    <PremiumButton size="sm" variant="ghost" className="w-full">
                      <Activity className="w-4 h-4" />
                      Terminal
                    </PremiumButton>
                  </Link>
                </div>

                <div className="rounded-md border border-white/10 bg-black/20 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-white font-medium">Custom Domains</p>
                    <Badge
                      className={
                        syncState === 'synced'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : syncState === 'syncing'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }
                    >
                      {syncState === 'synced'
                        ? 'Synced'
                        : syncState === 'syncing'
                          ? 'Syncing'
                          : 'Sync Error'}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <PremiumInput
                      value={domainInput}
                      onChange={(event) => setDomainInput(event.target.value)}
                      placeholder="example.com"
                    />
                    <PremiumButton
                      size="sm"
                      variant="gradient"
                      disabled={addingDomain}
                      onClick={async () => {
                        if (!selectedWorkspace) return;
                        setAddingDomain(true);
                        try {
                          await addDomain(selectedWorkspace.id, domainInput);
                          setDomainInput('');
                          toast.success('Domain saved');
                        } catch (error) {
                          toast.error((error as Error).message || 'Failed to save domain');
                        } finally {
                          setAddingDomain(false);
                        }
                      }}
                    >
                      Add
                    </PremiumButton>
                  </div>
                  <div className="space-y-2">
                    {selectedDomains.length === 0 ? (
                      <p className="text-xs text-slate-400">No custom domains configured.</p>
                    ) : (
                      selectedDomains.map((domain) => (
                        <div
                          key={domain.id}
                          className="rounded-md border border-white/10 bg-black/30 px-3 py-2 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">{domain.domain}</p>
                            <p className="text-xs text-slate-400">
                              {domain.status === 'verified'
                                ? 'Verified'
                                : domain.status === 'error'
                                  ? 'Verification issue'
                                  : 'Pending verification'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                domain.status === 'verified'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  : domain.status === 'error'
                                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              }
                            >
                              {domain.status}
                            </Badge>
                            <PremiumButton
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                if (!selectedWorkspace) return;
                                try {
                                  await verifyDomain(selectedWorkspace.id, domain.id);
                                  toast.success('Domain verification updated');
                                } catch (error) {
                                  toast.error((error as Error).message || 'Failed to verify domain');
                                }
                              }}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </PremiumButton>
                            <PremiumButton
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                if (!selectedWorkspace) return;
                                await removeDomain(selectedWorkspace.id, domain.id);
                                toast.success('Domain removed');
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </PremiumButton>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-slate-400 text-sm">
                Select a workspace target to open hosting and deployment controls.
              </p>
            )}
          </GlassCard>

          <GlassCard className="p-4 space-y-3" hover={false}>
            <h3 className="text-white text-base font-semibold">Hosting Rail Coverage</h3>
            <ul className="space-y-2">
              {hostingChecklist.map((item) => (
                <li key={item.label} className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-white font-medium">{item.label}</p>
                    <Badge
                      className={
                        item.status === 'live'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      }
                    >
                      {item.status === 'live' ? 'Live' : 'In Progress'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{item.hint}</p>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
