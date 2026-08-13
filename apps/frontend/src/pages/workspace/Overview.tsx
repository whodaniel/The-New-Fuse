import {
  WorkspaceApiService,
  type Workspace,
  type WorkspaceAssetSummary,
  type WorkspaceProject,
} from '@/api/workspace';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuth } from '@/providers/AuthProvider';
import { formatDistanceToNowStrict } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

type ProjectExposureRow = {
  key: string;
  projectName: string;
  workspaceProject: WorkspaceProject | null;
  timelineTrackKeys: string[];
  timelineEventCount: number;
  linkedAssetCount: number;
  latestEvidenceAt: string | null;
};

function normalizeProjectKey(value: string): string {
  return value.trim().toLowerCase();
}

function formatTimestamp(value: string | null): string {
  if (!value) return 'No timeline evidence';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid timestamp';
  return `${date.toLocaleString()} (${formatDistanceToNowStrict(date, { addSuffix: true })})`;
}

export default function WorkspaceOverview() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const workspaceApi = useMemo(() => new WorkspaceApiService(), []);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [workspaceMeta, setWorkspaceMeta] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [assetSummary, setAssetSummary] = useState<WorkspaceAssetSummary | null>(null);

  const targetWorkspaceId = useMemo(() => {
    if (workspaceId && workspaceId.trim().length > 0) {
      return workspaceId.trim();
    }
    if (currentWorkspace?.id && currentWorkspace.id.trim().length > 0) {
      return currentWorkspace.id.trim();
    }
    return '';
  }, [currentWorkspace?.id, workspaceId]);

  const ownerScopeId = useMemo(() => {
    const ownerFromSummary = assetSummary?.ownerId;
    if (typeof ownerFromSummary === 'string' && ownerFromSummary.trim().length > 0) {
      return ownerFromSummary.trim();
    }

    const ownerFromWorkspaceMeta = workspaceMeta?.ownerId;
    if (typeof ownerFromWorkspaceMeta === 'string' && ownerFromWorkspaceMeta.trim().length > 0) {
      return ownerFromWorkspaceMeta.trim();
    }

    const ownerFromCurrent = currentWorkspace?.ownerId;
    if (typeof ownerFromCurrent === 'string' && ownerFromCurrent.trim().length > 0) {
      return ownerFromCurrent.trim();
    }

    if (user?.id && user.id.trim().length > 0) {
      return user.id.trim();
    }

    return '';
  }, [assetSummary?.ownerId, currentWorkspace?.ownerId, user?.id, workspaceMeta?.ownerId]);

  const displayWorkspaceName = useMemo(() => {
    if (workspaceMeta?.name && workspaceMeta.name.trim().length > 0) {
      return workspaceMeta.name;
    }
    if (currentWorkspace?.name && currentWorkspace.name.trim().length > 0) {
      return currentWorkspace.name;
    }
    return 'Workspace';
  }, [currentWorkspace?.name, workspaceMeta?.name]);

  const isDelegatedScope = useMemo(() => {
    if (assetSummary?.scope) {
      return assetSummary.scope === 'delegated';
    }
    return Boolean(user?.id && ownerScopeId && user.id !== ownerScopeId);
  }, [assetSummary?.scope, ownerScopeId, user?.id]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!targetWorkspaceId) {
        if (!cancelled) {
          setLoading(false);
          setLoadError(null);
          setWorkspaceMeta(null);
          setProjects([]);
          setAssetSummary(null);
        }
        return;
      }

      setLoading(true);
      setLoadError(null);

      const errors: string[] = [];
      const workspaceResult = await workspaceApi.getWorkspace(targetWorkspaceId);

      if (workspaceResult.success && workspaceResult.data) {
        if (!cancelled) {
          setWorkspaceMeta(workspaceResult.data);
        }
      } else {
        if (!cancelled) {
          setWorkspaceMeta(null);
        }
        errors.push(workspaceResult.message || 'Unable to load workspace metadata.');
      }

      const [projectsResult, assetsResult] = await Promise.allSettled([
        workspaceApi.getWorkspaceProjects(targetWorkspaceId),
        workspaceApi.getWorkspaceAssets(targetWorkspaceId),
      ]);

      if (cancelled) return;

      if (projectsResult.status === 'fulfilled') {
        if (projectsResult.value.success) {
          setProjects(Array.isArray(projectsResult.value.data) ? projectsResult.value.data : []);
        } else {
          setProjects([]);
          errors.push(projectsResult.value.message || 'Unable to load workspace projects.');
        }
      } else {
        setProjects([]);
        errors.push(projectsResult.reason?.message || 'Unable to load workspace projects.');
      }

      if (assetsResult.status === 'fulfilled') {
        if (assetsResult.value.success) {
          setAssetSummary(assetsResult.value.data || null);
        } else {
          setAssetSummary(null);
          errors.push(assetsResult.value.message || 'Unable to load workspace assets.');
        }
      } else {
        setAssetSummary(null);
        errors.push(assetsResult.reason?.message || 'Unable to load workspace assets.');
      }

      setLoadError(errors.length > 0 ? errors.join(' ') : null);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [targetWorkspaceId, workspaceApi]);

  const derived = useMemo(() => {
    const summaryProjects = Array.isArray(assetSummary?.projects) ? assetSummary.projects : [];
    const summaryAssets = Array.isArray(assetSummary?.assets) ? assetSummary.assets : [];
    const recentEvents = Array.isArray(assetSummary?.recentEvents) ? assetSummary.recentEvents : [];

    const projectSummaryMap = new Map<
      string,
      {
        projectName: string;
        timelineTrackKeys: string[];
        timelineEventCount: number;
        linkedAssetCount: number;
        latestEvidenceAt: string | null;
      }
    >();

    const trackKeys = new Set<string>();

    for (const summaryProject of summaryProjects) {
      const key = normalizeProjectKey(summaryProject.projectName || 'Unassigned');
      const tracks = Array.isArray(summaryProject.timelineTrackKeys)
        ? summaryProject.timelineTrackKeys.filter((track) => typeof track === 'string' && track.trim().length > 0)
        : [];
      for (const track of tracks) {
        trackKeys.add(track);
      }

      projectSummaryMap.set(key, {
        projectName: summaryProject.projectName || 'Unassigned',
        timelineTrackKeys: tracks,
        timelineEventCount: Number(summaryProject.timelineEventCount || 0),
        linkedAssetCount: Number(summaryProject.linkedAssetCount || 0),
        latestEvidenceAt: summaryProject.latestEvidenceAt || null,
      });
    }

    const rows: ProjectExposureRow[] = [];
    const seen = new Set<string>();

    for (const project of projects) {
      const projectName = project?.name || 'Untitled Project';
      const key = normalizeProjectKey(projectName);
      const summaryEntry = projectSummaryMap.get(key);
      seen.add(key);

      rows.push({
        key,
        projectName,
        workspaceProject: project,
        timelineTrackKeys: summaryEntry?.timelineTrackKeys || [],
        timelineEventCount: summaryEntry?.timelineEventCount || 0,
        linkedAssetCount: summaryEntry?.linkedAssetCount || 0,
        latestEvidenceAt: summaryEntry?.latestEvidenceAt || null,
      });
    }

    for (const [key, summaryEntry] of projectSummaryMap.entries()) {
      if (seen.has(key)) continue;
      rows.push({
        key,
        projectName: summaryEntry.projectName,
        workspaceProject: null,
        timelineTrackKeys: summaryEntry.timelineTrackKeys,
        timelineEventCount: summaryEntry.timelineEventCount,
        linkedAssetCount: summaryEntry.linkedAssetCount,
        latestEvidenceAt: summaryEntry.latestEvidenceAt,
      });
    }

    rows.sort((a, b) => {
      if (b.timelineEventCount !== a.timelineEventCount) {
        return b.timelineEventCount - a.timelineEventCount;
      }
      return a.projectName.localeCompare(b.projectName);
    });

    return {
      rows,
      totalTimelineEvents: Number(assetSummary?.totalTimelineEvents || 0),
      uniqueLinkedAssets: Number(assetSummary?.uniqueLinkedAssets || 0),
      uniqueTrackCount: trackKeys.size,
      topAssets: summaryAssets.slice(0, 8),
      recentEvents,
    };
  }, [assetSummary, projects]);

  const activeProjects = useMemo(() => {
    return projects.filter((project) => {
      const status = String(project.status || '').toLowerCase();
      return status !== 'completed' && status !== 'archived' && status !== 'closed';
    }).length;
  }, [projects]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center min-h-[220px] text-muted-foreground">
          Loading workspace overview...
        </div>
      </div>
    );
  }

  if (!targetWorkspaceId) {
    return (
      <div className="p-4">
        <div className="rounded-md border border-border/70 bg-transparent p-4 text-sm text-muted-foreground">
          No workspace selected.
        </div>
      </div>
    );
  }

  const timelineLink = ownerScopeId
    ? `/timeline?ownerId=${encodeURIComponent(ownerScopeId)}`
    : '/timeline';

  return (
    <div className="p-4 space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Workspace Overview: {displayWorkspaceName}
        </h1>
        <p className="text-muted-foreground">
          Private owner+agent timeline visibility with project and asset exposure
        </p>
      </div>

      {loadError ? (
        <div className="rounded-md border border-amber-300 bg-amber-100/80 px-4 py-2 text-sm text-amber-900">
          {loadError}
        </div>
      ) : null}

      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Owner scope:</span> {ownerScopeId || 'unresolved'}
        </p>
        <p className="mt-1">
          <span className="font-semibold">Privacy model:</span> Timeline data is restricted to
          the workspace owner and delegated agents.
        </p>
        <p className="mt-1">
          <span className="font-semibold">Access scope:</span>{' '}
          {assetSummary?.scope || (isDelegatedScope ? 'delegated' : 'owner')}
        </p>
        {isDelegatedScope ? (
          <p className="mt-1 text-amber-700">
            Delegated access detected. You are viewing the owner timeline scope in read-only mode.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-transparent p-4 rounded-md shadow">
          <h3 className="text-sm font-semibold text-muted-foreground">Workspace Projects</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{projects.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{activeProjects} active</p>
        </div>
        <div className="bg-transparent p-4 rounded-md shadow">
          <h3 className="text-sm font-semibold text-muted-foreground">Timeline Events</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{derived.totalTimelineEvents}</p>
          <p className="text-xs text-muted-foreground mt-1">owner-scoped</p>
        </div>
        <div className="bg-transparent p-4 rounded-md shadow">
          <h3 className="text-sm font-semibold text-muted-foreground">Linked Assets</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{derived.uniqueLinkedAssets}</p>
          <p className="text-xs text-muted-foreground mt-1">unique refs</p>
        </div>
        <div className="bg-transparent p-4 rounded-md shadow">
          <h3 className="text-sm font-semibold text-muted-foreground">Parallel Tracks</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{derived.uniqueTrackCount}</p>
          <p className="text-xs text-muted-foreground mt-1">timeline tracks</p>
        </div>
      </div>

      <div className="bg-transparent rounded-md shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Project Exposure Matrix</h2>
          <Link to={timelineLink} className="text-sm font-medium text-blue-700 hover:text-blue-800">
            Open Owner Timeline
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/70">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Project</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Workspace Status</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Timeline Events</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Linked Assets</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Latest Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {derived.rows.map((row) => (
                <tr key={row.key}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">{row.projectName}</div>
                    {row.timelineTrackKeys.length > 0 ? (
                      <div className="text-xs text-muted-foreground mt-1">
                        Tracks: {row.timelineTrackKeys.join(', ')}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.workspaceProject?.status || (row.workspaceProject ? 'active' : 'timeline-only')}
                  </td>
                  <td className="px-3 py-2 text-gray-900">{row.timelineEventCount}</td>
                  <td className="px-3 py-2 text-gray-900">{row.linkedAssetCount}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatTimestamp(row.latestEvidenceAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {derived.rows.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No projects or timeline evidence found for this workspace scope.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-transparent rounded-md shadow p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Timeline Evidence</h2>
          {derived.recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No timeline events available in this scope.</p>
          ) : (
            <div className="space-y-3">
              {derived.recentEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="rounded-md border border-border/60 px-3 py-2">
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.projectName} • {formatTimestamp(event.timestamp)} • {event.linkedAssetCount} linked assets
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-transparent rounded-md shadow p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Linked Assets</h2>
          {derived.topAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No linked assets available in this scope.</p>
          ) : (
            <div className="space-y-3">
              {derived.topAssets.map((asset) => (
                <div key={asset.ref} className="rounded-md border border-border/60 px-3 py-2">
                  <p className="font-medium text-gray-900 break-all">{asset.ref}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {asset.occurrences} occurrences • {asset.projects.length} projects • {formatTimestamp(asset.lastSeenAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
