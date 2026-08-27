/**
 * Two-phase AI Bookmark Organizer-style orchestrator: phase 1 asks the relay agent
 * to propose ONE unified folder taxonomy for the whole library (preventing the
 * duplicate/overlapping categories that per-item classification alone produces),
 * phase 2 classifies bookmarks into it in small resumable batches (Bookmark
 * Genie-style interruptibility). This module only ever talks to a
 * `BookmarkRelayBroker` — never to chrome.bookmarks directly — so it stays testable
 * with a stub broker.
 *
 * There's no local embeddings API anywhere in this extension, so "semantic search"
 * for the Smart-Bookmark-style feature comes from the agent also returning tags +
 * a one-line summary per bookmark during classification (see BOOKMARKS_SEARCH /
 * bookmark-tagging-service), not from locally computed vectors.
 */

import type {
  BookmarkGranularity,
  BookmarkPlanItem,
  FlatBookmark,
  FolderTaxonomy,
  TaxonomyFolder,
} from '../../shared/types';
import type { BookmarkRelayBroker, BookmarkRequestOptions } from './bookmark-relay-broker';

const GRANULARITY_GUIDANCE: Record<BookmarkGranularity, string> = {
  compact:
    'Prefer a small number of broad top-level folders (roughly 5-10 total), minimal nesting.',
  balanced: 'A moderate folder tree, up to two levels deep, grouping by topic and sub-topic.',
  detailed:
    'A fuller, more specific folder tree, up to three levels deep where it genuinely helps.',
};

/** Caps how many bookmarks are sent in the single taxonomy-generation request. */
const MAX_TAXONOMY_SAMPLE = 400;

function sampleForTaxonomy(bookmarks: FlatBookmark[]): FlatBookmark[] {
  if (bookmarks.length <= MAX_TAXONOMY_SAMPLE) return bookmarks;
  // Even stride sample so the proposal still reflects the whole library, not just the first N.
  const stride = bookmarks.length / MAX_TAXONOMY_SAMPLE;
  const sample: FlatBookmark[] = [];
  for (let i = 0; i < MAX_TAXONOMY_SAMPLE; i++) {
    sample.push(bookmarks[Math.floor(i * stride)]);
  }
  return sample;
}

/** Strips ```json fences agents commonly wrap replies in, then JSON.parse()s the rest. */
function parseJsonLoose(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : content).trim();
  return JSON.parse(raw);
}

export class TaxonomyResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaxonomyResponseError';
  }
}

export async function generateTaxonomy(
  bookmarks: FlatBookmark[],
  granularity: BookmarkGranularity,
  broker: BookmarkRelayBroker,
  brokerOpts: BookmarkRequestOptions = {}
): Promise<FolderTaxonomy> {
  const sample = sampleForTaxonomy(bookmarks);
  const payload = {
    instruction:
      'Propose ONE unified folder taxonomy for organizing these browser bookmarks. ' +
      GRANULARITY_GUIDANCE[granularity] +
      ' Every folder path should be genuinely distinct — do not propose overlapping or duplicate ' +
      'categories. Reply with ONLY a JSON object: {"folders":[{"name":"...","path":"Parent/Child",' +
      '"description":"..."}]}. Use "/" to express nesting in "path".',
    granularity,
    bookmarkCount: bookmarks.length,
    sampled: sample.length < bookmarks.length,
    bookmarks: sample.map((b) => ({ id: b.id, title: b.title, url: b.url })),
  };

  const reply = await broker.requestWithRetry('generate-taxonomy', payload, brokerOpts);

  let parsed: unknown;
  try {
    parsed = parseJsonLoose(reply.content);
  } catch {
    throw new TaxonomyResponseError('Agent reply was not valid JSON for the taxonomy request.');
  }

  const folders = (parsed as { folders?: unknown })?.folders;
  if (!Array.isArray(folders) || folders.length === 0) {
    throw new TaxonomyResponseError('Agent reply did not contain a non-empty "folders" array.');
  }

  const cleanFolders: TaxonomyFolder[] = folders
    .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
    .map((f) => ({
      name: String(f.name ?? f.path ?? '').trim(),
      path: String(f.path ?? f.name ?? '').trim(),
      description: typeof f.description === 'string' ? f.description : undefined,
    }))
    .filter((f) => f.path.length > 0);

  if (cleanFolders.length === 0) {
    throw new TaxonomyResponseError('Agent reply\'s "folders" array had no usable entries.');
  }

  return {
    id: `tax-${Date.now()}`,
    generatedAt: Date.now(),
    granularity,
    folders: cleanFolders,
  };
}

