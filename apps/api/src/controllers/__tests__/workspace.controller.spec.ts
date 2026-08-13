import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { promises as dns } from 'node:dns';
import { WorkspaceController } from '../workspace.controller';

describe('WorkspaceController domain/bookmark flows', () => {
  let db: any;
  let controller: WorkspaceController;

  beforeEach(() => {
    db = {
      workspaces: {
        findByIdWithOwner: jest.fn().mockResolvedValue({
          id: 'ws_1',
          ownerId: 'user_1',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          owner: { email: 'owner@example.com' },
        }),
        findAllWithOwner: jest.fn().mockResolvedValue([]),
      },
      workspaceMembers: {
        findMembership: jest.fn().mockResolvedValue(null),
      },
      workspaceDomains: {
        listByWorkspace: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue({
          id: 'wd_1',
          workspaceId: 'ws_1',
          domain: 'example.com',
          status: 'pending',
          verificationMessage: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findByDomain: jest.fn().mockResolvedValue(null),
        addDomain: jest.fn().mockResolvedValue({
          id: 'wd_1',
          workspaceId: 'ws_1',
          domain: 'example.com',
          status: 'pending',
          verificationMessage: 'Add DNS records and verify from hosting.',
          createdByUserId: 'user_1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        removeDomain: jest.fn().mockResolvedValue(true),
        updateStatus: jest.fn().mockResolvedValue({
          id: 'wd_1',
          workspaceId: 'ws_1',
          domain: 'example.com',
          status: 'verified',
          verificationMessage: 'DNS records found: A -> 1.1.1.1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      workspaceBookmarks: {
        listByWorkspaceForUser: jest.fn().mockResolvedValue([]),
        findByUrlForUser: jest.fn().mockResolvedValue(null),
        findByIdForUser: jest.fn().mockResolvedValue({
          id: 'wb_1',
          workspaceId: 'ws_1',
          title: 'Existing',
          url: 'https://existing.example.com',
          tags: [],
          note: null,
          createdByUserId: 'user_1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        addBookmark: jest.fn().mockResolvedValue({
          id: 'wb_2',
          workspaceId: 'ws_1',
          title: 'TNF',
          url: 'https://thenewfuse.com',
          tags: ['tnf'],
          note: null,
          createdByUserId: 'user_1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        updateBookmarkForUser: jest.fn().mockResolvedValue({
          id: 'wb_1',
          workspaceId: 'ws_1',
          title: 'Updated',
          url: 'https://existing.example.com',
          tags: ['ops'],
          note: null,
          createdByUserId: 'user_1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        removeBookmarkForUser: jest.fn().mockResolvedValue(true),
      },
      users: {
        findById: jest.fn(),
        findByEmail: jest.fn(),
      },
    };

    controller = new WorkspaceController(db as any);
  });

  it('normalizes and creates workspace domain', async () => {
    const response = await controller.addWorkspaceDomain(
      'ws_1',
      { domain: 'https://WWW.Example.com/path' },
      'user_1'
    );

    expect(response.workspaceId).toBe('ws_1');
    expect(db.workspaceDomains.addDomain).toHaveBeenCalled();
    const payload = db.workspaceDomains.addDomain.mock.calls[0][0];
    expect(payload.domain).toBe('example.com');
    expect(payload.status).toBe('pending');
  });

  it('rejects domain already linked to another workspace', async () => {
    db.workspaceDomains.findByDomain.mockResolvedValueOnce({
      id: 'wd_99',
      workspaceId: 'ws_other',
      domain: 'example.com',
    });

    await expect(
      controller.addWorkspaceDomain('ws_1', { domain: 'example.com' }, 'user_1')
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('upserts bookmark by URL when URL already exists', async () => {
    db.workspaceBookmarks.findByUrlForUser.mockResolvedValueOnce({
      id: 'wb_existing',
      workspaceId: 'ws_1',
      title: 'Old',
      url: 'https://thenewfuse.com',
      tags: [],
      note: null,
      createdByUserId: 'user_1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await controller.addWorkspaceBookmark(
      'ws_1',
      { title: 'New Title', url: 'thenewfuse.com', tags: ['ops'] },
      'user_1'
    );

    expect(response.workspaceId).toBe('ws_1');
    expect(db.workspaceBookmarks.updateBookmarkForUser).toHaveBeenCalled();
    expect(db.workspaceBookmarks.addBookmark).not.toHaveBeenCalled();
  });

  it('lists bookmarks scoped to the current user', async () => {
    await controller.getWorkspaceBookmarks('ws_1', 'user_1');
    expect(db.workspaceBookmarks.listByWorkspaceForUser).toHaveBeenCalledWith('ws_1', 'user_1');
  });

  it('rejects bookmark update when URL conflicts with another bookmark', async () => {
    db.workspaceBookmarks.findByIdForUser.mockResolvedValueOnce({
      id: 'wb_1',
      workspaceId: 'ws_1',
      title: 'Current',
      url: 'https://current.example.com',
      tags: [],
      note: null,
      createdByUserId: 'user_1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    db.workspaceBookmarks.findByUrlForUser.mockResolvedValueOnce({
      id: 'wb_conflict',
      workspaceId: 'ws_1',
      title: 'Conflict',
      url: 'https://taken.example.com',
      tags: [],
      note: null,
      createdByUserId: 'user_1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      controller.updateWorkspaceBookmark('ws_1', 'wb_1', { url: 'taken.example.com' }, 'user_1')
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks workspace viewer from bookmark writes', async () => {
    db.workspaces.findByIdWithOwner.mockResolvedValueOnce({
      id: 'ws_1',
      ownerId: 'owner_user',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      owner: { email: 'owner@example.com' },
    });
    db.workspaceMembers.findMembership.mockResolvedValueOnce({
      workspaceId: 'ws_1',
      userId: 'viewer_user',
      role: 'viewer',
    });

    await expect(
      controller.addWorkspaceBookmark(
        'ws_1',
        { title: 'Viewer Bookmark', url: 'example.com' },
        'viewer_user'
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('removes bookmark and returns ids', async () => {
    const response = await controller.removeWorkspaceBookmark('ws_1', 'wb_1', 'user_1');
    expect(response).toEqual({ workspaceId: 'ws_1', bookmarkId: 'wb_1' });
    expect(db.workspaceBookmarks.removeBookmarkForUser).toHaveBeenCalledWith(
      'ws_1',
      'wb_1',
      'user_1'
    );
  });

  it('does not allow removing another user bookmark', async () => {
    db.workspaceBookmarks.removeBookmarkForUser.mockResolvedValueOnce(false);

    await expect(
      controller.removeWorkspaceBookmark('ws_1', 'wb_other', 'user_1')
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('verifies domain using DNS records and updates status', async () => {
    const cnameSpy = jest.spyOn(dns, 'resolveCname').mockRejectedValueOnce(new Error('no cname'));
    const resolve4Spy = jest.spyOn(dns, 'resolve4').mockResolvedValueOnce(['1.1.1.1']);
    const resolve6Spy = jest.spyOn(dns, 'resolve6').mockRejectedValueOnce(new Error('no aaaa'));

    const response = await controller.verifyWorkspaceDomain('ws_1', 'wd_1', 'user_1');

    expect(response.workspaceId).toBe('ws_1');
    expect(db.workspaceDomains.updateStatus).toHaveBeenCalledWith(
      'ws_1',
      'wd_1',
      'verified',
      expect.stringContaining('A -> 1.1.1.1')
    );

    cnameSpy.mockRestore();
    resolve4Spy.mockRestore();
    resolve6Spy.mockRestore();
  });

  it('syncs HostMaria ops for bizsynth owner account', async () => {
    db.workspaces.findByIdWithOwner.mockResolvedValueOnce({
      id: 'ws_1',
      ownerId: 'user_1',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      owner: { email: 'owner@example.com' },
    });

    const inputs = {
      configPath: '/Users/<owner>/.tnf/hostmaria/projects.txt',
      reportPath: '/Users/<owner>/.tnf/hostmaria/reports/hostmaria-preservation-latest.json',
      archivePath: '/Users/<owner>/.tnf/hostmaria/archive/latest-archive-summary.json',
      targets: ['hostmaria.com'],
      latestReport: { status: 'ok' },
      latestArchive: { archivedAt: '2026-03-25T11:27:14.485Z' },
    };

    const readInputsSpy = jest
      .spyOn(controller as any, 'readHostMariaSyncInputs')
      .mockResolvedValue(inputs);
    const projectSpy = jest.spyOn(controller as any, 'upsertHostMariaProject').mockResolvedValue({
      id: 'prj_hostmaria',
      name: 'HostMaria Legacy Ops',
      description: 'Legacy ops project',
      updatedAt: new Date('2026-03-25T00:00:00Z'),
    });
    const taskSpy = jest.spyOn(controller as any, 'upsertHostMariaTasks').mockResolvedValue({
      created: 2,
      updated: 1,
      items: [{ id: 'task_1', title: 'HostMaria Preservation Monitor' }],
    });
    const ledgerSpy = jest
      .spyOn(controller as any, 'upsertHostMariaLedgerTasks')
      .mockResolvedValue({
        created: 1,
        updated: 0,
      });

    const response = await controller.syncWorkspaceHostMariaOps('ws_1', {
      id: 'user_1',
      email: 'owner@example.com',
    });

    expect(response.workspaceId).toBe('ws_1');
    expect(response.project.id).toBe('prj_hostmaria');
    expect(response.tasks.created).toBe(2);
    expect(readInputsSpy).toHaveBeenCalledTimes(1);
    expect(projectSpy).toHaveBeenCalledTimes(1);
    expect(taskSpy).toHaveBeenCalledTimes(1);
    expect(ledgerSpy).toHaveBeenCalledTimes(1);
  });

  it('allows delegated agent member to sync HostMaria ops into owner account', async () => {
    db.workspaces.findByIdWithOwner.mockResolvedValueOnce({
      id: 'ws_1',
      ownerId: 'user_owner',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      owner: { email: 'owner@example.com' },
    });
    db.workspaceMembers.findMembership.mockResolvedValueOnce({
      workspaceId: 'ws_1',
      userId: 'agent_user',
      role: 'admin',
      addedByUserId: 'user_owner',
    });

    const inputs = {
      configPath: '/Users/<owner>/.tnf/hostmaria/projects.txt',
      reportPath: '/Users/<owner>/.tnf/hostmaria/reports/hostmaria-preservation-latest.json',
      archivePath: '/Users/<owner>/.tnf/hostmaria/archive/latest-archive-summary.json',
      targets: ['hostmaria.com'],
      latestReport: { status: 'warning' },
      latestArchive: { archivedAt: '2026-03-25T11:27:14.485Z' },
    };

    jest.spyOn(controller as any, 'readHostMariaSyncInputs').mockResolvedValue(inputs);
    jest.spyOn(controller as any, 'upsertHostMariaProject').mockResolvedValue({
      id: 'prj_hostmaria',
      name: 'HostMaria Legacy Ops',
      description: 'Legacy ops project',
      updatedAt: new Date('2026-03-25T00:00:00Z'),
    });
    const taskSpy = jest.spyOn(controller as any, 'upsertHostMariaTasks').mockResolvedValue({
      created: 1,
      updated: 0,
      items: [{ id: 'task_1', title: 'HostMaria Preservation Monitor' }],
    });
    jest.spyOn(controller as any, 'upsertHostMariaLedgerTasks').mockResolvedValue({
      created: 1,
      updated: 0,
    });

    const response = await controller.syncWorkspaceHostMariaOps('ws_1', {
      id: 'agent_user',
      email: 'agent-user@example.com',
    });

    expect(taskSpy).toHaveBeenCalledWith(
      'user_owner',
      'ws_1',
      'prj_hostmaria',
      'owner@example.com',
      inputs
    );
    expect(response.ownerEmail).toBe('owner@example.com');
  });

  it('blocks HostMaria sync for non-owner accounts', async () => {
    db.workspaces.findByIdWithOwner.mockResolvedValueOnce({
      id: 'ws_1',
      ownerId: 'user_1',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      owner: { email: 'owner@example.com' },
    });

    await expect(
      controller.syncWorkspaceHostMariaOps('ws_1', {
        id: 'user_1',
        email: 'someone@example.com',
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks HostMaria sync when workspace owner is not in configured owner list', async () => {
    db.workspaces.findByIdWithOwner.mockResolvedValueOnce({
      id: 'ws_1',
      ownerId: 'user_1',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      owner: { email: 'owner@example.com' },
    });

    await expect(
      controller.syncWorkspaceHostMariaOps('ws_1', {
        id: 'user_1',
        email: 'owner@example.com',
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('filters HostMaria projects for unauthorized workspace members', async () => {
    db.workspaces.findByIdWithOwner.mockResolvedValueOnce({
      id: 'ws_1',
      ownerId: 'owner_user',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      owner: { email: 'owner@example.com' },
    });
    db.workspaceMembers.findMembership.mockResolvedValueOnce({
      workspaceId: 'ws_1',
      userId: 'viewer_user',
      role: 'viewer',
      addedByUserId: 'owner_user',
    });
    db.workspaces.findByIdWithProjects = jest.fn().mockResolvedValue({
      id: 'ws_1',
      projects: [
        {
          id: 'prj_hostmaria',
          name: 'HostMaria Legacy Ops',
          settings: { hostMariaOps: true },
        },
        {
          id: 'prj_general',
          name: 'General Workspace Project',
          settings: {},
        },
      ],
    });

    const projects = await controller.getWorkspaceProjects('ws_1', {
      id: 'viewer_user',
      email: 'viewer@example.com',
    });

    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe('prj_general');
  });

  it('returns HostMaria projects for delegated agent members', async () => {
    db.workspaces.findByIdWithOwner.mockResolvedValueOnce({
      id: 'ws_1',
      ownerId: 'owner_user',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      owner: { email: 'owner@example.com' },
    });
    db.workspaceMembers.findMembership.mockResolvedValueOnce({
      workspaceId: 'ws_1',
      userId: 'agent_user',
      role: 'member',
      addedByUserId: 'owner_user',
    });
    db.workspaces.findByIdWithProjects = jest.fn().mockResolvedValue({
      id: 'ws_1',
      projects: [
        {
          id: 'prj_hostmaria',
          name: 'HostMaria Legacy Ops',
          settings: { hostMariaOps: true },
        },
      ],
    });

    const projects = await controller.getWorkspaceProjects('ws_1', {
      id: 'agent_user',
      email: 'agent@example.com',
    });

    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe('prj_hostmaria');
  });

  it('falls back to legacy HostMaria task schema when modern schema columns are missing', async () => {
    const inputs = {
      configPath: '/Users/<owner>/.tnf/hostmaria/projects.txt',
      reportPath: '/Users/<owner>/.tnf/hostmaria/reports/hostmaria-preservation-latest.json',
      archivePath: '/Users/<owner>/.tnf/hostmaria/archive/latest-archive-summary.json',
      targets: ['hostmaria.com'],
      latestReport: { status: 'ok' },
      latestArchive: { archivedAt: '2026-03-25T11:27:14.485Z' },
    };

    const modernSpy = jest
      .spyOn(controller as any, 'upsertHostMariaTasksModern')
      .mockRejectedValue(new Error('column "data" does not exist'));
    const legacySpy = jest
      .spyOn(controller as any, 'upsertHostMariaTasksLegacy')
      .mockResolvedValue({
        created: 1,
        updated: 0,
        items: [{ id: 'legacy_task_1', metadata: { hostMariaSyncKey: 'hostmaria:monitor' } }],
      });

    const result = await (controller as any).upsertHostMariaTasks(
      'user_1',
      'ws_1',
      'prj_hostmaria',
      'owner@example.com',
      inputs
    );

    expect(modernSpy).toHaveBeenCalledTimes(1);
    expect(legacySpy).toHaveBeenCalledTimes(1);
    expect(result.created).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('rethrows HostMaria task errors that are not legacy schema mismatches', async () => {
    const inputs = {
      configPath: '/Users/<owner>/.tnf/hostmaria/projects.txt',
      reportPath: '/Users/<owner>/.tnf/hostmaria/reports/hostmaria-preservation-latest.json',
      archivePath: '/Users/<owner>/.tnf/hostmaria/archive/latest-archive-summary.json',
      targets: ['hostmaria.com'],
      latestReport: { status: 'ok' },
      latestArchive: { archivedAt: '2026-03-25T11:27:14.485Z' },
    };

    const modernSpy = jest
      .spyOn(controller as any, 'upsertHostMariaTasksModern')
      .mockRejectedValue(new Error('permission denied'));
    const legacySpy = jest.spyOn(controller as any, 'upsertHostMariaTasksLegacy');

    await expect(
      (controller as any).upsertHostMariaTasks(
        'user_1',
        'ws_1',
        'prj_hostmaria',
        'owner@example.com',
        inputs
      )
    ).rejects.toThrow('permission denied');

    expect(modernSpy).toHaveBeenCalledTimes(1);
    expect(legacySpy).not.toHaveBeenCalled();
  });

  it('auto-sync cycle processes only owner-eligible workspaces', async () => {
    db.workspaces.findAllWithOwner.mockResolvedValueOnce([
      {
        id: 'ws_owner',
        ownerId: 'user_owner',
        owner: { email: 'owner@example.com' },
      },
      {
        id: 'ws_other',
        ownerId: 'user_other',
        owner: { email: 'other@example.com' },
      },
    ]);

    const inputs = {
      configPath: '/Users/<owner>/.tnf/hostmaria/projects.txt',
      reportPath: '/Users/<owner>/.tnf/hostmaria/reports/hostmaria-preservation-latest.json',
      archivePath: '/Users/<owner>/.tnf/hostmaria/archive/latest-archive-summary.json',
      targets: ['hostmaria.com'],
      latestReport: { status: 'ok' },
      latestArchive: { archivedAt: '2026-03-25T11:27:14.485Z' },
    };

    jest.spyOn(controller as any, 'readHostMariaSyncInputs').mockResolvedValue(inputs);
    const projectSpy = jest.spyOn(controller as any, 'upsertHostMariaProject').mockResolvedValue({
      id: 'prj_hostmaria',
      name: 'HostMaria Legacy Ops',
      description: 'Legacy ops project',
      updatedAt: new Date('2026-03-25T00:00:00Z'),
    });
    const taskSpy = jest.spyOn(controller as any, 'upsertHostMariaTasks').mockResolvedValue({
      created: 1,
      updated: 0,
      items: [{ id: 'task_1' }],
    });
    const ledgerSpy = jest
      .spyOn(controller as any, 'upsertHostMariaLedgerTasks')
      .mockResolvedValue({
        created: 1,
        updated: 0,
      });

    await (controller as any).runHostMariaAutoSyncCycle('manual');

    expect(projectSpy).toHaveBeenCalledTimes(1);
    expect(projectSpy).toHaveBeenCalledWith('ws_owner', 'owner@example.com', inputs);
    expect(taskSpy).toHaveBeenCalledWith(
      'user_owner',
      'ws_owner',
      'prj_hostmaria',
      'owner@example.com',
      inputs
    );
    expect(ledgerSpy).toHaveBeenCalledTimes(1);
  });

  it('auto-sync cycle skips when no hostmaria artifacts are available', async () => {
    db.workspaces.findAllWithOwner.mockResolvedValueOnce([
      {
        id: 'ws_owner',
        ownerId: 'user_owner',
        owner: { email: 'owner@example.com' },
      },
    ]);

    jest.spyOn(controller as any, 'readHostMariaSyncInputs').mockResolvedValue({
      configPath: '/Users/<owner>/.tnf/hostmaria/projects.txt',
      reportPath: '/Users/<owner>/.tnf/hostmaria/reports/hostmaria-preservation-latest.json',
      archivePath: '/Users/<owner>/.tnf/hostmaria/archive/latest-archive-summary.json',
      targets: [],
      latestReport: null,
      latestArchive: null,
    });
    const projectSpy = jest.spyOn(controller as any, 'upsertHostMariaProject');

    await (controller as any).runHostMariaAutoSyncCycle('manual');

    expect(projectSpy).not.toHaveBeenCalled();
  });
});
