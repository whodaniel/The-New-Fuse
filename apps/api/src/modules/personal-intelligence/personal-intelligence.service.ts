import { BadRequestException, Injectable } from '@nestjs/common';
import { PersonalIntelligenceStore } from './personal-intelligence.store';
import {
  MAX_PERSONAL_INTEL_ITEMS,
  type PersonalIntelItem,
  type PersonalIntelSourceId,
  type SourceModuleStatus,
  type UnifiedPersonalIntelPayload,
} from './personal-intelligence.types';

const ALLOWED_SOURCES = new Set<PersonalIntelSourceId>([
  'google_ai',
  'apple_notes',
  'google_drive',
  'dropbox',
  'box',
  'onedrive',
  'local_device',
  'private_github',
  'cli_import',
  'other',
]);

@Injectable()
export class PersonalIntelligenceService {
  private store(userId: string): PersonalIntelligenceStore {
    return new PersonalIntelligenceStore(userId);
  }

  getIndex(userId: string): UnifiedPersonalIntelPayload {
    return this.store(userId).get();
  }

  upsertIndex(
    userId: string,
    body: Partial<UnifiedPersonalIntelPayload>
  ): UnifiedPersonalIntelPayload {
    const items = this.sanitizeItems(body.items);
    if (items.length > MAX_PERSONAL_INTEL_ITEMS) {
      throw new BadRequestException(
        `Too many items (${items.length}); max is ${MAX_PERSONAL_INTEL_ITEMS}`
      );
    }

    const sources = this.sanitizeSources(body.sources, items);
    const now = new Date().toISOString();
    const payload: UnifiedPersonalIntelPayload = {
      generatedAt: String(body.generatedAt || now),
      totalItems: items.length,
      sources,
      items,
      updatedAt: now,
      ownerUserId: userId,
    };
    return this.store(userId).put(payload);
  }

  clearIndex(userId: string): { cleared: true } {
    this.store(userId).clear();
    return { cleared: true };
  }

  private sanitizeItems(raw: unknown): PersonalIntelItem[] {
    if (!Array.isArray(raw)) {
      throw new BadRequestException('items must be an array');
    }
    const out: PersonalIntelItem[] = [];
    for (const row of raw) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const id = String(r.id || '').trim();
      const title = String(r.title || '').trim();
      const source = String(r.source || 'other') as PersonalIntelSourceId;
      if (!id || !title) continue;
      if (!ALLOWED_SOURCES.has(source)) continue;
      const item: PersonalIntelItem = {
        id: id.slice(0, 256),
        source,
        sourceLabel: String(r.sourceLabel || source).slice(0, 128),
        title: title.slice(0, 512),
      };
      if (r.subtitle) item.subtitle = String(r.subtitle).slice(0, 512);
      if (r.activityAt) item.activityAt = String(r.activityAt).slice(0, 64);
      if (r.metricLabel) item.metricLabel = String(r.metricLabel).slice(0, 64);
      if (
        r.metricValue != null &&
        (typeof r.metricValue === 'string' || typeof r.metricValue === 'number')
      ) {
        item.metricValue = r.metricValue;
      }
      if (r.workspace) item.workspace = String(r.workspace).slice(0, 1024);
      if (r.project) item.project = String(r.project).slice(0, 256);
      if (r.resumeHint) item.resumeHint = String(r.resumeHint).slice(0, 1024);
      // Intentionally drop `raw` — never store opaque blobs on the cloud mirror.
      out.push(item);
    }
    return out;
  }

  private sanitizeSources(raw: unknown, items: PersonalIntelItem[]): SourceModuleStatus[] {
    const counts = new Map<PersonalIntelSourceId, number>();
    for (const item of items) {
      counts.set(item.source, (counts.get(item.source) || 0) + 1);
    }

    if (!Array.isArray(raw) || raw.length === 0) {
      return [...counts.entries()].map(([id, itemCount]) => ({
        id,
        name: id,
        kind: id === 'google_ai' ? 'session_bridge' : id === 'apple_notes' ? 'notes' : 'cli',
        description: '',
        status: 'mirrored' as const,
        itemCount,
      }));
    }

    return raw
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
      .map((row) => {
        const id = String(row.id || 'other') as PersonalIntelSourceId;
        const safeId = ALLOWED_SOURCES.has(id) ? id : 'other';
        const itemCount = counts.get(safeId);
        return {
          id: safeId,
          name: String(row.name || safeId).slice(0, 128),
          kind: (row.kind as SourceModuleStatus['kind']) || 'cli',
          description: String(row.description || '').slice(0, 512),
          status:
            (row.status as SourceModuleStatus['status']) ||
            (itemCount ? 'mirrored' : 'not_connected'),
          itemCount: typeof itemCount === 'number' ? itemCount : undefined,
          mirrorPath: row.mirrorPath ? String(row.mirrorPath).slice(0, 512) : undefined,
          cliHint: row.cliHint ? String(row.cliHint).slice(0, 256) : undefined,
        } satisfies SourceModuleStatus;
      });
  }
}
