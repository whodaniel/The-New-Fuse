import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { UnifiedLedgerController } from './unified-ledger.controller';

describe('UnifiedLedgerController timeline auth scoping', () => {
  const ledger = {
    listRecords: jest.fn(),
    getRecord: jest.fn(),
    createRecord: jest.fn(),
    updateRecord: jest.fn(),
    voteRecord: jest.fn(),
    addFeedbackIteration: jest.fn(),
    addFunctionalLink: jest.fn(),
    getGrid: jest.fn(),
    listTimelineEvents: jest.fn(),
    getTimelineEvent: jest.fn(),
    createTimelineEvent: jest.fn(),
    updateTimelineEvent: jest.fn(),
    deleteTimelineEvent: jest.fn(),
    bootstrapPersonalTimeline: jest.fn(),
    importGithubNarrativeTimeline: jest.fn(),
    getGithubNarrativeGraph: jest.fn(),
  } as any;

  const db = {
    workspaces: {
      findByIdWithOwner: jest.fn(),
    },
    workspaceMembers: {
      findMembership: jest.fn(),
    },
  } as any;

  const controller = new UnifiedLedgerController(ledger, db);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists timeline events scoped to authenticated id', async () => {
    ledger.listTimelineEvents.mockResolvedValue([{ id: 'evt_1' }]);

    const result = await controller.timeline(
      { id: 'user-1' },
      'owner-1',
      'record-1',
      'goal-1',
      'plan-1',
      'historical_event',
      'user-1',
      '2026-01-01T00:00:00.000Z',
      '2026-12-31T23:59:59.999Z',
      'tnf_platform_development'
    );

    expect(result).toEqual([{ id: 'evt_1' }]);
    expect(ledger.listTimelineEvents).toHaveBeenCalledWith({
      userId: 'owner-1',
      viewerUserId: 'user-1',
      recordId: 'record-1',
      goalId: 'goal-1',
      planId: 'plan-1',
      eventType: 'historical_event',
      actor: 'user-1',
      dateFrom: '2026-01-01T00:00:00.000Z',
      dateTo: '2026-12-31T23:59:59.999Z',
      timelineTrack: 'tnf_platform_development',
    });
  });

  it('lists unified records scoped to authenticated owner', async () => {
    ledger.listRecords.mockResolvedValue([{ id: 'rec-1' }]);
    const result = await controller.list(
      { id: 'owner-1' },
      'task',
      'submitted',
      undefined,
      undefined,
      'query'
    );
    expect(result).toEqual([{ id: 'rec-1' }]);
    expect(ledger.listRecords).toHaveBeenCalledWith({
      owner: 'owner-1',
      kind: 'task',
      status: 'submitted',
      lane: undefined,
      horizon: undefined,
      q: 'query',
    });
  });

  it('overrides record owner with authenticated user on create/patch', async () => {
    ledger.createRecord.mockResolvedValue({ id: 'rec-created' });
    ledger.updateRecord.mockResolvedValue({ id: 'rec-updated' });

    const created = await controller.create(
      { id: 'owner-2' },
      { title: 'T', description: 'D', owner: 'spoofed-owner' }
    );
    expect(created).toEqual({ id: 'rec-created' });
    expect(ledger.createRecord).toHaveBeenCalledWith({
      title: 'T',
      description: 'D',
      owner: 'owner-2',
      source: 'api',
    });

    const patched = await controller.patch({ id: 'owner-2' }, 'rec-1', {
      title: 'updated',
      owner: 'spoofed-owner',
    });
    expect(patched).toEqual({ id: 'rec-updated' });
    expect(ledger.updateRecord).toHaveBeenCalledWith(
      'rec-1',
      { title: 'updated', owner: 'owner-2' },
      'owner-2'
    );
  });

  it('accepts sub claim as fallback user id', async () => {
    ledger.getTimelineEvent.mockResolvedValue({ id: 'evt_2' });
    const result = await controller.timelineEvent({ sub: 'user-sub' }, 'evt_2');
    expect(result).toEqual({ id: 'evt_2' });
    expect(ledger.getTimelineEvent).toHaveBeenCalledWith('evt_2', 'user-sub');
  });

  it('rejects timeline access without authenticated user id', async () => {
    await expect(controller.timeline(undefined as any)).rejects.toBeInstanceOf(
      UnauthorizedException
    );
    expect(ledger.listTimelineEvents).not.toHaveBeenCalled();
  });

  it('overrides createTimelineEvent userId with authenticated user', async () => {
    ledger.createTimelineEvent.mockResolvedValue({ id: 'evt_3' });

    const result = await controller.createTimelineEvent(
      { id: 'auth-user' },
      {
        userId: 'spoofed-user',
        eventType: 'historical_event',
        payload: { title: 'T1' },
      }
    );

    expect(result).toEqual({ id: 'evt_3' });
    expect(ledger.createTimelineEvent).toHaveBeenCalledWith({
      userId: 'auth-user',
      eventType: 'historical_event',
      payload: { title: 'T1' },
    });
  });

  it('overrides updateTimelineEvent userId with authenticated user', async () => {
    ledger.updateTimelineEvent.mockResolvedValue({ id: 'evt_4' });

    const result = await controller.patchTimelineEvent({ id: 'auth-user' }, 'evt_4', {
      userId: 'spoofed-user',
      payload: { title: 'Updated' },
    });

    expect(result).toEqual({ id: 'evt_4' });
    expect(ledger.updateTimelineEvent).toHaveBeenCalledWith('evt_4', {
      userId: 'auth-user',
      payload: { title: 'Updated' },
    });
  });

  it('passes authenticated user to deleteTimelineEvent', async () => {
    ledger.deleteTimelineEvent.mockResolvedValue(true);
    const result = await controller.deleteTimelineEvent({ id: 'auth-user' }, 'evt_5');
    expect(result).toBe(true);
    expect(ledger.deleteTimelineEvent).toHaveBeenCalledWith('evt_5', 'auth-user');
  });

  it('bootstraps timeline only for authenticated current user', async () => {
    ledger.bootstrapPersonalTimeline.mockResolvedValue({
      message: 'Generated',
      createdCount: 3,
      totalCount: 3,
      events: [],
    });

    const result = await controller.bootstrapPersonalTimeline({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User One',
      role: 'member',
      roles: ['member'],
    });

    expect(result).toEqual({
      message: 'Generated',
      createdCount: 3,
      totalCount: 3,
      events: [],
    });
    expect(ledger.bootstrapPersonalTimeline).toHaveBeenCalledWith('user-1', {
      email: 'user@example.com',
      name: 'User One',
      role: 'member',
      roles: ['member'],
    });
  });

  it('bootstraps timeline when authenticated claim uses user_id', async () => {
    ledger.bootstrapPersonalTimeline.mockResolvedValue({
      message: 'Generated',
      createdCount: 2,
      totalCount: 2,
      events: [],
    });

    const result = await controller.bootstrapPersonalTimeline({
      user_id: 'user-claim-1',
      email: 'claim@example.com',
      name: 'Claim User',
      role: 'member',
      roles: ['member'],
    });

    expect(result.createdCount).toBe(2);
    expect(ledger.bootstrapPersonalTimeline).toHaveBeenCalledWith('user-claim-1', {
      email: 'claim@example.com',
      name: 'Claim User',
      role: 'member',
      roles: ['member'],
    });
  });

  it('rejects timeline bootstrap when no authenticated user id is present', async () => {
    await expect(controller.bootstrapPersonalTimeline({})).rejects.toBeInstanceOf(
      UnauthorizedException
    );
    expect(ledger.bootstrapPersonalTimeline).not.toHaveBeenCalled();
  });

  it('imports GitHub narrative timeline using authenticated user scope', async () => {
    ledger.importGithubNarrativeTimeline.mockResolvedValue({
      message: 'Imported 4 events',
      importedCount: 4,
      skippedCount: 0,
      removedCount: 0,
      trackSummaries: [{ timelineId: 'tnf_platform_evolution', total: 4, imported: 4, skipped: 0 }],
      connectionCount: 2,
      matchedConnectionCount: 4,
      totalCount: 17,
      generatedAt: '2026-05-05T02:23:19.000Z',
    });

    const body = {
      reportPath: '/tmp/whodaniel-github-history-narrative.json',
      replaceExisting: true,
      actor: 'github-sync-agent',
    };
    const result = await controller.importGithubNarrativeTimeline({ id: 'owner-1' }, body);

    expect(result.importedCount).toBe(4);
    expect(ledger.importGithubNarrativeTimeline).toHaveBeenCalledWith('owner-1', body);
  });

  it('returns github narrative graph scoped to authenticated user and optional owner view', async () => {
    ledger.getGithubNarrativeGraph.mockResolvedValue({
      ownerUserId: 'owner-graph',
      eventCount: 12,
      nodeCount: 6,
      edgeCount: 5,
      generatedAt: '2026-05-05T02:23:19.000Z',
      nodes: [],
      edges: [],
    });

    const result = await controller.githubNarrativeGraph(
      { id: 'viewer-1' },
      'owner-graph',
      'tnf_platform_evolution'
    );

    expect(result.edgeCount).toBe(5);
    expect(ledger.getGithubNarrativeGraph).toHaveBeenCalledWith({
      userId: 'owner-graph',
      viewerUserId: 'viewer-1',
      timelineTrack: 'tnf_platform_evolution',
    });
  });

  it('denies write when workspace does not exist', async () => {
    db.workspaces.findByIdWithOwner.mockResolvedValueOnce(null);

    await expect(
      controller.create(
        { id: 'author-1' },
        { title: 'Private note', description: 'Body', workspaceId: 'ws-missing' }
      )
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(db.workspaces.findByIdWithOwner).toHaveBeenCalledWith('ws-missing');
    expect(ledger.createRecord).not.toHaveBeenCalled();
  });

  it('denies write when user lacks workspace ownership and membership', async () => {
    db.workspaces.findByIdWithOwner.mockResolvedValueOnce({
      id: 'ws-1',
      ownerId: 'owner-1',
    });
    db.workspaceMembers.findMembership.mockResolvedValueOnce(null);

    await expect(
      controller.patch({ id: 'user-2' }, 'rec-1', { title: 'updated', workspaceId: 'ws-1' })
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(db.workspaceMembers.findMembership).toHaveBeenCalledWith('ws-1', 'user-2');
    expect(ledger.updateRecord).not.toHaveBeenCalled();
  });

  it('allows write when user is a workspace member', async () => {
    db.workspaces.findByIdWithOwner.mockResolvedValueOnce({
      id: 'ws-2',
      ownerId: 'owner-2',
    });
    db.workspaceMembers.findMembership.mockResolvedValueOnce({
      id: 'wm-1',
      workspaceId: 'ws-2',
      userId: 'member-1',
      role: 'member',
    });
    ledger.createRecord.mockResolvedValueOnce({ id: 'rec-member-1' });

    const result = await controller.create(
      { id: 'member-1' },
      { title: 'Allowed', description: 'Scoped', workspaceId: 'ws-2' }
    );

    expect(result).toEqual({ id: 'rec-member-1' });
    expect(ledger.createRecord).toHaveBeenCalledWith({
      title: 'Allowed',
      description: 'Scoped',
      workspaceId: 'ws-2',
      owner: 'member-1',
      source: 'api',
    });
  });

  it('denies write when request workspaceId mismatches authenticated workspace scope', async () => {
    await expect(
      controller.create({ id: 'user-10', workspaceId: 'ws-auth-1' } as any, {
        title: 'Scoped write',
        description: 'Mismatch should fail',
        workspaceId: 'ws-other-2',
      })
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(ledger.createRecord).not.toHaveBeenCalled();
    expect(db.workspaces.findByIdWithOwner).not.toHaveBeenCalled();
  });

  it('denies write when request tenantId mismatches authenticated tenant scope', async () => {
    await expect(
      controller.create({ id: 'user-11', tenantId: 'tenant-auth-1' } as any, {
        title: 'Scoped write',
        description: 'Tenant mismatch should fail',
        tenantId: 'tenant-other-2',
      })
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(ledger.createRecord).not.toHaveBeenCalled();
  });

  it('denies patch when request tenantId mismatches authenticated tenant scope', async () => {
    await expect(
      controller.patch({ id: 'user-12', tenantId: 'tenant-auth-1' } as any, 'rec-1', {
        title: 'Tenant mismatch patch',
        tenantId: 'tenant-other-2',
      })
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(ledger.getRecord).not.toHaveBeenCalled();
    expect(ledger.updateRecord).not.toHaveBeenCalled();
  });

  it('derives workspace from existing record for writes when workspaceId is omitted', async () => {
    ledger.getRecord.mockResolvedValueOnce({
      id: 'rec-owned-1',
      owner: 'owner-55',
      workspaceId: 'ws-derived-1',
    });
    db.workspaces.findByIdWithOwner.mockResolvedValueOnce({
      id: 'ws-derived-1',
      ownerId: 'owner-55',
    });
    ledger.updateRecord.mockResolvedValueOnce({ id: 'rec-owned-1' });

    const result = await controller.patch({ id: 'owner-55' }, 'rec-owned-1', {
      title: 'Derived workspace write',
    });

    expect(result).toEqual({ id: 'rec-owned-1' });
    expect(db.workspaces.findByIdWithOwner).toHaveBeenCalledWith('ws-derived-1');
    expect(ledger.updateRecord).toHaveBeenCalledWith(
      'rec-owned-1',
      {
        title: 'Derived workspace write',
        owner: 'owner-55',
        workspaceId: 'ws-derived-1',
      },
      'owner-55',
      { workspaceId: 'ws-derived-1' }
    );
  });
});
