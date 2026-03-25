import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { promises as dns } from 'dns';
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
      controller.updateWorkspaceBookmark(
        'ws_1',
        'wb_1',
        { url: 'taken.example.com' },
        'user_1'
      )
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
    expect(db.workspaceBookmarks.removeBookmarkForUser).toHaveBeenCalledWith('ws_1', 'wb_1', 'user_1');
  });

  it('does not allow removing another user bookmark', async () => {
    db.workspaceBookmarks.removeBookmarkForUser.mockResolvedValueOnce(false);

    await expect(controller.removeWorkspaceBookmark('ws_1', 'wb_other', 'user_1')).rejects.toBeInstanceOf(
      NotFoundException
    );
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
});
