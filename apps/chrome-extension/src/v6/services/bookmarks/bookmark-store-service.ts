/**
 * The only module in the bookmark organizer that touches `chrome.bookmarks.*`.
 * Every other bookmark service (taxonomy, tagging, privacy, realtime) works with
 * plain `FlatBookmark[]`/`BookmarkPlan` data and never imports this file's chrome
 * calls directly — that split is what keeps the dedupe/diff logic unit-testable
 * without mocking the extension APIs.
 *
 * Non-destructive by design: everything this organizer creates lives under one
 * clearly-labeled root folder ("AI Organized", created under Other Bookmarks the
 * first time it's needed). Existing folders/bookmarks outside that root are never
 * touched by applyPlan, and every apply is preceded by a snapshot that undoLast()
 * can fully reverse.
 */

import { STORAGE_KEYS } from '../../shared/constants';
import type {
  BookmarkDuplicateGroup,
  BookmarkPlan,
  BookmarkSnapshot,
  BookmarkSnapshotEntry,
  FlatBookmark,
} from '../../shared/types';

export const ORGANIZED_ROOT_TITLE = 'AI Organized';
/** "Other Bookmarks" in Chrome's default bookmark tree. */
const DEFAULT_PARENT_ID = '2';

// ---------------------------------------------------------------------------
// Pure helpers (no chrome.* calls) — unit-testable in isolation.
// ---------------------------------------------------------------------------

