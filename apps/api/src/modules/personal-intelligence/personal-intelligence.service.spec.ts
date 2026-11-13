import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { PersonalIntelligenceService } from './personal-intelligence.service';

describe('PersonalIntelligenceService', () => {
  const prevRoot = process.env.TNF_PERSONAL_INTEL_CLOUD_ROOT;
  let tmpRoot: string;
  let service: PersonalIntelligenceService;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-pi-'));
    process.env.TNF_PERSONAL_INTEL_CLOUD_ROOT = tmpRoot;
    service = new PersonalIntelligenceService();
  });

  afterEach(() => {
    if (prevRoot === undefined) delete process.env.TNF_PERSONAL_INTEL_CLOUD_ROOT;
    else process.env.TNF_PERSONAL_INTEL_CLOUD_ROOT = prevRoot;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('returns empty index for a new user', () => {
    const index = service.getIndex('user-a');
    expect(index.totalItems).toBe(0);
    expect(index.items).toEqual([]);
  });

  it('upserts owner-scoped index and strips raw blobs', () => {
    const saved = service.upsertIndex('user-a', {
      generatedAt: '2026-11-13T00:00:00.000Z',
      items: [
        {
          id: 's1',
          source: 'google_ai',
          sourceLabel: 'Google AI',
          title: 'Hello',
          raw: { secret: 'nope' },
        } as any,
      ],
      sources: [],
    });
    expect(saved.totalItems).toBe(1);
    expect(saved.ownerUserId).toBe('user-a');
    expect((saved.items[0] as any).raw).toBeUndefined();

    const loaded = service.getIndex('user-a');
    expect(loaded.items[0].title).toBe('Hello');
    expect(service.getIndex('user-b').totalItems).toBe(0);
  });
});
