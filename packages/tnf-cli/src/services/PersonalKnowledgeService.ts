/**
 * Bind Virtual Library + Timeline personal knowledge to the authenticated TNF account,
 * and wire stories / narratives / factoids across both surfaces.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  persistAccountBinding,
  resolveAccountBinding,
  type TnfAccountBinding,
} from './AccountBindingService.js';

export type NarrativeKind = 'story' | 'narrative' | 'factoid' | 'personal_segment';

export interface LibraryNarrativeItem {
  kind: NarrativeKind;
  title: string;
  description?: string;
  storyKey?: string;
  eventDate?: string;
  tags?: string[];
  libraryRefs?: string[];
  evidenceRefs?: string[];
  source?: string;
  confidence?: 'low' | 'moderate' | 'strong';
  timelineTrack?: string;
}

export interface PersonalKnowledgeBindings {
  binding: TnfAccountBinding;
  libraryBindingPath: string;
  timelineBindingPath: string;
  notesVaultPath: string;
  ownerPrincipalAliases: string[];
}

const TNF_HOME = () => process.env.TNF_HOME || path.join(os.homedir(), '.tnf');

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
}

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function storyKeyFor(item: LibraryNarrativeItem): string {
  if (item.storyKey?.trim()) return item.storyKey.trim();
  const basis = `${item.kind}:${item.title}:${item.eventDate || ''}:${(item.tags || []).join(',')}`;
  let hash = 0;
  for (let i = 0; i < basis.length; i++) hash = (hash * 31 + basis.charCodeAt(i)) >>> 0;
  return `nk_${item.kind}_${hash.toString(16)}`;
}

function upsertEnvFile(filePath: string, updates: Record<string, string>): void {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const lines = existing ? existing.split(/\r?\n/) : [];
  const keys = new Set(Object.keys(updates));
  const next: string[] = [];
  for (const line of lines) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(line);
    if (m && keys.has(m[1])) continue;
    if (line.length > 0 || next.length > 0) next.push(line);
  }
  while (next.length && next[next.length - 1] === '') next.pop();
  for (const [key, value] of Object.entries(updates)) {
    next.push(`${key}=${value}`);
  }
  next.push('');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, next.join('\n'), { mode: 0o600 });
}

export class PersonalKnowledgeService {
  constructor(private readonly tnfHome = TNF_HOME()) {}

  resolveOwnerPrincipalAliases(binding: TnfAccountBinding): string[] {
    const aliases = new Set<string>([binding.ownerUserId, binding.tnfAccountId, binding.profile]);
    // Legacy Story Architect principal used before account binding
    aliases.add('daniel');
    for (const part of String(process.env.TNF_OWNER_PRINCIPAL_ALIASES || '').split(',')) {
      const v = part.trim();
      if (v) aliases.add(v);
    }
    return Array.from(aliases).filter(Boolean);
  }

  /**
   * Stamp library + timeline + notes vault roots to the authenticated account.
   */
  bindAll(options?: { virtualLibraryEnvPath?: string }): PersonalKnowledgeBindings {
    const binding = resolveAccountBinding({ tnfHome: this.tnfHome });
    persistAccountBinding(binding, this.tnfHome);
    const ownerPrincipalAliases = this.resolveOwnerPrincipalAliases(binding);

    const libraryBindingPath = path.join(this.tnfHome, 'library-binding.json');
    const timelineBindingPath = path.join(this.tnfHome, 'timeline-binding.json');
    const notesVaultPath = path.join(this.tnfHome, 'vault', binding.ownerUserId);
    const aliasesPath = path.join(this.tnfHome, 'owner-principal-aliases.json');

    writeJson(libraryBindingPath, {
      ...binding,
      surface: 'virtual-library',
      ownerPrincipalId: binding.ownerUserId,
      ownerAccountId: binding.tnfAccountId,
      ownerPrincipalAliases,
      notesVaultPath,
      envHints: {
        STORY_OWNER_PRINCIPAL_ID: binding.ownerUserId,
        TNF_OWNER_PRINCIPAL_ID: binding.ownerUserId,
        TNF_OWNER_USER_ID: binding.ownerUserId,
        TNF_OWNER_PRINCIPAL_ALIASES: ownerPrincipalAliases.join(','),
        VITE_OWNER_PRINCIPAL_ID: binding.ownerUserId,
        VITE_STORY_USER_ID: binding.ownerUserId,
        VITE_ALLOW_ENV_IDENTITY_FALLBACK: 'true',
        TNF_USER_ID: binding.ownerUserId,
        TNF_ACCOUNT_ID: binding.tnfAccountId,
      },
      boundAt: new Date().toISOString(),
    });

    writeJson(timelineBindingPath, {
      ...binding,
      surface: 'unified-ledger-timeline',
      ownerUserId: binding.ownerUserId,
      ownerAccountId: binding.tnfAccountId,
      ownerPrincipalAliases,
      apiPaths: {
        list: '/api/unified-ledger/timeline/events',
        create: '/api/unified-ledger/timeline/events',
        bootstrap: '/api/unified-ledger/timeline/personal/bootstrap',
        linkLibrary: '/api/unified-ledger/timeline/library/link',
      },
      boundAt: new Date().toISOString(),
    });

    writeJson(aliasesPath, {
      ownerUserId: binding.ownerUserId,
      ownerAccountId: binding.tnfAccountId,
      aliases: ownerPrincipalAliases,
      updatedAt: new Date().toISOString(),
    });

    fs.mkdirSync(notesVaultPath, { recursive: true, mode: 0o700 });
    writeJson(path.join(this.tnfHome, 'vault', 'active-account.json'), {
      ownerUserId: binding.ownerUserId,
      ownerAccountId: binding.tnfAccountId,
      notesVaultPath,
      updatedAt: new Date().toISOString(),
    });

    // Keep local API / Story CLI / VL env fallbacks aligned with the account.
    const localEnvPath = path.join(os.homedir(), '.tnf.local.env');
    upsertEnvFile(localEnvPath, {
      TNF_OWNER_USER_ID: binding.ownerUserId,
      TNF_OWNER_PRINCIPAL_ID: binding.ownerUserId,
      TNF_OWNER_PRINCIPAL_ALIASES: ownerPrincipalAliases.join(','),
      TNF_ACCOUNT_ID: binding.tnfAccountId,
      STORY_OWNER_PRINCIPAL_ID: binding.ownerUserId,
    });

    const vlEnv =
      options?.virtualLibraryEnvPath ||
      path.join(process.cwd(), 'apps/extensions/virtual-library-blueprints/.env.local');
    if (fs.existsSync(path.dirname(vlEnv))) {
      upsertEnvFile(vlEnv, {
        VITE_OWNER_PRINCIPAL_ID: binding.ownerUserId,
        VITE_STORY_USER_ID: binding.ownerUserId,
        VITE_ALLOW_ENV_IDENTITY_FALLBACK: 'true',
      });
    }

    return {
      binding,
      libraryBindingPath,
      timelineBindingPath,
      notesVaultPath,
      ownerPrincipalAliases,
    };
  }

  readLibraryBinding(): Record<string, unknown> | null {
    return readJson(path.join(this.tnfHome, 'library-binding.json'));
  }

  readTimelineBinding(): Record<string, unknown> | null {
    return readJson(path.join(this.tnfHome, 'timeline-binding.json'));
  }

  /**
   * Push narrative items (stories / narratives / factoids) into the account timeline.
   */
  async syncNarrativesToTimeline(options: {
    apiBase: string;
    token: string;
    items: LibraryNarrativeItem[];
  }): Promise<{
    linked: number;
    results: Array<{ storyKey: string; eventId?: string; error?: string }>;
  }> {
    const bound = this.bindAll();
    const apiBase = options.apiBase.replace(/\/$/, '');
    const results: Array<{ storyKey: string; eventId?: string; error?: string }> = [];
    let linked = 0;

    const batchRes = await fetch(`${apiBase}/unified-ledger/timeline/library/link`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        ownerAccountId: bound.binding.tnfAccountId,
        items: options.items.map((item) => ({
          ...item,
          storyKey: storyKeyFor(item),
        })),
      }),
    });

    if (batchRes.ok) {
      const body = (await batchRes.json()) as {
        linked?: number;
        results?: Array<{ storyKey: string; eventId?: string; error?: string }>;
      };
      return {
        linked: Number(body.linked || 0),
        results: Array.isArray(body.results) ? body.results : [],
      };
    }

    for (const item of options.items) {
      const storyKey = storyKeyFor(item);
      try {
        const res = await fetch(`${apiBase}/unified-ledger/timeline/events`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${options.token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            eventType: 'historical_event',
            actor: bound.binding.ownerUserId,
            timestamp: item.eventDate
              ? `${item.eventDate}T00:00:00.000Z`
              : new Date().toISOString(),
            payload: {
              title: item.title,
              description: item.description || '',
              kind: item.kind,
              storyKey,
              libraryRefs: item.libraryRefs || [],
              evidenceRefs: item.evidenceRefs || [],
              tags: item.tags || [],
              confidence: item.confidence || 'moderate',
              timelineTrack: item.timelineTrack || 'personal_knowledge',
              source: item.source || 'library-timeline-bridge',
              ownerAccountId: bound.binding.tnfAccountId,
              ownerUserId: bound.binding.ownerUserId,
              isPrivate: true,
            },
          }),
        });
        const text = await res.text();
        let parsed: any = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = { raw: text };
        }
        if (!res.ok) {
          results.push({ storyKey, error: `HTTP ${res.status}: ${text.slice(0, 200)}` });
          continue;
        }
        results.push({ storyKey, eventId: String(parsed?.id || '') });
        linked += 1;
      } catch (err) {
        results.push({
          storyKey,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return { linked, results };
  }

  async bootstrapTimeline(options: { apiBase: string; token: string }): Promise<unknown> {
    this.bindAll();
    const apiBase = options.apiBase.replace(/\/$/, '');
    const res = await fetch(`${apiBase}/unified-ledger/timeline/personal/bootstrap`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json',
      },
      body: '{}',
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Timeline bootstrap failed HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  /**
   * Load local factoid JSON files (gauntlet / archaeology) and normalize to narrative items.
   */
  loadLocalFactoids(globDir?: string): LibraryNarrativeItem[] {
    const dir = globDir || path.join(this.tnfHome, 'personal-intelligence');
    if (!fs.existsSync(dir)) return [];
    const items: LibraryNarrativeItem[] = [];
    const walk = (d: string) => {
      for (const name of fs.readdirSync(d)) {
        const full = path.join(d, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) {
          walk(full);
          continue;
        }
        if (!name.endsWith('.json')) continue;
        if (!/factoid/i.test(name) && !/narrative/i.test(name) && !/story/i.test(name)) {
          continue;
        }
        try {
          const raw = JSON.parse(fs.readFileSync(full, 'utf8'));
          const rows = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.factoids)
              ? raw.factoids
              : [raw];
          for (const row of rows) {
            const text = String(row.text || row.title || row.description || '').trim();
            if (!text) continue;
            items.push({
              kind: /narrative/i.test(name)
                ? 'narrative'
                : /story/i.test(name)
                  ? 'story'
                  : 'factoid',
              title: String(row.title || text.slice(0, 80)),
              description: String(row.description || text),
              eventDate: row.timestamp || row.eventDate || row.date,
              tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
              libraryRefs: [`file:${full}`],
              evidenceRefs: row.video_id ? [`video:${row.video_id}`] : [],
              source: 'local-factoid-import',
              confidence: 'moderate',
              timelineTrack: 'personal_knowledge',
            });
          }
        } catch {
          /* skip bad files */
        }
      }
    };
    walk(dir);
    return items;
  }
}
