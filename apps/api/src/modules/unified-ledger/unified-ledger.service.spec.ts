import { describe, expect, it } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UnifiedLedgerService } from './unified-ledger.service';

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

  it('allows delegated agent users to read owner timeline when explicitly authorized', async () => {
    const tmpStorePath = path.join(
      '/tmp',
      `tnf-unified-ledger-agent-read-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`
    );
    process.env.UNIFIED_LEDGER_STORE_PATH = tmpStorePath;
    process.env.TIMELINE_PRIVATE_OWNER_USER_ID = 'owner-user';
    process.env.TIMELINE_PRIVATE_AGENT_USER_IDS = 'agent-user';

    const service = new UnifiedLedgerService();
    await service.onModuleInit();

    await service.createTimelineEvent({
      userId: 'owner-user',
      actor: 'owner-user',
      eventType: 'historical_event',
      payload: {
        title: 'Private owner milestone',
      },
    });

    const denied = await service.listTimelineEvents({
      viewerUserId: 'stranger-user',
      userId: 'owner-user',
    });
    expect(denied.length).toBe(0);

    const allowed = await service.listTimelineEvents({
      viewerUserId: 'agent-user',
      userId: 'owner-user',
    });
    expect(allowed.length).toBeGreaterThan(0);
    expect(allowed[0].userId).toBe('owner-user');

    delete process.env.TIMELINE_PRIVATE_OWNER_USER_ID;
    delete process.env.TIMELINE_PRIVATE_AGENT_USER_IDS;
    delete process.env.UNIFIED_LEDGER_STORE_PATH;
    await fs.rm(tmpStorePath, { force: true });
  });

  it('allows delegated workspace members to read owner timeline without global env allowlist', async () => {
    const tmpStorePath = path.join(
      '/tmp',
      `tnf-unified-ledger-workspace-access-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`
    );
    process.env.UNIFIED_LEDGER_STORE_PATH = tmpStorePath;
    process.env.TIMELINE_PRIVATE_OWNER_USER_ID = 'owner-user';
    process.env.TIMELINE_PRIVATE_AGENT_USER_IDS = '';

    const mockDb = {
      workspaceMembers: {
        listByUser: async (userId: string) =>
          userId === 'agent-user' ? [{ workspaceId: 'ws-owner', role: 'member' }] : [],
      },
      workspaces: {
        findByOwnerWithOwner: async (ownerId: string) =>
          ownerId === 'owner-user' ? [{ id: 'ws-owner' }] : [],
      },
    };

    const service = new UnifiedLedgerService(mockDb as any);
    await service.onModuleInit();

    await service.createTimelineEvent({
      userId: 'owner-user',
      actor: 'owner-user',
      eventType: 'historical_event',
      payload: {
        title: 'Private owner milestone',
      },
    });

    const allowed = await service.listTimelineEvents({
      viewerUserId: 'agent-user',
      userId: 'owner-user',
    });
    expect(allowed.length).toBeGreaterThan(0);
    expect(allowed[0].userId).toBe('owner-user');

    const denied = await service.listTimelineEvents({
      viewerUserId: 'stranger-user',
      userId: 'owner-user',
    });
    expect(denied.length).toBe(0);

    delete process.env.TIMELINE_PRIVATE_OWNER_USER_ID;
    delete process.env.TIMELINE_PRIVATE_AGENT_USER_IDS;
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
      return payload.title === 'Personal Origin Anchor (Private)';
    });

    expect(result.createdCount).toBeGreaterThan(1);
    expect(birthEvent).toBeDefined();
    expect(result.events.every((event) => event.userId === 'user-daniel-name-only')).toBe(true);

    delete process.env.UNIFIED_LEDGER_STORE_PATH;
    await fs.rm(tmpStorePath, { force: true });
  });

  it('imports GitHub narrative events idempotently for owner-scoped timeline tracks', async () => {
    const tmpStorePath = path.join(
      '/tmp',
      `tnf-unified-ledger-github-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`
    );
    process.env.UNIFIED_LEDGER_STORE_PATH = tmpStorePath;

    const service = new UnifiedLedgerService();
    await service.onModuleInit();

    const report = {
      generated_at_utc: '2026-05-05T02:23:19Z',
      parallel_timelines: [
        {
          timeline_id: 'tnf_platform_evolution',
          description: 'Core TNF/Fuse architecture evolution.',
          events: [
            {
              date: '2025-01-17',
              title: 'The-New-Fuse initial repo appears',
              track: 'tnf-core',
              evidence: { type: 'repo_created', repo: 'whodaniel/The-New-Fuse' },
            },
            {
              date: '2025-04-11',
              title: 'Fuse core repo begins',
              track: 'tnf-core',
              evidence: { type: 'repo_created', repo: 'whodaniel/fuse' },
            },
          ],
        },
      ],
      narrative_connections: [
        {
          from: 'whodaniel/The-New-Fuse',
          to: 'whodaniel/fuse',
          connection_type: 'architectural_refinement',
        },
      ],
    };

    const first = await service.importGithubNarrativeTimeline('owner-user', { report });
    expect(first.importedCount).toBe(2);
    expect(first.skippedCount).toBe(0);
    expect(first.trackSummaries[0]?.timelineId).toBe('tnf_platform_evolution');
    expect(first.connectionCount).toBe(1);
    expect(first.matchedConnectionCount).toBe(2);

    const second = await service.importGithubNarrativeTimeline('owner-user', { report });
    expect(second.importedCount).toBe(0);
    expect(second.skippedCount).toBe(2);

    const otherUserImport = await service.importGithubNarrativeTimeline('other-user', { report });
    expect(otherUserImport.importedCount).toBe(2);

    const ownerEvents = await service.listTimelineEvents({ userId: 'owner-user' });
    const otherEvents = await service.listTimelineEvents({ userId: 'other-user' });
    const ownerImported = ownerEvents.filter((event) => {
      const payload = event.payload as Record<string, unknown>;
      return payload.source === 'github-history-import';
    });
    const otherImported = otherEvents.filter((event) => {
      const payload = event.payload as Record<string, unknown>;
      return payload.source === 'github-history-import';
    });

    expect(ownerImported).toHaveLength(2);
    expect(otherImported).toHaveLength(2);
    expect(ownerImported.every((event) => event.userId === 'owner-user')).toBe(true);
    expect(otherImported.every((event) => event.userId === 'other-user')).toBe(true);
    const ownerConnectionPayloads = ownerImported
      .map((event) => event.payload as Record<string, unknown>)
      .map((payload) => payload.narrativeConnections)
      .filter((value) => Array.isArray(value));
    expect(ownerConnectionPayloads.length).toBeGreaterThan(0);

    const replaced = await service.importGithubNarrativeTimeline('owner-user', {
      report,
      replaceExisting: true,
    });
    expect(replaced.removedCount).toBe(2);
    expect(replaced.importedCount).toBe(2);
    expect(replaced.connectionCount).toBe(1);

    delete process.env.UNIFIED_LEDGER_STORE_PATH;
    await fs.rm(tmpStorePath, { force: true });
  });

  it('builds github narrative graph from imported owner-scoped events', async () => {
    const tmpStorePath = path.join(
      '/tmp',
      `tnf-unified-ledger-github-graph-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`
    );
    process.env.UNIFIED_LEDGER_STORE_PATH = tmpStorePath;

    const service = new UnifiedLedgerService();
    await service.onModuleInit();

    const report = {
      generated_at_utc: '2026-05-05T02:23:19Z',
      parallel_timelines: [
        {
          timeline_id: 'tnf_platform_evolution',
          description: 'Core TNF/Fuse architecture evolution.',
          events: [
            {
              date: '2025-01-17',
              title: 'The-New-Fuse initial repo appears',
              track: 'tnf-core',
              evidence: { type: 'repo_created', repo: 'whodaniel/The-New-Fuse' },
            },
            {
              date: '2025-04-11',
              title: 'Fuse core repo begins',
              track: 'tnf-core',
              evidence: { type: 'repo_created', repo: 'whodaniel/fuse' },
            },
          ],
        },
      ],
      narrative_connections: [
        {
          from: 'whodaniel/The-New-Fuse',
          to: 'whodaniel/fuse',
          connection_type: 'architectural_refinement',
          rationale: 'lineage',
        },
      ],
    };

    await service.importGithubNarrativeTimeline('owner-user', { report });
    const graph = await service.getGithubNarrativeGraph({
      userId: 'owner-user',
      viewerUserId: 'owner-user',
    });

    expect(graph.eventCount).toBe(2);
    expect(graph.nodeCount).toBeGreaterThanOrEqual(2);
    expect(graph.edgeCount).toBeGreaterThanOrEqual(1);
    expect(graph.edges.some((edge) => edge.connectionType === 'architectural_refinement')).toBe(
      true
    );

    const denied = await service.getGithubNarrativeGraph({
      userId: 'owner-user',
      viewerUserId: 'other-user',
    });
    expect(denied.eventCount).toBe(0);
    expect(denied.edgeCount).toBe(0);

    delete process.env.UNIFIED_LEDGER_STORE_PATH;
    await fs.rm(tmpStorePath, { force: true });
  });
});
