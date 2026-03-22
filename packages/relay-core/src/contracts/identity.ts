import { z } from 'zod';

const CANONICAL_ID_SEGMENT = /^[A-Z0-9_]+$/;

export const TnfIdentityCategory = z.enum([
  'AGENT',
  'SESSION',
  'CHANNEL',
  'WORKFLOW',
  'TASK',
  'SCHEDULE',
  'HARNESS',
  'MCP',
  'LLM',
  'USER',
  'SYSTEM',
]);

export type TnfIdentityCategory = z.infer<typeof TnfIdentityCategory>;

export interface TnfCanonicalEntityParts {
  scope?: string | null;
  category: string;
  provider: string;
  name: string;
  instance?: string | number | null;
}

export interface TnfAgentIdentityRecord {
  canonicalEntityId?: string | null;
  operationalHandle: string;
  runtimeSessionId?: string | null;
  aliases: string[];
}

function normalizeCanonicalSegment(value: string | number | null | undefined): string | null {
  if (value == null) return null;
  const normalized = String(value)
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return normalized || null;
}

function normalizeCanonicalInstance(value?: string | number | null): string {
  if (value == null || value === '') return '001';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value)).padStart(3, '0');
  }
  const raw = String(value).trim();
  if (/^\d+$/.test(raw)) {
    return raw.padStart(3, '0');
  }
  const normalized = normalizeCanonicalSegment(raw);
  return normalized || '001';
}

export function buildCanonicalEntityId(parts: TnfCanonicalEntityParts): string {
  const category = normalizeCanonicalSegment(parts.category);
  const provider = normalizeCanonicalSegment(parts.provider);
  const name = normalizeCanonicalSegment(parts.name);
  const instance = normalizeCanonicalInstance(parts.instance);
  const scope = normalizeCanonicalSegment(parts.scope);

  if (!category || !provider || !name) {
    throw new Error('category, provider, and name are required to build a canonical TNF id');
  }

  return ['TNF', scope, category, provider, name, instance].filter(Boolean).join(':');
}

export function normalizeCanonicalEntityId(input: string): string {
  const value = String(input || '').trim();
  if (!value) {
    throw new Error('canonical entity id cannot be empty');
  }

  const segments = value.split(':').map((segment) => segment.trim()).filter(Boolean);
  if (segments.length < 5 || segments.length > 6) {
    throw new Error(`invalid canonical entity id: ${input}`);
  }
  if (segments[0].toUpperCase() !== 'TNF') {
    throw new Error(`invalid TNF namespace: ${input}`);
  }

  const normalized = ['TNF'];
  for (let index = 1; index < segments.length - 1; index += 1) {
    const segment = normalizeCanonicalSegment(segments[index]);
    if (!segment || !CANONICAL_ID_SEGMENT.test(segment)) {
      throw new Error(`invalid canonical entity id segment: ${segments[index]}`);
    }
    normalized.push(segment);
  }

  normalized.push(normalizeCanonicalInstance(segments[segments.length - 1]));
  return normalized.join(':');
}

export function isCanonicalEntityId(input: unknown): input is string {
  try {
    normalizeCanonicalEntityId(String(input));
    return true;
  } catch {
    return false;
  }
}

export function normalizeOperationalHandle(input: string): string {
  return String(input || '').trim();
}

function normalizeAlias(input: string): string | null {
  const value = String(input || '').trim().toLowerCase();
  return value || null;
}

export function buildIdentityAliases(input: {
  canonicalEntityId?: string | null;
  operationalHandle: string;
  runtimeSessionId?: string | null;
  aliases?: Array<string | null | undefined>;
}): string[] {
  const values = new Set<string>();

  const add = (candidate?: string | null) => {
    const normalized = candidate ? normalizeAlias(candidate) : null;
    if (normalized) {
      values.add(normalized);
    }
  };

  add(input.operationalHandle);
  add(input.runtimeSessionId || undefined);
  add(input.canonicalEntityId || undefined);

  for (const alias of input.aliases || []) {
    add(alias || undefined);
  }

  return [...values];
}

export function createAgentIdentityRecord(input: {
  canonicalEntityId?: string | null;
  operationalHandle: string;
  runtimeSessionId?: string | null;
  aliases?: Array<string | null | undefined>;
}): TnfAgentIdentityRecord {
  const operationalHandle = normalizeOperationalHandle(input.operationalHandle);
  if (!operationalHandle) {
    throw new Error('operationalHandle is required');
  }

  const canonicalEntityId = input.canonicalEntityId
    ? normalizeCanonicalEntityId(input.canonicalEntityId)
    : null;

  return {
    canonicalEntityId,
    operationalHandle,
    runtimeSessionId: input.runtimeSessionId
      ? normalizeOperationalHandle(input.runtimeSessionId)
      : null,
    aliases: buildIdentityAliases({
      canonicalEntityId,
      operationalHandle,
      runtimeSessionId: input.runtimeSessionId,
      aliases: input.aliases,
    }),
  };
}

export function buildIdentityAliasMap(
  records: TnfAgentIdentityRecord[]
): Map<string, TnfAgentIdentityRecord> {
  const aliasMap = new Map<string, TnfAgentIdentityRecord>();
  for (const record of records) {
    for (const alias of record.aliases) {
      aliasMap.set(alias, record);
    }
  }
  return aliasMap;
}

export function resolveIdentityAlias(
  alias: string,
  recordsOrMap: TnfAgentIdentityRecord[] | Map<string, TnfAgentIdentityRecord>
): TnfAgentIdentityRecord | null {
  const normalized = normalizeAlias(alias);
  if (!normalized) return null;
  const aliasMap =
    recordsOrMap instanceof Map ? recordsOrMap : buildIdentityAliasMap(recordsOrMap);
  return aliasMap.get(normalized) || null;
}
