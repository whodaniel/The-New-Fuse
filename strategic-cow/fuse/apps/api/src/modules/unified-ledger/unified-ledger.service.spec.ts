import { describe, expect, it } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UnifiedLedgerService } from './unified-ledger.service';

describe('UnifiedLedgerService personal timeline ownership', () => {
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
});
