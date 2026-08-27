/**
 * Smart-Bookmark-style tag storage + natural-language search. Since this extension
 * has no local embeddings API (no direct LLM API key exists anywhere in it — see
 * bookmark-relay-broker.ts), "semantic search" here means: the relay agent already
 * attached tags + a one-line summary to each bookmark during classification
 * (bookmark-taxonomy-service#classifyAll), and scoreSearch() ranks those plus
 * title/URL against the query with simple token-overlap scoring. It's not vector
 * search, but it means the query "recipes" can still surface a bookmark tagged
 * "cooking" even though that word never appears in its title.
 */

import { STORAGE_KEYS } from '../../shared/constants';
import type { BookmarkTagRecord, FlatBookmark } from '../../shared/types';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

export interface SearchableBookmark {
  bookmark: FlatBookmark;
  record?: BookmarkTagRecord;
}

export interface SearchResult {
  bookmark: FlatBookmark;
  tags: string[];
  summary?: string;
  score: number;
}

/**
 * Ranks `items` against `query`. Exact-substring title matches score highest, tag
 * matches next, then summary/URL token overlap. Pure function — no chrome.* calls.
 */
export function scoreSearch(query: string, items: SearchableBookmark[]): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const queryTokens = tokenize(trimmed);
  const lowerQuery = trimmed.toLowerCase();

  const results: SearchResult[] = [];

  for (const { bookmark, record } of items) {
    let score = 0;
    const title = bookmark.title || '';
    const titleLower = title.toLowerCase();
    const tags = record?.tags ?? [];
    const summary = record?.summary ?? '';

    if (titleLower.includes(lowerQuery)) score += 10;
    const titleTokens = new Set(tokenize(title));
    for (const t of queryTokens) if (titleTokens.has(t)) score += 3;

    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      if (tagLower === lowerQuery) score += 8;
      else if (queryTokens.some((t) => tagLower.includes(t))) score += 4;
    }

    const summaryTokens = new Set(tokenize(summary));
    for (const t of queryTokens) if (summaryTokens.has(t)) score += 2;

    if (bookmark.url && bookmark.url.toLowerCase().includes(lowerQuery)) score += 2;

    if (score > 0) {
      results.push({ bookmark, tags, summary: record?.summary, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

class BookmarkTaggingService {
  async getAllRecords(): Promise<Record<string, BookmarkTagRecord>> {
    const stored = await chrome.storage.local.get([STORAGE_KEYS.bookmarkTags]);
    return (
      (stored[STORAGE_KEYS.bookmarkTags] as Record<string, BookmarkTagRecord> | undefined) ?? {}
    );
  }

  async saveRecords(records: BookmarkTagRecord[]): Promise<void> {
    const existing = await this.getAllRecords();
    for (const record of records) {
      existing[record.bookmarkId] = record;
    }
    await chrome.storage.local.set({ [STORAGE_KEYS.bookmarkTags]: existing });
  }

  async search(query: string, bookmarks: FlatBookmark[]): Promise<SearchResult[]> {
    const records = await this.getAllRecords();
    const items: SearchableBookmark[] = bookmarks.map((bookmark) => ({
      bookmark,
      record: records[bookmark.id],
    }));
    return scoreSearch(query, items);
  }
}

const bookmarkTaggingService = new BookmarkTaggingService();
export default bookmarkTaggingService;
