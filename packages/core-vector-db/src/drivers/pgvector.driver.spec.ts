const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({ connect: mockConnect })),
}));

import { PgVectorDriver } from './pgvector.driver.js';

const INJECTED_KEY = "a' OR '1'='1";
const INJECTED_VALUE = "x'); DROP TABLE t; --";

describe('PgVectorDriver SQL injection hardening', () => {
  let driver: PgVectorDriver;

  const searchCalls = () =>
    mockQuery.mock.calls.filter(([sql]) => typeof sql === 'string' && sql.includes('<=>'));

  beforeEach(async () => {
    mockQuery.mockReset().mockResolvedValue({ rows: [] });
    mockRelease.mockReset();
    mockConnect.mockReset().mockResolvedValue({ query: mockQuery, release: mockRelease });
    driver = new PgVectorDriver({} as any);
    // let the deferred extension initialization settle, then forget its queries
    await new Promise((resolve) => setImmediate(resolve));
    mockQuery.mockClear();
  });

  it('keeps metadata filter keys/values out of the SQL text and binds them as parameters', async () => {
    await driver.similaritySearch('docs', {
      embedding: [1, 2, 3],
      limit: 5,
      threshold: 0,
      metadata_filter: { [INJECTED_KEY]: INJECTED_VALUE },
    });

    const calls = searchCalls();
    expect(calls).toHaveLength(1);
    const [sql, values] = calls[0];

    expect(sql).not.toContain(INJECTED_KEY);
    expect(sql).not.toContain(INJECTED_VALUE);
    expect(sql).not.toContain('DROP TABLE');
    expect(sql).toContain('metadata->>$2 = $3');
    expect(sql).toContain('LIMIT $4');
    expect(values).toEqual(['[1,2,3]', INJECTED_KEY, INJECTED_VALUE, 5]);
  });

  it('numbers parameters sequentially across multiple filter pairs with limit last', async () => {
    await driver.similaritySearch('docs', {
      embedding: [0.5],
      limit: 7,
      threshold: 0,
      metadata_filter: { k1: 'v1', k2: 'v2' },
    });

    const [sql, values] = searchCalls()[0];
    expect(sql).toContain('metadata->>$2 = $3 AND metadata->>$4 = $5');
    expect(sql).toContain('LIMIT $6');
    expect(values).toEqual(['[0.5]', 'k1', 'v1', 'k2', 'v2', 7]);
  });

  it('binds the embedding as parameter $1 in a vector-literal shape', async () => {
    await driver.similaritySearch('docs', { embedding: [1, 2, 3], limit: 10, threshold: 0 });

    const [sql, values] = searchCalls()[0];
    expect(sql).toContain('embedding <=> $1');
    expect(sql).not.toContain('[1,2,3]');
    expect(values[0]).toBe('[1,2,3]');
    expect(values).toEqual(['[1,2,3]', 10]);
    expect(sql).toContain('LIMIT $2');
  });

  it.each([
    ['a quote', 'docs"; DROP TABLE users; --'],
    ['a single quote', "docs' OR '1'='1"],
    ['a semicolon', 'docs;DROP TABLE users'],
    ['a space', 'my docs'],
  ])('rejects a collection name containing %s before any query', async (_label, name) => {
    await expect(
      driver.similaritySearch(name, { embedding: [1], limit: 1, threshold: 0 })
    ).rejects.toThrow(/Invalid identifier/);
    await expect(driver.deleteCollection(name)).rejects.toThrow(/Invalid identifier/);
    await expect(driver.addDocuments(name, [])).rejects.toThrow(/Invalid identifier/);
    await expect(driver.batchDelete(name, ['1'])).rejects.toThrow(/Invalid identifier/);
    await expect(driver.getStats(name)).rejects.toThrow(/Invalid identifier/);

    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('rejects an empty collection name', async () => {
    await expect(
      driver.similaritySearch('', { embedding: [1], limit: 1, threshold: 0 })
    ).rejects.toThrow(/Invalid identifier/);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('rejects a table name longer than 63 characters', async () => {
    await expect(
      driver.similaritySearch('a'.repeat(64), { embedding: [1], limit: 1, threshold: 0 })
    ).rejects.toThrow(/maximum length/);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('double-quotes a valid collection name in the SQL', async () => {
    await driver.similaritySearch('my_docs-1', { embedding: [1], limit: 1, threshold: 0 });
    await driver.deleteCollection('my_docs-1');

    const sqls = mockQuery.mock.calls.map(([sql]) => sql as string);
    expect(sqls.some((s) => s.includes('FROM "my_docs-1"'))).toBe(true);
    expect(sqls).toContain('DROP TABLE IF EXISTS "my_docs-1"');
  });

  it('requires an embedding for similarity search', async () => {
    await expect(
      driver.similaritySearch('docs', { limit: 1, threshold: 0 } as any)
    ).rejects.toThrow('Embedding is required');
    expect(searchCalls()).toHaveLength(0);
  });
});
