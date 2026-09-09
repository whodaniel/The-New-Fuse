import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '@the-new-fuse/database';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import 'reflect-metadata';
import { GoalsService } from '../../../packages/tnf-cli/src/services/GoalsService';
import { KanbanService } from '../../../packages/tnf-cli/src/services/KanbanService';
import { UnifiedLedgerClient } from '../../../packages/tnf-cli/src/services/UnifiedLedgerClient';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { LedgerScopeInterceptor } from '../src/modules/unified-ledger/ledger-scope.interceptor';
import { TenantLedgerStore } from '../src/modules/unified-ledger/tenant-ledger-store';
import { UnifiedLedgerController } from '../src/modules/unified-ledger/unified-ledger.controller';
import { UnifiedLedgerService } from '../src/modules/unified-ledger/unified-ledger.service';

test('tenant partitions survive concurrent writes, reject cross references and preserve corruption', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnf-ledger-partition-'));
  const previous = process.env.UNIFIED_LEDGER_ROOT;
  process.env.UNIFIED_LEDGER_ROOT = root;
  try {
    const service = new UnifiedLedgerService();
    const other = new UnifiedLedgerService();
    const a = { tenantId: 'tenant-a', workspaceId: 'space-a' },
      b = { tenantId: 'tenant-b', workspaceId: 'space-a' };
    const create = (title: string, scope = a) =>
      service.createRecord({ id: title, title, description: '', owner: 'same-user', ...scope });
    await create('same-id');
    await create('same-id', b);
    assert.equal((await service.listRecords({ owner: 'same-user', ...a })).length, 1);
    assert.equal((await service.listRecords({ owner: 'same-user', ...b })).length, 1);
    await assert.rejects(service.listRecords(), /tenant or authenticated owner/);
    assert.equal(
      (await service.listRecords({ owner: 'same-user', ...a, workspaceId: 'space-b' })).length,
      0
    );
    await assert.rejects(
      service.updateRecord('same-id', { tenantId: 'tenant-b' }, 'same-user', a),
      /Immutable/
    );
    await create('foreign', b);
    await assert.rejects(
      service.addFunctionalLink(
        'same-id',
        { targetId: 'foreign', linkType: 'depends_on', weight: 1 },
        'same-user',
        a
      ),
      /reference/
    );
    assert.equal((await service.getRecord('same-id', 'same-user', a))?.links.length, 0);
    await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        (i % 2 ? service : other).createRecord({
          title: `parallel-${i}`,
          description: '',
          owner: 'same-user',
          ...a,
        })
      )
    );
    assert.equal((await other.listRecords({ owner: 'same-user', ...a })).length, 13);
    const record = await service.getRecord('same-id', 'same-user', a);
    record!.title = 'mutated outside';
    assert.equal((await service.getRecord('same-id', 'same-user', a))?.title, 'same-id');
    const file = new TenantLedgerStore(root).partitionPath(a);
    await fs.writeFile(file, '{corrupt');
    await assert.rejects(service.listRecords({ owner: 'same-user', ...a }));
    assert.equal(await fs.readFile(file, 'utf8'), '{corrupt');
    assert.equal((await service.listRecords({ owner: 'same-user', ...b })).length, 2);
  } finally {
    if (previous === undefined) delete process.env.UNIFIED_LEDGER_ROOT;
    else process.env.UNIFIED_LEDGER_ROOT = previous;
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('real JWT/Nest HTTP boundary and CLI goals/Kanban share ledger records', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnf-ledger-http-'));
  const previous = process.env.UNIFIED_LEDGER_ROOT;
  process.env.UNIFIED_LEDGER_ROOT = root;
  const service = new UnifiedLedgerService();
  const jwt = new JwtService({ secret: 'isolated-ledger-test-signing-secret' });
  const module = await Test.createTestingModule({
    controllers: [UnifiedLedgerController],
    providers: [
      { provide: UnifiedLedgerService, useValue: service },
      // This test uses personal scope; any workspace must be denied by this membership fixture.
      {
        provide: DatabaseService,
        useValue: { workspaces: { findByIdWithOwner: async () => null } },
      },
      LedgerScopeInterceptor,
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue(new JwtAuthGuard(jwt))
    .compile();
  const app = module.createNestApplication();
  try {
    await app.listen(0, '127.0.0.1');
    const baseUrl = `${await app.getUrl()}/unified-ledger`;
    const client = new UnifiedLedgerClient({
      baseUrl,
      token: jwt.sign({ sub: 'same-user', tenantId: 'tenant-a' }),
    });
    const foreign = new UnifiedLedgerClient({
      baseUrl,
      token: jwt.sign({ sub: 'same-user', tenantId: 'tenant-b' }),
    });
    const goals = new GoalsService(client),
      kanban = new KanbanService(client);
    const goal = await goals.create({
      title: 'Shared pipeline',
      parity: { agent: 'codex', feature: 'ledger' },
    });
    assert.equal((await new GoalsService(foreign).list()).length, 0);
    const task = await goals.addTask(goal.id, 'One authoritative task');
    assert.ok(task);
    const board = await kanban.createBoard('Pipeline');
    await client.request('POST', `plans/${board.id}/link`, { recordId: task.id });
    assert.equal((await kanban.getTasks())[0].id, task.id);
    await kanban.moveTask(task.id, 'done');
    assert.equal((await goals.get(goal.id))?.progress, 100);
    assert.equal((await goals.get(goal.id))?.parity?.agent, 'codex');
    assert.equal(await foreign.request('GET', `records/${task.id}`), null);
    await assert.rejects(
      foreign.request('POST', 'goals', { title: 'spoof', description: '', tenantId: 'tenant-a' }),
      /403/
    );
    await assert.rejects(
      new UnifiedLedgerClient({
        baseUrl,
        token: jwt.sign({ sub: 'same-user', tenantId: 'tenant-a' }),
        workspaceId: 'not-a-member',
      }).request('GET', 'goals'),
      /404/
    );
    await assert.rejects(
      new UnifiedLedgerClient({ baseUrl, token: 'invalid' }).request('GET', 'goals'),
      /401/
    );
    await assert.rejects(
      client.request('POST', `goals/missing/tasks`, { title: 'orphan', description: '' })
    );
    assert.equal((await client.request<any[]>('GET', 'records')).length, 1);
    const legacyGoal = {
      id: 'legacy-cli-goal',
      title: 'Imported goal',
      description: '',
      status: 'active',
      ownerUserId: 'same-user',
      tasks: [{ id: 'legacy-cli-task', description: 'Retained task', completed: true }],
      tags: ['legacy'],
      category: 'migration',
      priority: 'high',
    };
    const legacyBoard = {
      id: 'legacy-board',
      name: 'Imported board',
      ownerUserId: 'same-user',
      tasks: [{ id: 'legacy-card', title: 'Retained card', column: 'doing', priority: 'medium' }],
    };
    assert.equal(
      (
        await client.request<any>('POST', 'migrations/cli', {
          goals: [legacyGoal],
          boards: [legacyBoard],
        })
      ).imported,
      2
    );
    assert.equal(
      (
        await client.request<any>('POST', 'migrations/cli', {
          goals: [legacyGoal],
          boards: [legacyBoard],
        })
      ).skipped,
      2
    );
    assert.equal((await goals.get('legacy-cli-goal'))?.progress, 100);
    assert.equal(
      (await new KanbanService(client).loadBoard('legacy-board')).tasks[0].column,
      'doing'
    );
    await assert.rejects(
      client.request('POST', 'migrations/cli', {
        goals: [{ ...legacyGoal, id: 'foreign-import', ownerUserId: 'other-user' }],
        claimUnowned: true,
      })
    );
    await kanban.deleteTask(task.id);
    assert.equal((await kanban.getTasks()).length, 0);
  } finally {
    await app.close();
    if (previous === undefined) delete process.env.UNIFIED_LEDGER_ROOT;
    else process.env.UNIFIED_LEDGER_ROOT = previous;
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('legacy files are not adopted automatically; explicit imports verify owners and roll back conflicts', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnf-ledger-migrate-'));
  const oldRoot = process.env.UNIFIED_LEDGER_ROOT,
    oldPath = process.env.UNIFIED_LEDGER_STORE_PATH;
  delete process.env.UNIFIED_LEDGER_ROOT;
  process.env.UNIFIED_LEDGER_STORE_PATH = path.join(root, 'legacy.json');
  try {
    const original = '{"records":[],"goals":[],"plans":[],"timelineEvents":[]}';
    await fs.writeFile(process.env.UNIFIED_LEDGER_STORE_PATH, original);
    const service = new UnifiedLedgerService();
    const scope = { tenantId: 'tenant-a', workspaceId: 'personal' };
    assert.deepEqual(await service.listGoals({ owner: 'owner-a', ...scope }), []);
    assert.equal(await fs.readFile(process.env.UNIFIED_LEDGER_STORE_PATH, 'utf8'), original);
    const goal = {
      id: 'legacy-goal',
      title: 'Preserved',
      description: '',
      status: 'active' as const,
      owner: 'owner-a',
      linkedRecordIds: [],
      milestones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const legacy = { records: [], goals: [goal], plans: [], timelineEvents: [] };
    assert.equal((await service.importLegacyStore(legacy, 'owner-a', scope)).imported, 1);
    assert.equal((await service.importLegacyStore(legacy, 'owner-a', scope)).skipped, 1);
    await assert.rejects(
      service.importLegacyStore(
        { ...legacy, goals: [{ ...goal, title: 'overwrite' }] },
        'owner-a',
        scope
      ),
      /ID conflict/
    );
    await assert.rejects(service.importLegacyStore(legacy, 'owner-b', scope), /owner mismatch/);
    assert.equal((await service.getGoal(goal.id, 'owner-a', scope))?.title, 'Preserved');
    assert.equal(await fs.readFile(process.env.UNIFIED_LEDGER_STORE_PATH, 'utf8'), original);
  } finally {
    if (oldRoot === undefined) delete process.env.UNIFIED_LEDGER_ROOT;
    else process.env.UNIFIED_LEDGER_ROOT = oldRoot;
    if (oldPath === undefined) delete process.env.UNIFIED_LEDGER_STORE_PATH;
    else process.env.UNIFIED_LEDGER_STORE_PATH = oldPath;
    await fs.rm(root, { recursive: true, force: true });
  }
});