/** Normalizes a URL for duplicate-detection: strips trailing slash, hash, and common tracking noise. */
export function normalizeUrlForDedupe(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    let path = u.pathname.replace(/\/+$/, '');
    return `${u.protocol}//${u.hostname}${path}${u.search}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

/** Flattens a `chrome.bookmarks.getTree()` result into `FlatBookmark[]` with human-readable paths. */
export function flattenBookmarkTree(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  parentPath = ''
): FlatBookmark[] {
  const out: FlatBookmark[] = [];

  for (const node of nodes) {
    const isFolder = !node.url;
    const path = parentPath;

    if (!isFolder) {
      out.push({
        id: node.id,
        parentId: node.parentId || null,
        title: node.title,
        url: node.url,
        dateAdded: node.dateAdded,
        path,
      });
    }

    if (node.children && node.children.length) {
      const childPath = parentPath ? `${parentPath}/${node.title}` : node.title;
      out.push(...flattenBookmarkTree(node.children, isFolder ? childPath : parentPath));
    }
  }

  return out;
}

/** Groups bookmarks that resolve to the same normalized URL. Singletons are omitted. */
export function computeDuplicates(bookmarks: FlatBookmark[]): BookmarkDuplicateGroup[] {
  const byUrl = new Map<string, string[]>();

  for (const b of bookmarks) {
    if (!b.url) continue;
    const key = normalizeUrlForDedupe(b.url);
    const list = byUrl.get(key) || [];
    list.push(b.id);
    byUrl.set(key, list);
  }

  const groups: BookmarkDuplicateGroup[] = [];
  for (const [, ids] of byUrl.entries()) {
    if (ids.length > 1) {
      const first = bookmarks.find((b) => b.id === ids[0]);
      groups.push({ url: first?.url || '', bookmarkIds: ids });
    }
  }
  return groups;
}

export interface BookmarkSummary {
  totalBookmarks: number;
  totalFolders: number;
  maxDepth: number;
  duplicateCount: number;
  topLevelFolders: string[];
  lastAnalyzedAt: number | null;
}

/** Pure summary computation given a flattened bookmark list + the raw tree (for folder/depth counts). */
export function computeSummary(
  bookmarks: FlatBookmark[],
  tree: chrome.bookmarks.BookmarkTreeNode[],
  lastAnalyzedAt: number | null
): BookmarkSummary {
  let totalFolders = 0;
  let maxDepth = 0;
  const topLevelFolders: string[] = [];

  const walk = (nodes: chrome.bookmarks.BookmarkTreeNode[], depth: number, top: boolean) => {
    for (const node of nodes) {
      if (!node.url) {
        totalFolders++;
        maxDepth = Math.max(maxDepth, depth);
        if (top && node.title) topLevelFolders.push(node.title);
      }
      if (node.children) walk(node.children, depth + 1, false);
    }
  };
  // tree[0] is the invisible root; its children (Bookmarks Bar, Other Bookmarks, ...) are "top level".
  for (const rootChild of tree) {
    if (rootChild.children) walk(rootChild.children, 1, true);
  }

  return {
    totalBookmarks: bookmarks.length,
    totalFolders,
    maxDepth,
    duplicateCount: computeDuplicates(bookmarks).length,
    topLevelFolders,
    lastAnalyzedAt,
  };
}

// ---------------------------------------------------------------------------
// chrome.bookmarks-backed service
// ---------------------------------------------------------------------------

class BookmarkStoreService {
  private folderIdCache = new Map<string, string>();

  async readAllBookmarks(): Promise<FlatBookmark[]> {
    const tree = await chrome.bookmarks.getTree();
    return flattenBookmarkTree(tree);
  }

  async getSummary(): Promise<BookmarkSummary> {
    const tree = await chrome.bookmarks.getTree();
    const bookmarks = flattenBookmarkTree(tree);
    const stored = await chrome.storage.local.get([STORAGE_KEYS.bookmarkPlan]);
    const plan = stored[STORAGE_KEYS.bookmarkPlan] as BookmarkPlan | undefined;
    return computeSummary(bookmarks, tree, plan?.generatedAt ?? null);
  }

  async findDuplicates(): Promise<BookmarkDuplicateGroup[]> {
    const bookmarks = await this.readAllBookmarks();
    return computeDuplicates(bookmarks);
  }

  async getStoredPlan(): Promise<BookmarkPlan | null> {
    const stored = await chrome.storage.local.get([STORAGE_KEYS.bookmarkPlan]);
    return (stored[STORAGE_KEYS.bookmarkPlan] as BookmarkPlan | undefined) ?? null;
  }

  async savePlan(plan: BookmarkPlan): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.bookmarkPlan]: plan });
  }

  /** Finds (or creates) the folder at `path` under the "AI Organized" root, creating intermediate folders. */
  private async ensureFolderPath(path: string, createdFolderIds: string[]): Promise<string> {
    if (this.folderIdCache.has(path)) return this.folderIdCache.get(path)!;

    const rootId = await this.ensureOrganizedRoot(createdFolderIds);
    if (!path) return rootId;

    const segments = path.split('/').filter(Boolean);
    let parentId = rootId;
    let builtPath = '';

    for (const segment of segments) {
      builtPath = builtPath ? `${builtPath}/${segment}` : segment;
      if (this.folderIdCache.has(builtPath)) {
        parentId = this.folderIdCache.get(builtPath)!;
        continue;
      }

      const children = await chrome.bookmarks.getChildren(parentId);
      const existing = children.find((c) => !c.url && c.title === segment);
      if (existing) {
        parentId = existing.id;
      } else {
        const created = await chrome.bookmarks.create({ parentId, title: segment });
        createdFolderIds.push(created.id);
        parentId = created.id;
      }
      this.folderIdCache.set(builtPath, parentId);
    }

    return parentId;
  }

  private async ensureOrganizedRoot(createdFolderIds: string[]): Promise<string> {
    const cacheKey = '__root__';
    if (this.folderIdCache.has(cacheKey)) return this.folderIdCache.get(cacheKey)!;

    const children = await chrome.bookmarks.getChildren(DEFAULT_PARENT_ID);
    const existing = children.find((c) => !c.url && c.title === ORGANIZED_ROOT_TITLE);
    let rootId: string;
    if (existing) {
      rootId = existing.id;
    } else {
      const created = await chrome.bookmarks.create({
        parentId: DEFAULT_PARENT_ID,
        title: ORGANIZED_ROOT_TITLE,
      });
      createdFolderIds.push(created.id);
      rootId = created.id;
    }
    this.folderIdCache.set(cacheKey, rootId);
    return rootId;
  }

  /**
   * Moves a single bookmark into `path` under the organized root, creating any
   * missing intermediate folders. Used by bookmark-realtime-service for one-off
   * filing of a newly-created bookmark, outside the batch applyPlan() flow.
   */
  async moveBookmarkToPath(bookmarkId: string, path: string): Promise<void> {
    const snapshot = await this.getSnapshot();
    const createdFolderIds: string[] = snapshot?.createdFolderIds ?? [];
    const folderId = await this.ensureFolderPath(path, createdFolderIds);
    await chrome.bookmarks.move(bookmarkId, { parentId: folderId });
    if (snapshot) {
      snapshot.createdFolderIds = createdFolderIds;
      await chrome.storage.local.set({ [STORAGE_KEYS.bookmarkSnapshot]: snapshot });
    }
  }

  /** Records current locations of every bookmark the plan will move, before any mutation. */
  async snapshotBeforeApply(plan: BookmarkPlan): Promise<BookmarkSnapshot> {
    const entries: BookmarkSnapshotEntry[] = [];
    for (const item of plan.items) {
      if (!item.proposedPath || item.selected === false) continue;
      try {
        const [node] = await chrome.bookmarks.get(item.bookmarkId);
        entries.push({
          bookmarkId: item.bookmarkId,
          parentId: node.parentId || null,
          title: node.title,
          index: node.index,
        });
      } catch {
        // Bookmark was removed/moved out from under us since the plan was generated; skip it.
      }
    }

    const snapshot: BookmarkSnapshot = {
      id: `snap-${Date.now()}`,
      createdAt: Date.now(),
      entries,
      createdFolderIds: [],
    };
    await chrome.storage.local.set({ [STORAGE_KEYS.bookmarkSnapshot]: snapshot });
    return snapshot;
  }

  /**
   * Applies a plan's proposed moves. Only ever calls chrome.bookmarks.create (for
   * new folders under the organized root) and chrome.bookmarks.move — never
   * `remove`, preserving every bookmark's identity for a clean Undo.
   */
  async applyPlan(plan: BookmarkPlan): Promise<{ moved: number; skipped: number }> {
    this.folderIdCache.clear();
    const snapshot = await this.getSnapshot();
    const createdFolderIds: string[] = snapshot?.createdFolderIds ?? [];

    let moved = 0;
    let skipped = 0;

    for (const item of plan.items) {
      if (!item.proposedPath || item.selected === false) {
        skipped++;
        continue;
      }
      try {
        const folderId = await this.ensureFolderPath(item.proposedPath, createdFolderIds);
        await chrome.bookmarks.move(item.bookmarkId, { parentId: folderId });
        moved++;
      } catch (err) {
        console.warn('[BookmarkStoreService] Failed to move bookmark', item.bookmarkId, err);
        skipped++;
      }
    }

    if (snapshot) {
      snapshot.createdFolderIds = createdFolderIds;
      await chrome.storage.local.set({ [STORAGE_KEYS.bookmarkSnapshot]: snapshot });
    }

    return { moved, skipped };
  }

  private async getSnapshot(): Promise<BookmarkSnapshot | null> {
    const stored = await chrome.storage.local.get([STORAGE_KEYS.bookmarkSnapshot]);
    return (stored[STORAGE_KEYS.bookmarkSnapshot] as BookmarkSnapshot | undefined) ?? null;
  }

  /** Reverses the most recent applyPlan(): restores original parents, then prunes emptied AI-created folders. */
  async undoLast(): Promise<{ restored: number }> {
    const snapshot = await this.getSnapshot();
    if (!snapshot) return { restored: 0 };

    let restored = 0;
    for (const entry of snapshot.entries) {
      if (!entry.parentId) continue;
      try {
        await chrome.bookmarks.move(entry.bookmarkId, {
          parentId: entry.parentId,
          index: entry.index,
        });
        restored++;
      } catch (err) {
        console.warn('[BookmarkStoreService] Failed to restore bookmark', entry.bookmarkId, err);
      }
    }

    // Remove any folders the apply created, deepest-first, only if now empty — never touch
    // folders that predate this organizer or still contain something.
    const foldersDeepestFirst = [...snapshot.createdFolderIds].reverse();
    for (const folderId of foldersDeepestFirst) {
      try {
        const children = await chrome.bookmarks.getChildren(folderId);
        if (children.length === 0) {
          await chrome.bookmarks.remove(folderId);
        }
      } catch {
        // Already removed or non-empty; leave it alone.
      }
    }

    this.folderIdCache.clear();
    await chrome.storage.local.remove([STORAGE_KEYS.bookmarkSnapshot]);
    return { restored };
  }
}

const bookmarkStoreService = new BookmarkStoreService();
export default bookmarkStoreService;
