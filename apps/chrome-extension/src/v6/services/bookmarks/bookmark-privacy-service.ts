/**
 * Smart-Bookmark-style privacy guard: a user-maintained list of "private domains"
 * that are excluded from every outbound relay request — batch Analyze, real-time
 * auto-file, and search-index tagging alike. Pure functions, no chrome.* calls, so
 * they're trivially unit-testable.
 */

import type { FlatBookmark } from '../../shared/types';

function extractHostname(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

/** True if `url`'s hostname exactly matches, or is a subdomain of, any entry in `privateDomains`. */
export function isPrivateDomain(url: string | undefined, privateDomains: string[]): boolean {
  const hostname = extractHostname(url);
  if (!hostname) return false;

  const normalized = privateDomains.map(normalizeDomain).filter(Boolean);
  return normalized.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

export interface FilterBookmarksResult {
  included: FlatBookmark[];
  excluded: FlatBookmark[];
}

/** Splits `bookmarks` into those safe to send to a relay agent and those excluded by privacy settings. */
export function filterBookmarks(
  bookmarks: FlatBookmark[],
  privateDomains: string[]
): FilterBookmarksResult {
  const included: FlatBookmark[] = [];
  const excluded: FlatBookmark[] = [];

  for (const bookmark of bookmarks) {
    if (bookmark.url && isPrivateDomain(bookmark.url, privateDomains)) {
      excluded.push(bookmark);
    } else {
      included.push(bookmark);
    }
  }

  return { included, excluded };
}
