/**
 * packages/tnf-cli/src/utils/palette-recents.ts
 *
 * Frecency store for the command palette.
 *
 * WHY
 *   `PaletteEntry.id` was documented as "used for dedupe and for recents", but
 *   only dedupe was ever implemented. With ~1300 indexed entries the operator
 *   re-types the same handful of commands all session and the palette treats
 *   the 900th agent persona exactly like the command they ran four minutes
 *   ago. Ranking is the only place that knowledge can be spent.
 *
 * MODEL
 *   Classic frecency: usage count damped by an exponential decay on last-use,
 *   so a command run 40 times last month loses to one run twice this morning.
 *   The result is normalised to 0..1 and multiplied by a weight in the ranker,
 *   which keeps it a tiebreaker — a genuinely better fuzzy hit still wins, so
 *   the palette never feels like it is second-guessing what you typed.
 *
 * PERSISTENCE
 *   One small JSON file under ~/.tnf. Every read and write is best-effort:
 *   a corrupt or unwritable store degrades to "no recents", never to a crash
 *   in a keypress handler.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

export interface RecentRecord {
  /** PaletteEntry.id */
  id: string;
  /** Times chosen. */
  count: number;
  /** Epoch ms of the last choice. */
  last: number;
}

/** Half-life of a use, in ms. Two weeks: a command you stopped using fades. */
const HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000;

/** Keep the file small; anything past this has decayed to noise anyway. */
const MAX_RECORDS = 250;

/** Decay multiplier for a record last used `ageMs` ago. */
function decay(ageMs: number): number {
  if (!Number.isFinite(ageMs) || ageMs <= 0) return 1;
  return Math.pow(0.5, ageMs / HALF_LIFE_MS);
}

/**
 * Raw frecency weight of a record. Counts are compressed with log1p so the
 * difference between 1 and 3 uses matters more than between 60 and 62.
 */
export function frecency(record: RecentRecord, now: number): number {
  return Math.log1p(Math.max(0, record.count)) * decay(now - record.last);
}

/**
 * In-memory view of the store, normalised so the top entry scores 1.
 *
 * Normalising here rather than in the ranker means the ranker's weight
 * constant has a stable meaning no matter how heavy the store has grown.
 */
export class PaletteRecents {
  private records = new Map<string, RecentRecord>();
  private normalised = new Map<string, number>();
  private dirty = false;

  constructor(
    private readonly filePath: string = defaultRecentsPath(),
    private readonly now: () => number = () => Date.now()
  ) {}

  /** Load from disk. Never throws — a broken store is an empty store. */
  load(): this {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      const list: unknown[] = Array.isArray(parsed) ? parsed : parsed?.entries;
      if (Array.isArray(list)) {
        for (const item of list) {
          const record = item as Partial<RecentRecord>;
          if (typeof record?.id !== 'string') continue;
          this.records.set(record.id, {
            id: record.id,
            count: Number(record.count) || 0,
            last: Number(record.last) || 0,
          });
        }
      }
    } catch {
      /* absent or corrupt — start empty */
    }
    this.renormalise();
    return this;
  }

  /** Frecency score for an entry id, normalised to 0..1. */
  scoreFor(id: string): number {
    return this.normalised.get(id) ?? 0;
  }

  /** True when anything has ever been recorded. */
  get isEmpty(): boolean {
    return this.records.size === 0;
  }

  /** Ids ordered most-frecent first. Used to seed the empty-query view. */
  ranked(): string[] {
    return [...this.normalised.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }

  /** Note that `id` was just chosen. Persists immediately (the file is tiny). */
  record(id: string): void {
    if (!id) return;
    const existing = this.records.get(id);
    const now = this.now();
    this.records.set(id, {
      id,
      count: (existing?.count ?? 0) + 1,
      last: now,
    });
    this.dirty = true;
    this.renormalise();
    this.save();
  }

  private renormalise(): void {
    const now = this.now();
    this.normalised.clear();
    let max = 0;
    const raw: Array<[string, number]> = [];
    for (const record of this.records.values()) {
      const value = frecency(record, now);
      raw.push([record.id, value]);
      if (value > max) max = value;
    }
    if (max <= 0) return;
    for (const [id, value] of raw) this.normalised.set(id, value / max);
  }

  /** Best-effort write. A read-only home directory must not break the palette. */
  save(): void {
    if (!this.dirty) return;
    this.dirty = false;
    try {
      // Trim by frecency, not by insertion order: the point is to drop the
      // entries that have decayed away, not the ones added longest ago.
      const now = this.now();
      const entries = [...this.records.values()]
        .sort((a, b) => frecency(b, now) - frecency(a, now))
        .slice(0, MAX_RECORDS);
      this.records = new Map(entries.map((record) => [record.id, record]));
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify({ version: 1, entries }, null, 0), 'utf8');
    } catch {
      /* best-effort */
    }
  }
}

export function defaultRecentsPath(): string {
  return path.join(os.homedir() || os.tmpdir(), '.tnf', 'palette-recents.json');
}

/** Process-wide store. Built lazily so a non-TTY run never touches the disk. */
let shared: PaletteRecents | null = null;

export function getPaletteRecents(): PaletteRecents {
  if (!shared) shared = new PaletteRecents().load();
  return shared;
}

/** Test seam. */
export function setPaletteRecents(store: PaletteRecents | null): void {
  shared = store;
}
