import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash, randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import type { UnifiedLedgerStore } from './unified-ledger.types';

export interface LedgerPartition {
  tenantId: string;
  workspaceId: string;
}
type Transaction = { scope: LedgerPartition; store: UnifiedLedgerStore; dirty: boolean };
const empty = (): UnifiedLedgerStore => ({ records: [], goals: [], plans: [], timelineEvents: [] });
const collections = ['records', 'goals', 'plans', 'timelineEvents'] as const;

/** One immutable scope per async operation. Never loads the legacy shared file. */
export class TenantLedgerStore {
  private readonly context = new AsyncLocalStorage<Transaction>();
  constructor(
    private readonly root = process.env.UNIFIED_LEDGER_ROOT ||
      (process.env.UNIFIED_LEDGER_STORE_PATH
        ? `${process.env.UNIFIED_LEDGER_STORE_PATH}.tenants`
        : path.join(os.homedir(), '.tnf', 'ledger'))
  ) {
    if (!path.isAbsolute(root)) throw new Error('Ledger storage root must be absolute');
  }

  current(): Transaction | undefined {
    return this.context.getStore();
  }
  require(): Transaction {
    const tx = this.current();
    if (!tx) throw new Error('Ledger operation requires a tenant/workspace context');
    return tx;
  }
  private key(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
  partitionPath(scope: LedgerPartition): string {
    this.validateScope(scope);
    return path.join(
      this.root,
      this.key(scope.tenantId),
      this.key(scope.workspaceId),
      'ledger.json'
    );
  }
  private validateScope(scope: LedgerPartition): void {
    for (const value of [scope.tenantId, scope.workspaceId]) {
      if (
        typeof value !== 'string' ||
        !value.trim() ||
        value !== value.trim() ||
        value.length > 512 ||
        /[\x00-\x1f]/.test(value)
      )
        throw new Error('Invalid ledger partition identity');
    }
  }
  private validate(store: UnifiedLedgerStore, scope: LedgerPartition): void {
    for (const collection of collections) {
      if (!Array.isArray(store[collection]))
        throw new Error(`Malformed ledger collection: ${collection}`);
      const ids = new Set<string>();
      for (const row of store[collection]) {
        if (!row || typeof row.id !== 'string' || !row.id || ids.has(row.id))
          throw new Error('Invalid or duplicate ledger ID');
        const strings =
          collection === 'records' || collection === 'goals'
            ? ['title', 'description', 'owner', 'status', 'createdAt', 'updatedAt']
            : collection === 'plans'
              ? ['name', 'objective', 'owner', 'status', 'createdAt', 'updatedAt']
              : ['userId', 'timestamp', 'eventType', 'actor'];
        if (strings.some((key) => typeof (row as any)[key] !== 'string'))
          throw new Error('Malformed ledger row');
        const arrays =
          collection === 'records'
            ? ['tags', 'links']
            : collection === 'goals'
              ? ['linkedRecordIds', 'milestones']
              : collection === 'plans'
                ? ['linkedRecordIds', 'linkedGoalIds']
                : [];
        if (arrays.some((key) => !Array.isArray((row as any)[key])))
          throw new Error('Malformed ledger row arrays');
        if (
          collection === 'records' &&
          (!(row as any).fractal ||
            !(row as any).votes ||
            !(row as any).traits ||
            !Array.isArray((row as any).rag?.feedbackIterations))
        )
          throw new Error('Malformed task record');
        ids.add(row.id);
        if (row.tenantId !== scope.tenantId || row.workspaceId !== scope.workspaceId)
          throw new Error('Ledger row scope does not match its partition');
      }
    }
    const records = new Map(store.records.map((r) => [r.id, r]));
    const goals = new Map(store.goals.map((g) => [g.id, g]));
    const plans = new Map(store.plans.map((p) => [p.id, p]));
    const reference = (
      id: string | undefined,
      rows: Map<string, any>,
      owner: string | undefined
    ) => {
      if (!id) return;
      const row = rows.get(id);
      if (!row || (owner && row.owner !== owner))
        throw new Error('Ledger reference is missing or outside the owner scope');
    };
    for (const row of store.records)
      for (const link of row.links || []) reference(link.targetId, records, row.owner);
    for (const row of store.goals)
      for (const id of row.linkedRecordIds || []) reference(id, records, row.owner);
    for (const row of store.plans) {
      for (const id of row.linkedRecordIds || []) reference(id, records, row.owner);
      for (const id of row.linkedGoalIds || []) reference(id, goals, row.owner);
    }
    for (const row of store.timelineEvents) {
      reference(row.recordId, records, row.userId);
      reference(row.goalId, goals, row.userId);
      reference(row.planId, plans, row.userId);
    }
  }
  async run<T>(scope: LedgerPartition, operation: () => Promise<T>): Promise<T> {
    this.validateScope(scope);
    const existing = this.current();
    if (existing) {
      if (
        existing.scope.tenantId !== scope.tenantId ||
        existing.scope.workspaceId !== scope.workspaceId
      )
        throw new Error('Cannot switch ledger partitions inside an operation');
      return operation();
    }
    const file = this.partitionPath(scope),
      directory = path.dirname(file);
    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    // An exclusive filesystem claim serializes independent service instances/processes.
    // Never delete another writer's claim based only on age.
    const lock = `${file}.lock`;
    const deadline = Date.now() + 10000;
    let handle: Awaited<ReturnType<typeof fs.open>>;
    for (;;) {
      try {
        handle = await fs.open(lock, 'wx', 0o600);
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST' || Date.now() >= deadline)
          throw error;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    }
    try {
      await handle.writeFile(
        JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() })
      );
      let store: UnifiedLedgerStore;
      try {
        const document = JSON.parse(await fs.readFile(file, 'utf8'));
        if (
          document.version !== 1 ||
          document.scope?.tenantId !== scope.tenantId ||
          document.scope?.workspaceId !== scope.workspaceId
        )
          throw new Error('Ledger file scope mismatch');
        store = document.store;
        this.validate(store, scope);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        store = empty();
      }
      const tx: Transaction = { scope: { ...scope }, store, dirty: false };
      return await this.context.run(tx, async () => {
        const result = await operation();
        if (tx.dirty) {
          this.validate(tx.store, scope);
          const temporary = `${file}.${randomUUID()}.tmp`;
          try {
            const output = await fs.open(temporary, 'wx', 0o600);
            try {
              await output.writeFile(JSON.stringify({ version: 1, scope, store: tx.store }));
              await output.sync();
            } finally {
              await output.close();
            }
            await fs.rename(temporary, file);
          } finally {
            await fs.rm(temporary, { force: true });
          }
        }
        return structuredClone(result);
      });
    } finally {
      await handle.close();
      await fs.unlink(lock);
    }
  }
}
