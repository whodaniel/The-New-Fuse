/**
 * Only the pure, chrome.bookmarks-free parts of bookmark-store-service — the split
 * that keeps dedupe/tree-flattening logic testable without mocking the extension
 * APIs.
 */

import type { FlatBookmark } from '../../../shared/types';
import {
  computeDuplicates,
  computeSummary,
  flattenBookmarkTree,
  normalizeUrlForDedupe,
} from '../bookmark-store-service';

describe('normalizeUrlForDedupe', () => {
  it('treats a trailing slash and no trailing slash as the same URL', () => {
    expect(normalizeUrlForDedupe('https://example.com/page/')).toBe(
      normalizeUrlForDedupe('https://example.com/page')
    );
  });

  it('ignores the hash fragment', () => {
    expect(normalizeUrlForDedupe('https://example.com/page#section')).toBe(
      normalizeUrlForDedupe('https://example.com/page')
    );
  });

  it('is case-insensitive on scheme and host', () => {
    expect(normalizeUrlForDedupe('HTTPS://Example.com/Page')).toBe(
      normalizeUrlForDedupe('https://example.com/Page')
    );
  });

  it('treats different query strings as different URLs', () => {
    expect(normalizeUrlForDedupe('https://example.com/page?a=1')).not.toBe(
      normalizeUrlForDedupe('https://example.com/page?a=2')
    );
  });
});

function node(
  overrides: Partial<chrome.bookmarks.BookmarkTreeNode> = {}
): chrome.bookmarks.BookmarkTreeNode {
  return { id: '1', title: 'Untitled', ...overrides } as chrome.bookmarks.BookmarkTreeNode;
}

describe('flattenBookmarkTree', () => {
  it('flattens nested folders into bookmarks with human-readable paths', () => {
    const tree = [
      node({
        id: '0',
        title: '',
        children: [
          node({
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              node({ id: '2', title: 'Google', url: 'https://google.com' }),
              node({
                id: '3',
                title: 'Dev',
                children: [node({ id: '4', title: 'MDN', url: 'https://developer.mozilla.org' })],
              }),
            ],
          }),
        ],
      }),
    ];

    const flat = flattenBookmarkTree(tree);
    expect(flat).toHaveLength(2);
    expect(flat.find((b) => b.id === '2')?.path).toBe('Bookmarks Bar');
    expect(flat.find((b) => b.id === '4')?.path).toBe('Bookmarks Bar/Dev');
  });

  it('excludes folders themselves from the flattened output', () => {
    const tree = [node({ id: '1', title: 'Empty Folder', children: [] })];
    expect(flattenBookmarkTree(tree)).toHaveLength(0);
  });
});

function flatBm(id: string, url: string, path = ''): FlatBookmark {
  return { id, parentId: '1', title: id, url, path };
}

describe('computeDuplicates', () => {
  it('groups bookmarks that normalize to the same URL', () => {
    const bookmarks = [
      flatBm('1', 'https://example.com/page'),
      flatBm('2', 'https://example.com/page/'),
      flatBm('3', 'https://other.com/'),
    ];
    const groups = computeDuplicates(bookmarks);
    expect(groups).toHaveLength(1);
    expect(groups[0].bookmarkIds.sort()).toEqual(['1', '2']);
  });

  it('omits singletons — only true duplicates are reported', () => {
    const bookmarks = [flatBm('1', 'https://a.com'), flatBm('2', 'https://b.com')];
    expect(computeDuplicates(bookmarks)).toHaveLength(0);
  });
});

describe('computeSummary', () => {
  it('counts bookmarks, folders, and duplicates from a tree', () => {
    const tree = [
      node({
        id: '0',
        title: '',
        children: [
          node({
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              node({ id: '2', title: 'A', url: 'https://a.com' }),
              node({ id: '3', title: 'B', url: 'https://a.com' }),
              node({
                id: '4',
                title: 'Sub',
                children: [node({ id: '5', title: 'C', url: 'https://c.com' })],
              }),
            ],
          }),
        ],
      }),
    ];
    const flat = flattenBookmarkTree(tree);
    const summary = computeSummary(flat, tree, null);
    expect(summary.totalBookmarks).toBe(3);
    expect(summary.totalFolders).toBe(2); // "Bookmarks Bar" + "Sub"
    expect(summary.duplicateCount).toBe(1);
    expect(summary.topLevelFolders).toEqual(['Bookmarks Bar']);
  });
});