const DEFAULT_BATCH_SIZE = 50;

export interface ClassifyAllParams {
  /** Bookmarks still needing classification (caller slices off anything before a resume cursor). */
  bookmarks: FlatBookmark[];
  taxonomy: FolderTaxonomy;
  broker: BookmarkRelayBroker;
  brokerOpts?: BookmarkRequestOptions;
  batchSize?: number;
  /** Absolute index (into the *original* full bookmark list) the first item in `bookmarks` represents. */
  startCursor?: number;
  onProgress?: (update: {
    items: BookmarkPlanItem[];
    cursor: number;
    totalWithOffset: number;
  }) => void;
  shouldCancel?: () => boolean;
  batchDelayMs?: number;
}

function classifyBatchPayload(batch: FlatBookmark[], taxonomy: FolderTaxonomy) {
  return {
    instruction:
      'Classify each of these bookmarks into the closest existing folder path from "taxonomy". ' +
      "If none fit well, you may propose a new path consistent with the taxonomy's style. Also return " +
      '3-8 short tags and a one-sentence summary per bookmark (inferred from the title/URL only). Reply ' +
      'with ONLY a JSON array: [{"id":"...","path":"Parent/Child","tags":["..."],"summary":"..."}].',
    taxonomy: taxonomy.folders,
    items: batch.map((b) => ({ id: b.id, title: b.title, url: b.url })),
  };
}

interface ClassifyReplyItem {
  id: string;
  path?: string;
  tags?: string[];
  summary?: string;
}

function parseClassifyReply(content: string): ClassifyReplyItem[] {
  let parsed: unknown;
  try {
    parsed = parseJsonLoose(content);
  } catch {
    throw new TaxonomyResponseError('Agent reply was not valid JSON for a classify-batch request.');
  }
  if (!Array.isArray(parsed)) {
    throw new TaxonomyResponseError('Agent reply for classify-batch was not a JSON array.');
  }
  return parsed
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      id: String(item.id ?? ''),
      path: typeof item.path === 'string' ? item.path : undefined,
      tags: Array.isArray(item.tags) ? item.tags.map((t) => String(t)) : undefined,
      summary: typeof item.summary === 'string' ? item.summary : undefined,
    }))
    .filter((item) => item.id.length > 0);
}

/**
 * Classifies `bookmarks` into `taxonomy` in batches, calling `onProgress` after each
 * successful batch so the caller can persist a resume cursor and push live UI
 * updates. Stops early (without throwing) if `shouldCancel()` returns true between
 * batches — Bookmark Genie's "interruptible batch job" behavior.
 */
export async function classifyAll(params: ClassifyAllParams): Promise<BookmarkPlanItem[]> {
  const batchSize = params.batchSize ?? DEFAULT_BATCH_SIZE;
  const startCursor = params.startCursor ?? 0;
  const items: BookmarkPlanItem[] = [];

  for (let i = 0; i < params.bookmarks.length; i += batchSize) {
    if (params.shouldCancel?.()) break;

    const batch = params.bookmarks.slice(i, i + batchSize);
    const payload = classifyBatchPayload(batch, params.taxonomy);
    const reply = await params.broker.requestWithRetry(
      'classify-batch',
      payload,
      params.brokerOpts ?? {}
    );
    const parsed = parseClassifyReply(reply.content);
    const byId = new Map(parsed.map((p) => [p.id, p]));

    for (const bookmark of batch) {
      const match = byId.get(bookmark.id);
      items.push({
        bookmarkId: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        currentPath: bookmark.path,
        proposedPath: match?.path,
        isNewFolder: !!match?.path && !params.taxonomy.folders.some((f) => f.path === match.path),
        tags: match?.tags,
        summary: match?.summary,
        selected: true,
      });
    }

    const cursor = startCursor + i + batch.length;
    params.onProgress?.({
      items: [...items],
      cursor,
      totalWithOffset: startCursor + params.bookmarks.length,
    });

    if (params.batchDelayMs && i + batchSize < params.bookmarks.length) {
      await new Promise((r) => setTimeout(r, params.batchDelayMs));
    }
  }

  return items;
}

/** MyMind-style: no folder moves at all — every item is left in place (proposedPath omitted). */
export function zeroFolderPlanItems(bookmarks: FlatBookmark[]): BookmarkPlanItem[] {
  return bookmarks.map((b) => ({
    bookmarkId: b.id,
    title: b.title,
    url: b.url,
    currentPath: b.path,
    selected: false,
  }));
}
