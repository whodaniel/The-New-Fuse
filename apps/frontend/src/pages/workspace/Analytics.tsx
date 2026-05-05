import {
  WorkspaceApiService,
  type Workspace,
  type WorkspaceAssetSummary,
  type WorkspaceProject,
} from '@/api/workspace';
import { useWorkspace } from '@/hooks/useWorkspace';
import { formatDistanceToNowStrict } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

function formatTimestamp(value: string | null): string {
  if (!value) return 'No timestamp';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid timestamp';
  return `${date.toLocaleString()} (${formatDistanceToNowStrict(date, { addSuffix: true })})`;
}

const ASSET_PAGE_SIZE = 25;
const EVENT_PAGE_SIZE = 12;
const PROJECT_LIMIT = 250;

export default function WorkspaceAnalytics() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace } = useWorkspace();
  const workspaceApi = useMemo(() => new WorkspaceApiService(), []);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [workspaceMeta, setWorkspaceMeta] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [summary, setSummary] = useState<WorkspaceAssetSummary | null>(null);

  const [projectFilter, setProjectFilter] = useState('');
  const [timelineTrackFilter, setTimelineTrackFilter] = useState('');
  const [assetSearch, setAssetSearch] = useState('');

  const [assetPage, setAssetPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);

  const targetWorkspaceId = useMemo(() => {
    if (workspaceId && workspaceId.trim().length > 0) {
      return workspaceId.trim();
    }
    if (currentWorkspace?.id && currentWorkspace.id.trim().length > 0) {
      return currentWorkspace.id.trim();
    }
    return '';
  }, [currentWorkspace?.id, workspaceId]);

  const displayWorkspaceName = useMemo(() => {
    if (workspaceMeta?.name && workspaceMeta.name.trim().length > 0) {
      return workspaceMeta.name;
    }
    if (currentWorkspace?.name && currentWorkspace.name.trim().length > 0) {
      return currentWorkspace.name;
    }
    return 'Workspace';
  }, [currentWorkspace?.name, workspaceMeta?.name]);

  const trackOptions = useMemo(() => {
    const tracks = new Set<string>();
    for (const project of summary?.projects || []) {
      for (const track of project.timelineTrackKeys || []) {
        if (typeof track === 'string' && track.trim().length > 0) {
          tracks.add(track.trim());
        }
      }
    }
    return Array.from(tracks).sort();
  }, [summary?.projects]);

  useEffect(() => {
    setAssetPage(1);
  }, [assetSearch, projectFilter, timelineTrackFilter]);

  useEffect(() => {
    setEventPage(1);
  }, [projectFilter, timelineTrackFilter]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!targetWorkspaceId) {
        if (!cancelled) {
          setLoading(false);
          setLoadError(null);
          setWorkspaceMeta(null);
          setProjects([]);
          setSummary(null);
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
        workspaceApi.getWorkspaceAssets(targetWorkspaceId, {
          project: projectFilter || undefined,
          timelineTrack: timelineTrackFilter || undefined,
          assetSearch: assetSearch || undefined,
          assetPage,
          assetPageSize: ASSET_PAGE_SIZE,
          eventPage,
          eventPageSize: EVENT_PAGE_SIZE,
          projectLimit: PROJECT_LIMIT,
        }),
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
          setSummary(assetsResult.value.data || null);
        } else {
          setSummary(null);
          errors.push(assetsResult.value.message || 'Unable to load workspace assets.');
        }
      } else {
        setSummary(null);
        errors.push(assetsResult.reason?.message || 'Unable to load workspace assets.');
      }

      setLoadError(errors.length > 0 ? errors.join(' ') : null);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    assetPage,
    assetSearch,
    eventPage,
    projectFilter,
    targetWorkspaceId,
    timelineTrackFilter,
    workspaceApi,
  ]);

  const activeProjects = useMemo(() => {
    return projects.filter((project) => {
      const status = String(project.status || '').toLowerCase();
      return status !== 'completed' && status !== 'archived' && status !== 'closed';
    }).length;
  }, [projects]);

  if (loading) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!targetWorkspaceId) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="rounded-md border border-border/70 bg-transparent p-4 text-sm text-muted-foreground">
          No workspace selected.
        </div>
      </div>
    );
  }

  const scope = summary?.scope || 'owner';
  const ownerId = summary?.ownerId || workspaceMeta?.ownerId || 'unresolved';

  const assetTotalPages = summary?.assetPagination?.totalPages || 0;
  const eventTotalPages = summary?.eventPagination?.totalPages || 0;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Workspace Analytics: {displayWorkspaceName}
          </h1>
          <p className="text-muted-foreground">
            Uses the same owner-scoped asset summary as Workspace Overview.
          </p>
        </div>
        <Link
          to={`/workspace/${targetWorkspaceId}/overview`}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
        >
          Back to Overview
        </Link>
      </div>

      {loadError ? (
        <div className="rounded-md border border-amber-300 bg-amber-100/80 px-4 py-2 text-sm text-amber-900">
          {loadError}
        </div>
      ) : null}

      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Owner scope:</span> {ownerId}
        </p>
        <p className="mt-1">
          <span className="font-semibold">Access scope:</span> {scope}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric label="Workspace Projects" value={projects.length} sub={`${activeProjects} active`} />
        <Metric
          label="Timeline Events"
          value={summary?.totalTimelineEvents || 0}
          sub="owner-scoped"
        />
        <Metric
          label="Unique Linked Assets"
          value={summary?.uniqueLinkedAssets || 0}
          sub={`${summary?.assetPagination?.total || 0} assets in filtered result`}
        />
        <Metric
          label="Filtered Projects"
          value={summary?.projects.length || 0}
          sub={`${trackOptions.length} active tracks`}
        />
      </div>

      <div className="bg-transparent rounded-md shadow-none p-4 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Project</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.name}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Timeline Track</label>
            <select
              value={timelineTrackFilter}
              onChange={(e) => setTimelineTrackFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All tracks</option>
              {trackOptions.map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Asset Search</label>
            <input
              value={assetSearch}
              onChange={(e) => setAssetSearch(e.target.value)}
              placeholder="Search asset ref"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setProjectFilter('');
                setTimelineTrackFilter('');
                setAssetSearch('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="bg-transparent rounded-md shadow-none p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Timeline Density</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/70">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Project
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Timeline Events
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Linked Assets
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Latest Evidence
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(summary?.projects || []).map((project) => (
                <tr key={`${project.projectName}-${project.latestEvidenceAt || 'none'}`}>
                  <td className="px-3 py-2 text-gray-900">{project.projectName}</td>
                  <td className="px-3 py-2 text-gray-900">{project.timelineEventCount}</td>
                  <td className="px-3 py-2 text-gray-900">{project.linkedAssetCount}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatTimestamp(project.latestEvidenceAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(summary?.projects || []).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No project analytics for this filter set.</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-transparent rounded-md shadow-none p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Linked Assets</h2>
            <PaginationLabel
              page={summary?.assetPagination?.page || 1}
              totalPages={assetTotalPages}
              total={summary?.assetPagination?.total || 0}
            />
          </div>

          {(summary?.assets || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No linked assets found.</p>
          ) : (
            <div className="space-y-3">
              {summary!.assets.map((asset) => (
                <div key={asset.ref} className="rounded-md border border-border/60 px-3 py-2">
                  <p className="font-medium text-gray-900 break-all">{asset.ref}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {asset.occurrences} occurrences • {asset.projects.length} projects •{' '}
                    {formatTimestamp(asset.lastSeenAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <PaginationControls
            page={summary?.assetPagination?.page || 1}
            totalPages={assetTotalPages}
            onPrev={() => setAssetPage((current) => Math.max(1, current - 1))}
            onNext={() => setAssetPage((current) => current + 1)}
          />
        </div>

        <div className="bg-transparent rounded-md shadow-none p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Timeline Evidence</h2>
            <PaginationLabel
              page={summary?.eventPagination?.page || 1}
              totalPages={eventTotalPages}
              total={summary?.eventPagination?.total || 0}
            />
          </div>

          {(summary?.recentEvents || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No timeline evidence found.</p>
          ) : (
            <div className="space-y-3">
              {summary!.recentEvents.map((event) => (
                <div key={event.id} className="rounded-md border border-border/60 px-3 py-2">
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.projectName} • {formatTimestamp(event.timestamp)} • {event.linkedAssetCount}{' '}
                    linked assets
                  </p>
                </div>
              ))}
            </div>
          )}

          <PaginationControls
            page={summary?.eventPagination?.page || 1}
            totalPages={eventTotalPages}
            onPrev={() => setEventPage((current) => Math.max(1, current - 1))}
            onNext={() => setEventPage((current) => current + 1)}
          />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="bg-transparent rounded-md shadow-none p-4">
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function PaginationLabel({ page, totalPages, total }: { page: number; totalPages: number; total: number }) {
  return (
    <p className="text-xs text-muted-foreground">
      Page {page} of {Math.max(totalPages, 1)} • {total} total
    </p>
  );
}

function PaginationControls({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const canPrev = page > 1;
  const canNext = totalPages > 0 ? page < totalPages : false;

  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        type="button"
        disabled={!canPrev}
        onClick={onPrev}
        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50"
      >
        Previous
      </button>
      <button
        type="button"
        disabled={!canNext}
        onClick={onNext}
        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
