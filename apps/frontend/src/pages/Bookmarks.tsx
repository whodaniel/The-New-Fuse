import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { Badge } from '@/components/ui/badge';
import { GlassCard, PremiumButton, PremiumInput, PremiumSelect, StatsCard } from '@/components/ui/premium';
import { useWorkspace } from '@/hooks/useWorkspace';
import {
  bookmarksService,
  type BookmarkItem,
  type BookmarkWorkspaceMap,
} from '@/services/bookmarks.service';
import {
  BookmarkPlus,
  Copy,
  Download,
  ExternalLink,
  Import,
  Link2,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const normalizeUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString();
};

const parseTags = (value: string): string[] =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const inferTitleFromUrl = (value: string): string => {
  const normalized = normalizeUrl(value);
  if (!normalized) return '';
  if (normalized.startsWith('/')) return normalized;
  try {
    const parsed = new URL(normalized);
    return parsed.hostname;
  } catch {
    return normalized;
  }
};

const normalizeBookmark = (value: unknown, fallbackWorkspaceId: string): BookmarkItem | null => {
  const input = asRecord(value);
  if (!input) return null;

  const title = String(input.title || '').trim();
  const url = normalizeUrl(String(input.url || ''));
  if (!title || !url) return null;

  const tags = Array.isArray(input.tags)
    ? input.tags.map((entry) => String(entry || '').trim()).filter((entry) => entry.length > 0)
    : [];

  const createdAt = String(input.createdAt || new Date().toISOString());
  const updatedAt = String(input.updatedAt || createdAt);
  const workspaceId = String(input.workspaceId || fallbackWorkspaceId).trim() || fallbackWorkspaceId;

  return {
    id: String(input.id || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`),
    title,
    url,
    tags,
    note: typeof input.note === 'string' ? input.note : undefined,
    workspaceId,
    createdAt,
    updatedAt,
  };
};

const parseWorkspaceMap = (value: unknown, fallbackWorkspaceId: string): BookmarkWorkspaceMap => {
  if (Array.isArray(value)) {
    const items = value
      .map((entry) => normalizeBookmark(entry, fallbackWorkspaceId))
      .filter((entry): entry is BookmarkItem => Boolean(entry));
    return items.length > 0 ? { [fallbackWorkspaceId]: items } : {};
  }

  const input = asRecord(value);
  if (!input) return {};

  const result: BookmarkWorkspaceMap = {};
  Object.entries(input).forEach(([workspaceId, entries]) => {
    if (!Array.isArray(entries)) return;
    const normalized = entries
      .map((entry) => normalizeBookmark(entry, workspaceId || fallbackWorkspaceId))
      .filter((entry): entry is BookmarkItem => Boolean(entry));
    if (normalized.length > 0) {
      result[workspaceId || fallbackWorkspaceId] = normalized;
    }
  });

  return result;
};

const mergeItems = (primary: BookmarkItem[], secondary: BookmarkItem[]): BookmarkItem[] => {
  const map = new Map<string, BookmarkItem>();

  [...primary, ...secondary].forEach((item) => {
    const key = item.id || `${item.workspaceId}:${item.url}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
      return;
    }

    const existingUpdatedAt = new Date(existing.updatedAt).getTime();
    const candidateUpdatedAt = new Date(item.updatedAt).getTime();
    map.set(key, candidateUpdatedAt >= existingUpdatedAt ? item : existing);
  });

  return [...map.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

const upsertBookmarkInMap = (
  sourceMap: BookmarkWorkspaceMap,
  workspaceId: string,
  bookmark: BookmarkItem
): BookmarkWorkspaceMap => {
  const existing = sourceMap[workspaceId] || [];
  const sameIdIndex = existing.findIndex((entry) => entry.id === bookmark.id);
  const sameUrlIndex =
    sameIdIndex === -1
      ? existing.findIndex((entry) => entry.url.toLowerCase() === bookmark.url.toLowerCase())
      : -1;

  const nextWorkspace = [...existing];
  if (sameIdIndex >= 0) {
    nextWorkspace[sameIdIndex] = bookmark;
  } else if (sameUrlIndex >= 0) {
    nextWorkspace[sameUrlIndex] = bookmark;
  } else {
    nextWorkspace.unshift(bookmark);
  }

  return {
    ...sourceMap,
    [workspaceId]: mergeItems(nextWorkspace, []),
  };
};

type SyncState = 'syncing' | 'synced' | 'error';

export default function BookmarksPage() {
  const { currentWorkspace, workspaces } = useWorkspace();
  const [bookmarksByWorkspace, setBookmarksByWorkspace] = useState<BookmarkWorkspaceMap>({});
  const [syncState, setSyncState] = useState<SyncState>('syncing');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [note, setNote] = useState('');

  const [scope, setScope] = useState<'current' | 'all' | string>('current');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentWorkspaceId = currentWorkspace?.id || workspaces[0]?.id || '';

  const refreshBookmarks = useCallback(async () => {
    setSyncState('syncing');
    try {
      const map = await bookmarksService.getAllWorkspaceBookmarks();
      setBookmarksByWorkspace(map);
      setSyncState('synced');
      return map;
    } catch {
      setSyncState('error');
      throw new Error('Failed to sync bookmarks');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      setLoading(true);
      try {
        const map = await bookmarksService.getAllWorkspaceBookmarks();
        if (cancelled) return;
        setBookmarksByWorkspace(map);
        setSyncState('synced');
      } catch {
        if (cancelled) return;
        setSyncState('error');
        toast.error('Failed to load bookmarks');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const workspaceLabelById = useMemo(() => {
    const map = new Map<string, string>();
    workspaces.forEach((workspace) => map.set(workspace.id, workspace.name));
    return map;
  }, [workspaces]);

  const scopeWorkspaceId = scope === 'current' ? currentWorkspaceId : scope === 'all' ? 'all' : scope;

  const allBookmarks = useMemo(
    () =>
      Object.values(bookmarksByWorkspace)
        .flat()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [bookmarksByWorkspace]
  );

  const visibleBookmarks = useMemo(() => {
    const candidate =
      scopeWorkspaceId === 'all' ? allBookmarks : bookmarksByWorkspace[scopeWorkspaceId] || [];

    if (!search.trim()) return candidate;

    const needle = search.trim().toLowerCase();
    return candidate.filter((bookmark) =>
      [bookmark.title, bookmark.url, bookmark.note || '', ...bookmark.tags]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [allBookmarks, bookmarksByWorkspace, scopeWorkspaceId, search]);

  const scopeOptions = useMemo(
    () => [
      {
        value: 'current',
        label: `Current (${workspaceLabelById.get(currentWorkspaceId) || 'Workspace'})`,
      },
      { value: 'all', label: 'All Workspaces' },
      ...workspaces.map((workspace) => ({ value: workspace.id, label: workspace.name })),
    ],
    [currentWorkspaceId, workspaceLabelById, workspaces]
  );

  const addBookmark = async () => {
    if (!currentWorkspaceId) {
      toast.error('Select or create a workspace first.');
      return;
    }

    const normalizedUrl = normalizeUrl(url);
    const normalizedTitle = title.trim() || inferTitleFromUrl(normalizedUrl);
    if (!normalizedTitle || !normalizedUrl) {
      toast.error('Title and URL are required.');
      return;
    }

    const existing = bookmarksByWorkspace[currentWorkspaceId] || [];
    if (existing.some((bookmark) => bookmark.url.toLowerCase() === normalizedUrl.toLowerCase())) {
      toast.error('This URL already exists in the current workspace.');
      return;
    }

    setSyncState('syncing');
    try {
      const created = await bookmarksService.addWorkspaceBookmark(currentWorkspaceId, {
        title: normalizedTitle,
        url: normalizedUrl,
        tags: parseTags(tagsInput),
        note: note.trim() || undefined,
      });
      setBookmarksByWorkspace((previous) =>
        upsertBookmarkInMap(previous, currentWorkspaceId, created)
      );
      setSyncState('synced');
      setTitle('');
      setUrl('');
      setTagsInput('');
      setNote('');
      toast.success('Bookmark saved');
    } catch (error) {
      setSyncState('error');
      toast.error((error as Error).message || 'Failed to save bookmark');
    }
  };

  const removeBookmark = async (workspaceId: string, bookmarkId: string) => {
    setSyncState('syncing');
    try {
      await bookmarksService.removeWorkspaceBookmark(workspaceId, bookmarkId);
      setBookmarksByWorkspace((previous) => {
        const current = previous[workspaceId] || [];
        const nextItems = current.filter((bookmark) => bookmark.id !== bookmarkId);
        const nextMap = { ...previous };
        if (nextItems.length > 0) {
          nextMap[workspaceId] = nextItems;
        } else {
          delete nextMap[workspaceId];
        }
        return nextMap;
      });
      setSyncState('synced');
      toast.success('Bookmark removed');
    } catch (error) {
      setSyncState('error');
      toast.error((error as Error).message || 'Failed to remove bookmark');
    }
  };

  const copyBookmark = async (bookmarkUrl: string) => {
    try {
      await navigator.clipboard.writeText(bookmarkUrl);
      toast.success('Link copied');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const exportBookmarks = () => {
    if (typeof window === 'undefined') return;
    const payload = {
      exportedAt: new Date().toISOString(),
      bookmarksByWorkspace,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tnf-bookmarks-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importBookmarks = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const fallbackWorkspace = currentWorkspaceId || workspaces[0]?.id || '';
      if (!fallbackWorkspace) {
        toast.error('Create a workspace before importing bookmarks.');
        return;
      }

      const importedMap = parseWorkspaceMap(asRecord(parsed)?.bookmarksByWorkspace || parsed, fallbackWorkspace);
      if (Object.keys(importedMap).length === 0) {
        toast.error('No valid bookmarks found in import file.');
        return;
      }

      setSyncState('syncing');
      let nextMap = { ...bookmarksByWorkspace };
      let importedCount = 0;
      let failedCount = 0;

      for (const [workspaceId, items] of Object.entries(importedMap)) {
        for (const item of items) {
          try {
            const created = await bookmarksService.addWorkspaceBookmark(workspaceId, {
              title: item.title,
              url: item.url,
              tags: item.tags,
              note: item.note,
            });
            importedCount += 1;
            nextMap = upsertBookmarkInMap(nextMap, workspaceId, created);
          } catch {
            failedCount += 1;
          }
        }
      }

      setBookmarksByWorkspace(nextMap);
      setSyncState(failedCount > 0 ? 'error' : 'synced');

      if (importedCount > 0 && failedCount === 0) {
        toast.success(`Imported ${importedCount} bookmarks`);
      } else if (importedCount > 0) {
        toast.success(`Imported ${importedCount} bookmarks (${failedCount} failed)`);
      } else {
        toast.error('Import failed');
      }
    } catch {
      toast.error('Failed to import bookmarks file.');
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const syncLabel =
    syncState === 'synced' ? 'Synced' : syncState === 'syncing' ? 'Syncing' : 'Sync Error';

  return (
    <div className="space-y-6">
      <OpsPageHeader
        eyebrow="Workspace"
        title="Bookmarks"
        subtitle="Workspace-aware quick links with live workspace bookmark persistence."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
              {allBookmarks.length} total
            </Badge>
            <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20">
              {visibleBookmarks.length} visible
            </Badge>
            <Badge
              className={
                syncState === 'synced'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : syncState === 'syncing'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
              }
            >
              {syncLabel}
            </Badge>
          </div>
        }
        actions={
          <>
            <PremiumButton size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Import className="w-4 h-4" />
              Import
            </PremiumButton>
            <PremiumButton size="sm" variant="outline" onClick={exportBookmarks}>
              <Download className="w-4 h-4" />
              Export
            </PremiumButton>
            <PremiumButton
              size="sm"
              variant="gradient"
              onClick={() => {
                void (async () => {
                  try {
                    await refreshBookmarks();
                  } catch {
                    toast.error('Failed to refresh bookmarks');
                  }
                })();
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Sync
            </PremiumButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard label="Total Bookmarks" value={allBookmarks.length} icon={Link2} gradient="blue" />
        <StatsCard label="Scoped View" value={visibleBookmarks.length} icon={Search} gradient="purple" />
        <StatsCard
          label="Workspace Buckets"
          value={Object.keys(bookmarksByWorkspace).length}
          icon={BookmarkPlus}
          gradient="green"
        />
      </div>

      <GlassCard className="p-4 space-y-4" hover={false}>
        <h2 className="text-lg font-semibold text-white">Add Bookmark</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <PremiumInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
          <PremiumInput
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://... or /internal/route"
          />
          <PremiumInput
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="Tags (comma-separated)"
          />
          <PremiumInput
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <p className="text-xs text-slate-400">
            New bookmark will be stored under:{' '}
            {workspaceLabelById.get(currentWorkspaceId) || 'Select a workspace'}
          </p>
          <PremiumButton size="sm" variant="gradient" onClick={addBookmark}>
            <BookmarkPlus className="w-4 h-4" />
            Save Bookmark
          </PremiumButton>
        </div>
      </GlassCard>

      <GlassCard className="p-4 space-y-4" hover={false}>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3">
          <PremiumInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            icon={Search}
            iconPosition="left"
            placeholder="Search title, URL, note, or tags..."
          />
          <PremiumSelect
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            options={scopeOptions}
          />
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden" hover={false}>
        {loading ? (
          <div className="py-14 text-center text-slate-400">Loading bookmarks...</div>
        ) : visibleBookmarks.length === 0 ? (
          <div className="py-14 text-center text-slate-400">No bookmarks found for this view.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {visibleBookmarks.map((bookmark) => (
              <li key={`${bookmark.workspaceId}:${bookmark.id}`} className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{bookmark.title}</p>
                      <p className="text-xs text-slate-300 truncate mt-1">{bookmark.url}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      <Badge variant="secondary">
                        {workspaceLabelById.get(bookmark.workspaceId) || bookmark.workspaceId}
                      </Badge>
                      <Badge variant="outline">{formatDate(bookmark.updatedAt)}</Badge>
                    </div>
                  </div>

                  {bookmark.note ? <p className="text-sm text-slate-300">{bookmark.note}</p> : null}

                  {bookmark.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {bookmark.tags.map((tag) => (
                        <Badge key={`${bookmark.id}-${tag}`} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <a href={bookmark.url} target="_blank" rel="noreferrer">
                      <PremiumButton size="sm" variant="outline">
                        <ExternalLink className="w-4 h-4" />
                        Open
                      </PremiumButton>
                    </a>
                    <PremiumButton
                      size="sm"
                      variant="ghost"
                      onClick={() => void copyBookmark(bookmark.url)}
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </PremiumButton>
                    <PremiumButton
                      size="sm"
                      variant="danger"
                      onClick={() => void removeBookmark(bookmark.workspaceId, bookmark.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </PremiumButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => void importBookmarks(event)}
      />
    </div>
  );
}
