import { describe, expect, it } from '@jest/globals.js';
import * as fs from 'fs/promises.js';
import * as path from 'path';
import { UnifiedLedgerService } from './unified-ledger.service.js';

describe('UnifiedLedgerService personal timeline ownership', () => {
  it('enforces owner scoping for unified records and aggregates', async () => {
    const tmpStorePath = path.join(
      '/tmp',
      `tnf-unified-ledger-records-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`
    );
    process.env.UNIFIED_LEDGER_STORE_PATH = tmpStorePath;

    const service = new UnifiedLedgerService();
    await service.onModuleInit();

    const recordA = await service.createRecord({
      kind: 'task',
      title: 'Owner A record',
      description: 'Private to owner A',
      owner: 'owner-a',
    });
    await service.createRecord({
      kind: 'task',
      title: 'Owner B record',
      description: 'Private to owner B',
      owner: 'owner-b',
    });

    const rowsA = await service.listRecords({ owner: 'owner-a' });
    const rowsB = await service.listRecords({ owner: 'owner-b' });
    expect(rowsA.length).toBe(1);
    expect(rowsA[0].id).toBe(recordA.id);
    expect(rowsB.length).toBe(1);
    expect(rowsB[0].owner).toBe('owner-b');

    const forbiddenRead = await service.getRecord(recordA.id, 'owner-b');
    expect(forbiddenRead).toBeNull();

    const allowedRead = await service.getRecord(recordA.id, 'owner-a');
    expect(allowedRead?.id).toBe(recordA.id);

    const forbiddenUpdate = await service.updateRecord(
      recordA.id,
      { title: 'should not update' },
      'owner-b'
    );
    expect(forbiddenUpdate).toBeNull();

    const allowedUpdate = await service.updateRecord(
      recordA.id,
      { title: 'updated by owner' },
      'owner-a'
    );
    expect(allowedUpdate?.title).toBe('updated by owner');

    const forbiddenVote = await service.voteRecord(recordA.id, 'up', 'owner-b');
    expect(forbiddenVote).toBeNull();

    const allowedVote = await service.voteRecord(recordA.id, 'up', 'owner-a');
    expect(allowedVote?.votes.up).toBe(1);

    const gridA = await service.getGrid('owner-a');
    const gridB = await service.getGrid('owner-b');
    expect(gridA.total).toBe(1);
    expect(gridB.total).toBe(1);

    delete process.env.UNIFIED_LEDGER_STORE_PATH;
    await fs.rm(tmpStorePath, { force: true });
  });

  it('enforces user ownership for timeline list/update/delete', async () => {
    const tmpStorePath = path.join(
      '/tmp',
      `tnf-unified-ledger-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`
    );
    process.env.UNIFIED_LEDGER_STORE_PATH = tmpStorePath;

    const service = new UnifiedLedgerService();
    await service.onModuleInit();

    const created = await service.createTimelineEvent({
      userId: 'user-a',
      actor: 'user-a',
      eventType: 'historical_event',
      payload: {
        title: 'Account created',
        description: 'Initial personal milestone',
        point: 12,
      },
    });

    const mine = await service.listTimelineEvents({ userId: 'user-a' });
    const others = await service.listTimelineEvents({ userId: 'user-b' });
    expect(mine.some((row) => row.id === created.id)).toBe(true);
    expect(others.some((row) => row.id === created.id)).toBe(false);

    const crossUserEdit = await service.updateTimelineEvent(created.id, {
      userId: 'user-b',
      actor: 'user-b',
      payload: { title: 'hijack' },
    });
    expect(crossUserEdit).toBeNull();

    const ownEdit = await service.updateTimelineEvent(created.id, {
      userId: 'user-a',
      actor: 'user-a',
      payload: { title: 'Updated title' },
    });
    expect(ownEdit).not.toBeNull();
    expect((ownEdit?.payload as Record<string, unknown>).title).toBe('Updated title');

    const ownRead = await service.getTimelineEvent(created.id, 'user-a');
    const crossUserRead = await service.getTimelineEvent(created.id, 'user-b');
    expect(ownRead).not.toBeNull();
    expect(crossUserRead).toBeNull();

    const crossUserDelete = await service.deleteTimelineEvent(created.id, 'user-b');
    expect(crossUserDelete).toBe(false);

    const ownDelete = await service.deleteTimelineEvent(created.id, 'user-a');
    expect(ownDelete).toBe(true);

    const afterDelete = await service.getTimelineEvent(created.id);
    expect(afterDelete).toBeNull();

    delete process.env.UNIFIED_LEDGER_STORE_PATH;
    await fs.rm(tmpStorePath, { force: true });
  });

  it('enforces owner scoping for goals and plans linkage operations', async () => {
    const tmpStorePath = path.join(
      '/tmp',
      `tnf-unified-ledger-goals-plans-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`
    );
    process.env.UNIFIED_LEDGER_STORE_PATH = tmpStorePath;

    const service = new UnifiedLedgerService();
    await service.onModuleInit();

    const record = await service.createRecord({
      kind: 'task',
      title: 'Scoped record',
      description: 'Record to link',
      owner: 'user-a',
    });

    const goalA = await service.createGoal({
      title: 'Goal A',
      description: 'Owned by user-a',
      owner: 'user-a',
    });
    await service.createGoal({
      title: 'Goal B',
      description: 'Owned by user-b',
      owner: 'user-b',
    });

    const goalsA = await service.listGoals({ owner: 'user-a' });
    const goalsB = await service.listGoals({ owner: 'user-b' });
    expect(goalsA.some((g) => g.id === goalA.id)).toBe(true);
    expect(goalsB.some((g) => g.id === goalA.id)).toBe(false);

    const forbiddenGoalLink = await service.linkGoalToRecord(
      goalA.id,
      record.id,
      'user-b',
      'user-b'
    );
    expect(forbiddenGoalLink).toBeNull();

    const goalLink = await service.linkGoalToRecord(goalA.id, record.id, 'user-a', 'user-a');
    expect(goalLink?.linkedRecordIds.includes(record.id)).toBe(true);

    const forbiddenMilestone = await service.addGoalMilestone(goalA.id, {
      owner: 'user-b',
      title: 'No access',
    });
    expect(forbiddenMilestone).toBeNull();

    const milestoneGoal = await service.addGoalMilestone(goalA.id, {
      owner: 'user-a',
      title: 'Allowed milestone',
    });
    expect(milestoneGoal?.milestones.length).toBe(1);

    const planA = await service.createPlan({
      name: 'Plan A',
      objective: 'Owned by user-a',
      owner: 'user-a',
    });
    await service.createPlan({
      name: 'Plan B',
      objective: 'Owned by user-b',
      owner: 'user-b',
    });

    const plansA = await service.listPlans({ owner: 'user-a' });
    const plansB = await service.listPlans({ owner: 'user-b' });
    expect(plansA.some((p) => p.id === planA.id)).toBe(true);
    expect(plansB.some((p) => p.id === planA.id)).toBe(false);

    const forbiddenPlanLink = await service.linkPlan(planA.id, {
      owner: 'user-b',
      recordId: record.id,
      actor: 'user-b',
    });
    expect(forbiddenPlanLink).toBeNull();

    const allowedPlanLink = await service.linkPlan(planA.id, {
      owner: 'user-a',
      recordId: record.id,
      goalId: goalA.id,
      actor: 'user-a',
    });
    expect(allowedPlanLink?.linkedRecordIds.includes(record.id)).toBe(true);
    expect(allowedPlanLink?.linkedGoalIds.includes(goalA.id)).toBe(true);

    const scopedConnections = await service.getRecordConnections(record.id, 'user-a');
    expect(scopedConnections.goals.every((g) => g.owner === 'user-a')).toBe(true);
    expect(scopedConnections.plans.every((p) => p.owner === 'user-a')).toBe(true);

    delete process.env.UNIFIED_LEDGER_STORE_PATH;
    await fs.rm(tmpStorePath, { force: true });
  });

  it('bootstraps private personal timeline segments idempotently per user', async () => {
    const tmpStorePath = path.join(
      '/tmp',
      `tnf-unified-ledger-bootstrap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`
    );
    process.env.UNIFIED_LEDGER_STORE_PATH = tmpStorePath;

    const service = new UnifiedLedgerService();
    await service.onModuleInit();

    const first = await service.bootstrapPersonalTimeline('user-daniel', {
      email: 'owner@example.com',
      name: 'Daniel Who',
    });
    expect(first.createdCount).toBeGreaterThan(1);
    expect(first.events.every((event) => event.userId === 'user-daniel')).toBe(true);
    expect(
      first.events.some(
        (event) =>
          (event.payload as Record<string, unknown>).source === 'personal-timeline-bootstrap'
      )
    ).toBe(true);
    expect(
      first.events.some(
        (event) => typeof (event.payload as Record<string, unknown>).category === 'string'
      )
    ).toBe(true);

    const second = await service.bootstrapPersonalTimeline('user-daniel', {
      email: 'owner@example.com',
      name: 'Daniel Who',
    });
    expect(second.createdCount).toBe(0);
    expect(second.totalCount).toBe(first.totalCount);

    const otherUser = await service.bootstrapPersonalTimeline('user-other', {
      email: 'other@example.com',
      name: 'Other User',
    });
    expect(otherUser.events.every((event) => event.userId === 'user-other')).toBe(true);
    expect(otherUser.totalCount).toBeGreaterThan(0);

    const danielEvents = await service.listTimelineEvents({ userId: 'user-daniel' });
    const otherEvents = await service.listTimelineEvents({ userId: 'user-other' });
    expect(danielEvents.length).toBe(first.totalCount);
    expect(otherEvents.length).toBe(otherUser.totalCount);

    delete process.env.UNIFIED_LEDGER_STORE_PATH;
    await fs.rm(tmpStorePath, { force: true });
  });

  it('applies Daniel-specific timeline bootstrap when email claim is missing but name matches', async () => {
    const tmpStorePath = path.join(
      '/tmp',
      `tnf-unified-ledger-bootstrap-name-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`
    );
    process.env.UNIFIED_LEDGER_STORE_PATH = tmpStorePath;

    const service = new UnifiedLedgerService();
    await service.onModuleInit();

    const result = await service.bootstrapPersonalTimeline('user-daniel-name-only', {
      name: 'Daniel Who',
    });

    const birthEvent = result.events.find((event) => {
      const payload = event.payload as Record<string, unknown>;
      return payload.title === 'Birth: Daniel Adam Goldberg';
    });

    expect(result.createdCount).toBeGreaterThan(1);
    expect(birthEvent).toBeDefined();
    expect(result.events.every((event) => event.userId === 'user-daniel-name-only')).toBe(true);

    delete process.env.UNIFIED_LEDGER_STORE_PATH;
    await fs.rm(tmpStorePath, { force: true });
  });
});
