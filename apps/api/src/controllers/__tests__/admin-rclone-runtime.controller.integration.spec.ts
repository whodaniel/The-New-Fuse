import { describe, expect, it, jest } from '@jest/globals';

jest.mock(
  '@the-new-fuse/relay-core',
  () => ({
    attachAuditTrace: (value: unknown) => value,
    extractAuditTrace: () => null,
  }),
  { virtual: true }
);

jest.mock(
  '@the-new-fuse/database',
  () => ({
    DatabaseService: class DatabaseService {},
    sql: () => ({}),
  }),
  { virtual: true }
);

jest.mock('../../guards/admin.guard', () => ({
  AdminGuard: class AdminGuard {},
}));

jest.mock('../../guards/secure-auth.guard', () => ({
  SecureAuthGuard: class SecureAuthGuard {},
}));

import { AdminRcloneRuntimeController } from '../admin-rclone-runtime.controller.js';

describe('AdminRcloneRuntimeController ArDrive integration contracts', () => {
  const service = {
    doctor: jest.fn(),
    getProviderProfiles: jest.fn(),
    getProviderBlueprint: jest.fn(),
    preflightArdriveTurboUpload: jest.fn(),
    enqueueArdriveTurboUpload: jest.fn(),
    getArdriveTurboQueue: jest.fn(),
    transitionArdriveTurboQueueItem: jest.fn(),
    getArdriveTurboWorkerStatus: jest.fn(),
    runArdriveTurboWorkerTick: jest.fn(),
    runArdriveTurboWorkerProcessOne: jest.fn(),
    getGuiDescriptor: jest.fn(),
    runWorkflow: jest.fn(),
    pauseWorkflow: jest.fn(),
    resumeWorkflow: jest.fn(),
    stopWorkflow: jest.fn(),
    getWorkflowRunLogs: jest.fn(),
  } as any;

  const controller = new AdminRcloneRuntimeController(service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('preflight forwards normalized payload and actorId from user context', async () => {
    service.preflightArdriveTurboUpload.mockResolvedValue({ ok: true, preflightId: 'pf-1' });

    const result = await controller.preflightArdriveTurbo({ id: 'admin-user-1' } as any, {
      fileName: 'asset.png',
      fileSizeBytes: '2048',
      localPath: '/tmp/asset.png',
      contentType: 'image/png',
      targetDriveId: 'drive-1',
      targetFolderId: 'folder-2',
      checksumSha256: 'abc123',
    });

    expect(service.preflightArdriveTurboUpload).toHaveBeenCalledWith({
      actorId: 'admin-user-1',
      fileName: 'asset.png',
      fileSizeBytes: 2048,
      localPath: '/tmp/asset.png',
      contentType: 'image/png',
      targetDriveId: 'drive-1',
      targetFolderId: 'folder-2',
      checksumSha256: 'abc123',
    });
    expect(result).toEqual({ ok: true, preflightId: 'pf-1' });
  });

  it('enqueue forwards queue request with actor context', async () => {
    service.enqueueArdriveTurboUpload.mockResolvedValue({ ok: true });

    await controller.enqueueArdriveTurbo({ userId: 'admin-user-2' } as any, {
      preflightId: 'pf-2',
      localPath: '/tmp/video.mp4',
      targetDriveId: 'drive-2',
      targetFolderId: 'folder-3',
    });

    expect(service.enqueueArdriveTurboUpload).toHaveBeenCalledWith({
      actorId: 'admin-user-2',
      preflightId: 'pf-2',
      localPath: '/tmp/video.mp4',
      targetDriveId: 'drive-2',
      targetFolderId: 'folder-3',
      checksumSha256: undefined,
    });
  });

  it('queue listing normalizes numeric query params', async () => {
    service.getArdriveTurboQueue.mockResolvedValue({ ok: true, items: [] });

    await controller.listArdriveTurboQueue('12', 'queued');

    expect(service.getArdriveTurboQueue).toHaveBeenCalledWith({
      limit: 12,
      status: 'queued',
    });
  });

  it('queue transition forwards route and body contract', async () => {
    service.transitionArdriveTurboQueueItem.mockResolvedValue({ ok: true });

    await controller.transitionArdriveTurboQueueItem({ sub: 'admin-user-3' } as any, 'q-1', {
      status: 'processing',
      note: 'manual replay',
    });

    expect(service.transitionArdriveTurboQueueItem).toHaveBeenCalledWith({
      actorId: 'admin-user-3',
      queueId: 'q-1',
      status: 'processing',
      note: 'manual replay',
    });
  });

  it('worker tick parses maxItems and forwards actor', async () => {
    service.runArdriveTurboWorkerTick.mockResolvedValue({ ok: true });

    await controller.ardriveTurboWorkerTick({ id: 'admin-user-4' } as any, { maxItems: '7' });

    expect(service.runArdriveTurboWorkerTick).toHaveBeenCalledWith({
      actorId: 'admin-user-4',
      trigger: 'manual',
      maxItems: 7,
    });
  });

  it('worker process-one supports explicit queue targeting', async () => {
    service.runArdriveTurboWorkerProcessOne.mockResolvedValue({ ok: true });

    await controller.ardriveTurboWorkerProcessOne({ id: 'admin-user-5' } as any, {
      queueId: 'q-target',
    });

    expect(service.runArdriveTurboWorkerProcessOne).toHaveBeenCalledWith({
      actorId: 'admin-user-5',
      trigger: 'manual',
      queueId: 'q-target',
    });
  });

  it('worker process-one defaults to next eligible item when queueId omitted', async () => {
    service.runArdriveTurboWorkerProcessOne.mockResolvedValue({ ok: true });

    await controller.ardriveTurboWorkerProcessOne({ id: 'admin-user-6' } as any, {});

    expect(service.runArdriveTurboWorkerProcessOne).toHaveBeenCalledWith({
      actorId: 'admin-user-6',
      trigger: 'manual',
      queueId: undefined,
    });
  });
});
