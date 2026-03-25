import { WorkspaceApiService } from '@/api/workspace';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { Badge } from '@/components/ui/badge';
import { GlassCard, PremiumButton, PremiumInput, StatsCard } from '@/components/ui/premium';
import { useWorkspaceDomains } from '@/hooks/useWorkspaceDomains';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useQuery } from '@tanstack/react-query';
import {
  Boxes,
  Globe,
  Link2,
  Plus,
  RefreshCw,
  Route as RouteIcon,
  Server,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

type SpacesTab = 'overview' | 'routes' | 'domains' | 'settings';
type SpaceHealth = 'healthy' | 'watch' | 'stale';

const HEALTH_STYLES: Record<SpaceHealth, string> = {
  healthy: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  watch: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  stale: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

const getSpaceHealth = (updatedAt?: string): SpaceHealth => {
  if (!updatedAt) return 'watch';
  const timestamp = new Date(updatedAt).getTime();
  if (Number.isNaN(timestamp)) return 'watch';

  const ageDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
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

const toSubdomain = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'workspace';

export default function SpacesOverview() {
  const workspaceApi = useMemo(() => new WorkspaceApiService(), []);
  const {
    loading,
    error,
    currentWorkspace,
    workspaces,
    selectWorkspace,
    createWorkspace,
    refreshWorkspaces,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<SpacesTab>('overview');
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
        health: getSpaceHealth(workspace.updatedAt),
      })),
    [workspaces]
  );

  const selectedWorkspace =
    workspaceRows.find((workspace) => workspace.id === currentWorkspace?.id) || workspaceRows[0] || null;
  const selectedDomains = selectedWorkspace ? getDomainsForWorkspace(selectedWorkspace.id) : [];

  useEffect(() => {
    if (!currentWorkspace && workspaceRows.length > 0) {
      void selectWorkspace(workspaceRows[0].id);
    }
  }, [currentWorkspace, workspaceRows, selectWorkspace]);

  const projectsQuery = useQuery({
    queryKey: ['spaces-overview-projects', selectedWorkspace?.id],
    enabled: Boolean(selectedWorkspace?.id),
    queryFn: async () => {
      if (!selectedWorkspace?.id) return [];
      const response = await workspaceApi.getWorkspaceProjects(selectedWorkspace.id);
      if (!response.success || !response.data) return [];
      return response.data;
    },
  });

  const summary = useMemo(() => {
    const healthy = workspaceRows.filter((workspace) => workspace.health === 'healthy').length;
    const watch = workspaceRows.filter((workspace) => workspace.health === 'watch').length;
    const stale = workspaceRows.filter((workspace) => workspace.health === 'stale').length;
    const totalMembers = workspaceRows.reduce((sum, workspace) => sum + (workspace.members || 0), 0);

    return {
      totalSpaces: workspaceRows.length,
      healthy,
      watch,
      stale,
      totalMembers,
    };
  }, [workspaceRows]);

  const handleCreate = async () => {
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
        title="Space Control"
        subtitle="Manage hosted TNF spaces, inspect routed projects, and monitor deployment posture."
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
            <PremiumButton size="sm" variant="gradient" onClick={handleCreate} disabled={creating}>
              <Plus className="w-4 h-4" />
              {creating ? 'Creating...' : 'Create Space'}
            </PremiumButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard label="Spaces" value={summary.totalSpaces} icon={Globe} gradient="blue" />
        <StatsCard label="Domains" value={totalDomains} icon={Link2} gradient="purple" />
        <StatsCard label="Healthy" value={summary.healthy} icon={Server} gradient="green" />
        <StatsCard
          label="Needs Attention"
          value={summary.watch + summary.stale}
          icon={Settings2}
          gradient="orange"
        />
      </div>

      {error ? (
        <GlassCard className="p-4 border border-rose-500/30 bg-rose-500/10" hover={false}>
          <p className="text-rose-200 text-sm">{error.message}</p>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_2fr] gap-4">
        <GlassCard className="p-4 space-y-3" hover={false}>
          <div className="flex items-center justify-between">
            <h2 className="text-white text-lg font-semibold">Spaces</h2>
            <Badge variant="outline">{workspaceRows.length} total</Badge>
          </div>

          {loading && workspaceRows.length === 0 ? (
            <div className="py-12 text-center text-slate-400">Loading spaces...</div>
          ) : workspaceRows.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              No spaces available yet. Create your first hosted space.
            </div>
          ) : (
            <div className="space-y-2">
              {workspaceRows.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => void selectWorkspace(workspace.id)}
                  className={`w-full text-left rounded-md border px-3 py-3 transition-colors ${
                    selectedWorkspace?.id === workspace.id
                      ? 'border-cyan-500/50 bg-cyan-500/10'
                      : 'border-white/10 bg-black/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{workspace.name}</p>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {toSubdomain(workspace.name)}.thenewfuse.com
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
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{workspace.members} members</Badge>
                    <Badge variant="outline">Updated {formatDate(workspace.updatedAt)}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-4 space-y-4" hover={false}>
          {!selectedWorkspace ? (
            <div className="py-16 text-center text-slate-400">
              Select a space from the left panel to manage it.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedWorkspace.name}</h2>
                  <p className="text-sm text-slate-300 mt-1">
                    {selectedWorkspace.description || 'No description configured for this space.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://${toSubdomain(selectedWorkspace.name)}.thenewfuse.com`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <PremiumButton size="sm" variant="gradient">
                      Open Space
                    </PremiumButton>
                  </a>
                  <Link to="/hosting">
                    <PremiumButton size="sm" variant="outline">
                      Hosting
                    </PremiumButton>
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
                {(['overview', 'routes', 'domains', 'settings'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-md text-sm capitalize transition-colors ${
                      activeTab === tab
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                        : 'bg-black/20 text-slate-300 border border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <GlassCard className="p-3" hover={false}>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Routes</p>
                    <p className="text-2xl font-semibold text-white mt-1">
                      {projectsQuery.data?.length || 0}
                    </p>
                  </GlassCard>
                  <GlassCard className="p-3" hover={false}>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Members</p>
                    <p className="text-2xl font-semibold text-white mt-1">
                      {selectedWorkspace.members || 0}
                    </p>
                  </GlassCard>
                  <GlassCard className="p-3" hover={false}>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Last Update</p>
                    <p className="text-sm font-semibold text-white mt-2">
                      {formatDate(selectedWorkspace.updatedAt)}
                    </p>
                  </GlassCard>
                </div>
              ) : null}

              {activeTab === 'routes' ? (
                <div className="space-y-3">
                  {projectsQuery.isLoading ? (
                    <div className="py-10 text-center text-slate-400">Loading routed projects...</div>
                  ) : (projectsQuery.data?.length || 0) === 0 ? (
                    <div className="py-10 text-center text-slate-400">
                      No routed projects found for this space.
                    </div>
                  ) : (
                    (projectsQuery.data || []).map((project) => (
                      <div
                        key={project.id}
                        className="rounded-md border border-white/10 bg-black/20 px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{project.name}</p>
                            <p className="text-xs text-slate-400 mt-1 truncate">
                              {project.description || 'No project description available.'}
                            </p>
                          </div>
                          <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20">
                            <RouteIcon className="w-3 h-3 mr-1" />
                            Route
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {project.status ? <Badge variant="secondary">{project.status}</Badge> : null}
                          <Badge variant="outline">Updated {formatDate(project.updatedAt)}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : null}

              {activeTab === 'domains' ? (
                <div className="space-y-3">
                  <div className="rounded-md border border-white/10 bg-black/20 px-3 py-3">
                    <p className="text-sm text-white font-medium">Default TNF Domain</p>
                    <p className="text-xs text-slate-300 mt-1">
                      {toSubdomain(selectedWorkspace.name)}.thenewfuse.com
                    </p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-black/20 px-3 py-3">
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
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
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
                        Add Domain
                      </PremiumButton>
                    </div>
                    <div className="mt-3 space-y-2">
                      {selectedDomains.length === 0 ? (
                        <p className="text-xs text-slate-400">No custom domains yet for this space.</p>
                      ) : (
                        selectedDomains.map((domain) => (
                          <div
                            key={domain.id}
                            className="rounded-md border border-white/10 bg-black/30 px-3 py-2 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm text-white truncate">{domain.domain}</p>
                              <p className="text-xs text-slate-400 truncate">
                                {domain.status === 'verified'
                                  ? 'Verified'
                                  : domain.status === 'error'
                                    ? 'Verification issue'
                                    : 'Pending verification'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
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
                                    toast.error(
                                      (error as Error).message || 'Failed to verify domain'
                                    );
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
                    <div className="mt-3">
                      <Link to="/hosting">
                        <PremiumButton size="sm" variant="outline">
                          <Boxes className="w-4 h-4" />
                          Open Hosting Controls
                        </PremiumButton>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === 'settings' ? (
                <div className="space-y-3">
                  <div className="rounded-md border border-white/10 bg-black/20 px-3 py-3">
                    <p className="text-sm text-white font-medium">Workspace ID</p>
                    <p className="text-xs text-slate-300 mt-1 font-mono">{selectedWorkspace.id}</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-black/20 px-3 py-3">
                    <p className="text-sm text-white font-medium">Created</p>
                    <p className="text-xs text-slate-300 mt-1">{formatDate(selectedWorkspace.createdAt)}</p>
                  </div>
                  <div className="pt-1">
                    <Link to="/workspace/settings">
                      <PremiumButton size="sm" variant="outline">
                        <Settings2 className="w-4 h-4" />
                        Open Workspace Settings
                      </PremiumButton>
                    </Link>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
