import type { BookmarkTagRecord, FlatBookmark } from '../../../shared/types';
import { scoreSearch } from '../bookmark-tagging-service';

function bm(id: string, title: string, url = `https://example.com/${id}`): FlatBookmark {
  return { id, parentId: '1', title, url, path: '' };
}

function record(bookmarkId: string, tags: string[], summary?: string): BookmarkTagRecord {
  return { bookmarkId, tags, summary, updatedAt: Date.now() };
}

describe('scoreSearch', () => {
  it('returns an empty array for an empty query', () => {
    expect(scoreSearch('', [{ bookmark: bm('1', 'Recipes') }])).toEqual([]);
    expect(scoreSearch('   ', [{ bookmark: bm('1', 'Recipes') }])).toEqual([]);
  });

  it('ranks an exact title-substring match above a tag-only match', () => {
    const items = [
      { bookmark: bm('1', 'My Cooking Recipes') },
      { bookmark: bm('2', 'Unrelated Page'), record: record('2', ['cooking']) },
    ];
    const results = scoreSearch('cooking', items);
    expect(results.map((r) => r.bookmark.id)).toEqual(['1', '2']);
  });

  it('surfaces a bookmark via a tag even when the query never appears in its title', () => {
    const items = [
      { bookmark: bm('1', "Grandma's Best"), record: record('1', ['cooking', 'recipes']) },
    ];
    const results = scoreSearch('cooking', items);
    expect(results).toHaveLength(1);
    expect(results[0].tags).toContain('cooking');
  });

  it('finds matches via the summary when neither title nor tags contain the query', () => {
    const items = [
      {
        bookmark: bm('1', 'Untitled'),
        record: record('1', [], 'A guide to sourdough baking techniques'),
      },
    ];
    const results = scoreSearch('sourdough', items);
    expect(results).toHaveLength(1);
  });

  it('returns no results when nothing matches', () => {
    const items = [{ bookmark: bm('1', 'Cats and Dogs') }];
    expect(scoreSearch('astrophysics', items)).toEqual([]);
  });
});
