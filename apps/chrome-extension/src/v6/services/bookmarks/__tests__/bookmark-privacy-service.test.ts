import type { FlatBookmark } from '../../../shared/types';
import { filterBookmarks, isPrivateDomain } from '../bookmark-privacy-service';

function bm(id: string, url: string): FlatBookmark {
  return { id, parentId: '1', title: id, url, path: '' };
}

describe('isPrivateDomain', () => {
  it('matches an exact hostname', () => {
    expect(isPrivateDomain('https://bank.example.com/login', ['bank.example.com'])).toBe(true);
  });

  it('matches a subdomain of a listed domain', () => {
    expect(isPrivateDomain('https://mail.bank.example.com/inbox', ['bank.example.com'])).toBe(true);
  });

  it('does not match an unrelated domain that merely contains the same substring', () => {
    expect(isPrivateDomain('https://notbank.example.com/x', ['bank.example.com'])).toBe(false);
  });

  it('is case-insensitive and tolerates protocol/www in the stored list', () => {
    expect(isPrivateDomain('https://Bank.Example.com/x', ['https://www.bank.example.com/'])).toBe(
      true
    );
  });

  it('returns false for an empty or malformed url', () => {
    expect(isPrivateDomain(undefined, ['bank.example.com'])).toBe(false);
    expect(isPrivateDomain('not a url', ['bank.example.com'])).toBe(false);
  });
});

describe('filterBookmarks', () => {
  it('splits bookmarks into included and excluded sets based on private domains', () => {
    const bookmarks = [
      bm('1', 'https://bank.example.com/a'),
      bm('2', 'https://public.example.com/b'),
    ];
    const { included, excluded } = filterBookmarks(bookmarks, ['bank.example.com']);
    expect(included.map((b) => b.id)).toEqual(['2']);
    expect(excluded.map((b) => b.id)).toEqual(['1']);
  });

  it('includes everything when no private domains are configured', () => {
    const bookmarks = [bm('1', 'https://a.com'), bm('2', 'https://b.com')];
    const { included, excluded } = filterBookmarks(bookmarks, []);
    expect(included).toHaveLength(2);
    expect(excluded).toHaveLength(0);
  });
});
