/**
 * Account-owned path nesting for personal CLI work surfaces.
 *
 * Ownership source of truth: AccountBindingService.resolveAccountBinding()
 * (tnfAccountId + ownerUserId) — the same authority used by
 * PersonalKnowledgeService / library-timeline binding.
 *
 * Surfaces nest under ~/.tnf/<surface>/<ownerUserId>/ instead of the flat
 * machine-wide directory, and JSON records are stamped with
 * ownerAccountId/ownerUserId.
 *
 * Fail-closed on writes: when no TNF account is bound, writers must throw —
 * never fall back to the OS username or a shared flat path for new data.
 * Reads may fall back to legacy flat paths so pre-binding data stays visible
 * until migrated (see tryResolveAccountOwnedRoot).
 */
import * as os from 'node:os';
import * as path from 'node:path';
import { resolveAccountBinding, type TnfAccountBinding } from './AccountBindingService.js';

export const TNF_HOME = () => process.env.TNF_HOME || path.join(os.homedir(), '.tnf');

export interface AccountOwnedRoot {
  /** Per-user nested root: <tnfHome>/<surface>/<ownerUserId> */
  root: string;
  /** Legacy flat surface root: <tnfHome>/<surface> (read fallback for migration) */
  legacyRoot: string;
  tnfHome: string;
  ownerUserId: string;
  ownerAccountId: string;
  binding: TnfAccountBinding;
}

function buildOwnedRoot(surface: string, binding: TnfAccountBinding): AccountOwnedRoot {
  const tnfHome = TNF_HOME();
  const legacyRoot = path.join(tnfHome, surface);
  return {
    root: path.join(legacyRoot, binding.ownerUserId),
    legacyRoot,
    tnfHome,
    ownerUserId: binding.ownerUserId,
    ownerAccountId: binding.tnfAccountId,
    binding,
  };
}

/**
 * Resolve the account-owned root for a surface. Throws when no TNF account
 * binding is available — use this on every write path (fail closed).
 */
export function resolveAccountOwnedRoot(surface: string): AccountOwnedRoot {
  return buildOwnedRoot(surface, resolveAccountBinding({ tnfHome: TNF_HOME() }));
}

/**
 * Best-effort resolution for read fallback / explicit-path escape hatches.
 * Returns null when no TNF account is bound instead of throwing.
 */
export function tryResolveAccountOwnedRoot(surface: string): AccountOwnedRoot | null {
  try {
    return buildOwnedRoot(surface, resolveAccountBinding({ tnfHome: TNF_HOME() }));
  } catch {
    return null;
  }
}

/**
 * Ownership stamp fields for JSON records. Spread onto new/updated records so
 * every durable row carries its owner identity.
 */
export function accountOwnedStamp(res: Pick<AccountOwnedRoot, 'ownerAccountId' | 'ownerUserId'>): {
  ownerAccountId: string;
  ownerUserId: string;
} {
  return { ownerAccountId: res.ownerAccountId, ownerUserId: res.ownerUserId };
}

/**
 * Merge record lists from multiple store generations (owned first, legacy
 * fallback), deduped by id with the FIRST occurrence (owned) winning. Used so
 * pre-binding rows remain visible until they are adopted on the next write.
 */
export function mergeRecordsById<T extends { id: string }>(lists: T[][]): T[] {
  const byId = new Map<string, T>();
  for (const list of lists) {
    for (const record of list) {
      if (!byId.has(record.id)) byId.set(record.id, record);
    }
  }
  return Array.from(byId.values());
}

/**
 * Stamp missing ownership fields onto a record without clobbering an existing
 * stamp (records loaded from legacy paths keep their original owner).
 */
export function stampRecord<T>(
  record: T,
  stamp: { ownerAccountId: string; ownerUserId: string } | null
): T {
  if (!stamp) return record;
  const rec = record as Record<string, unknown>;
  return {
    ...rec,
    ownerAccountId: (rec.ownerAccountId as string | undefined) ?? stamp.ownerAccountId,
    ownerUserId: (rec.ownerUserId as string | undefined) ?? stamp.ownerUserId,
  } as T;
}
