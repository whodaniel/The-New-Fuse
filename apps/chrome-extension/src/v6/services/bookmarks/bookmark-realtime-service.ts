/**
 * Bookmark-Genie-style real-time mode: the instant a new bookmark is created,
 * classify it against the last-generated taxonomy and file it immediately. OFF by
 * default (see bookmark-settings-service's DEFAULT_BOOKMARK_SETTINGS) — nothing
 * here runs until the user explicitly opts in via BOOKMARKS_SET_REALTIME, so a
 * fresh install never surprises anyone with automatic relay calls or folder moves.
 */

import { STORAGE_KEYS } from '../../shared/constants';
import type { FolderTaxonomy } from '../../shared/types';
import { isPrivateDomain } from './bookmark-privacy-service';
import type { BookmarkRelayBroker, BookmarkRequestOptions } from './bookmark-relay-broker';
import bookmarkStoreService from './bookmark-store-service';
import bookmarkTaggingService from './bookmark-tagging-service';
import { classifyAll } from './bookmark-taxonomy-service';

export interface RealtimeDeps {
  broker: BookmarkRelayBroker;
  getBrokerOpts: () => BookmarkRequestOptions;
  getPrivateDomains: () => string[];
  onFiled?: (bookmarkId: string, path: string) => void;
  onError?: (err: Error) => void;
}

class BookmarkRealtimeService {
  private listener: ((id: string, node: chrome.bookmarks.BookmarkTreeNode) => void) | null = null;
  private deps: RealtimeDeps | null = null;

  attach(deps: RealtimeDeps): void {
    if (this.listener) return; // already attached
    this.deps = deps;
    this.listener = (_id, node) => {
      void this.handleCreated(node);
    };
    chrome.bookmarks.onCreated.addListener(this.listener);
  }

  detach(): void {
    if (this.listener) {
      chrome.bookmarks.onCreated.removeListener(this.listener);
      this.listener = null;
    }
    this.deps = null;
  }

  get isAttached(): boolean {
    return this.listener !== null;
  }

  private async handleCreated(node: chrome.bookmarks.BookmarkTreeNode): Promise<void> {
    if (!this.deps || !node.url) return; // folders don't get classified

    try {
      if (isPrivateDomain(node.url, this.deps.getPrivateDomains())) return;

      const stored = await chrome.storage.local.get([STORAGE_KEYS.bookmarkPlan]);
      const plan = stored[STORAGE_KEYS.bookmarkPlan] as { taxonomy?: FolderTaxonomy } | undefined;
      if (!plan?.taxonomy) return; // nothing to classify against until the user runs Analyze once

      const flat = {
        id: node.id,
        parentId: node.parentId || null,
        title: node.title,
        url: node.url,
        path: '',
      };
      const items = await classifyAll({
        bookmarks: [flat],
        taxonomy: plan.taxonomy,
        broker: this.deps.broker,
        brokerOpts: this.deps.getBrokerOpts(),
        batchSize: 1,
      });

      const [result] = items;
      if (!result?.proposedPath) return;

      await bookmarkStoreService.moveBookmarkToPath(node.id, result.proposedPath);

      if (result.tags?.length || result.summary) {
        await bookmarkTaggingService.saveRecords([
          {
            bookmarkId: node.id,
            tags: result.tags ?? [],
            summary: result.summary,
            updatedAt: Date.now(),
          },
        ]);
      }

      this.deps.onFiled?.(node.id, result.proposedPath);
    } catch (err) {
      this.deps?.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

const bookmarkRealtimeService = new BookmarkRealtimeService();
export default bookmarkRealtimeService;
