import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { RcloneRuntimeService } from './rclone-runtime.service';

describe('RcloneRuntimeService provider guardrails', () => {
  let fetchMock: jest.Mock;

  const createService = () => {
    const auditService = {
      log: jest.fn(),
      getLogs: jest.fn().mockResolvedValue([]),
    } as any;
    const unifiedLedgerService = {
      createTimelineEvent: jest.fn(),
    } as any;

    return new RcloneRuntimeService(auditService, unifiedLedgerService);
  };

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        winc: '4187358',
        adjustments: [],
      }),
    });
    (globalThis as any).fetch = fetchMock;
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  it('returns provider blueprint for Degoo with bridge-only policy', () => {
    const service = createService();

    const response = service.getProviderBlueprint('degoo');
    expect(response.ok).toBe(true);
    expect(response.provider?.id).toBe('degoo');
    expect(response.blueprint.id).toBe('degoo');
    expect(response.blueprint.compliance.automationPolicy).toBe('bridge_only');
    expect(response.blueprint.docs).toEqual(expect.arrayContaining(['https://degoo.com/terms']));
  });

  it('returns provider blueprint for ArDrive with custom-connector policy', () => {
    const service = createService();

    const response = service.getProviderBlueprint('ardrive');
    expect(response.ok).toBe(true);
    expect(response.blueprint.compliance.automationPolicy).toBe('custom_connector_only');
    expect(response.blueprint.pricing?.subsidizedThresholdBytes).toBe(102400);
  });

  it('throws on unknown provider blueprint request', () => {
    const service = createService();
    expect(() => service.getProviderBlueprint('unknown-provider')).toThrow(
      'Unknown provider: unknown-provider'
    );
  });

  it('blocks direct Degoo and ArDrive/Turbo aliases in runtime workflows', () => {
    const service = createService() as any;

    expect(() => service.enforceProviderGuardrails('degoo:/source', 'pcloud:/dest')).toThrow(
      'Degoo direct remote execution is disabled in TNF managed runtime. Use an official bridge workflow only.'
    );
    expect(() => service.enforceProviderGuardrails('/tmp/source', 'turbo:/dest')).toThrow(
      'ArDrive requires the custom Turbo connector path. Use provider blueprint and connector flow, not direct rclone execution.'
    );
    expect(() => service.enforceProviderGuardrails('/tmp/source', 'arweave:/dest')).toThrow(
      'ArDrive requires the custom Turbo connector path. Use provider blueprint and connector flow, not direct rclone execution.'
    );
  });

  it('allows local paths and native pcloud remote aliases', () => {
    const service = createService() as any;

    expect(() => service.enforceProviderGuardrails('/tmp/source', 'pcloud:/dest')).not.toThrow();
    expect(() => service.enforceProviderGuardrails('C:\\tmp\\src', '/tmp/dest')).not.toThrow();
  });

  it('extracts aliases without misclassifying Windows drive paths', () => {
    const service = createService() as any;

    expect(service.extractRemoteAlias('degoo:/media')).toBe('degoo');
    expect(service.extractRemoteAlias('Turbo:/media')).toBe('turbo');
    expect(service.extractRemoteAlias('C:\\Users\\daniel\\data')).toBeNull();
    expect(service.extractRemoteAlias('/var/tmp/data')).toBeNull();
  });

  it('rejects runWorkflow when source/destination use blocked providers', async () => {
    const service = createService();

    await expect(
      service.runWorkflow({
        actorId: 'admin',
        presetId: 'sync',
        source: 'degoo:/src',
        destination: 'pcloud:/dst',
      })
    ).rejects.toThrow(
      'Degoo direct remote execution is disabled in TNF managed runtime. Use an official bridge workflow only.'
    );

    await expect(
      service.runWorkflow({
        actorId: 'admin',
        presetId: 'backup',
        source: '/tmp/src',
        destination: 'ardrive:/dst',
      })
    ).rejects.toThrow(
      'ArDrive requires the custom Turbo connector path. Use provider blueprint and connector flow, not direct rclone execution.'
    );
  });

  it('creates ArDrive Turbo preflight with subsidy eligibility for small files and live quote', async () => {
    const service = createService();

    const response = await service.preflightArdriveTurboUpload({
      actorId: 'admin-1',
      fileName: 'clip.mp4',
      fileSizeBytes: 90 * 1024,
      contentType: 'video/mp4',
    });

    expect(response.ok).toBe(true);
    expect(response.providerId).toBe('ardrive');
    expect(response.pricing.subsidizedEligible).toBe(true);
    expect(response.pricing.subsidizedThresholdBytes).toBe(102400);
    expect(response.preflightId).toMatch(/^ardrive_pf_/);
    expect(response.pricing.quoteId).toMatch(/^turbo_quote_/);
    expect(response.pricing.quoteSource).toBe('live');
    expect(response.pricing.quotedWinc).toBe('4187358');
  });

  it('queues ArDrive Turbo upload from preflight and exposes it in queue listing', async () => {
    const service = createService();
    const preflight = await service.preflightArdriveTurboUpload({
      actorId: 'admin-1',
      fileName: 'archive.zip',
      fileSizeBytes: 6 * 1024 * 1024,
      localPath: '/tmp/archive.zip',
      targetDriveId: 'drive-1',
      targetFolderId: 'folder-2',
    });

    const queued = service.enqueueArdriveTurboUpload({
      actorId: 'admin-1',
      preflightId: preflight.preflightId,
    });

    expect(queued.ok).toBe(true);
    expect(queued.item.queueId).toMatch(/^ardrive_q_/);
    expect(queued.item.status).toBe('queued');
    expect(queued.item.preflightId).toBe(preflight.preflightId);
    expect(queued.item.quoteSource).toBe('live');
    expect(queued.item.quoteId).toMatch(/^turbo_quote_/);

    const queue = service.getArdriveTurboQueue({ limit: 10 });
    expect(queue.ok).toBe(true);
    expect(queue.total).toBeGreaterThanOrEqual(1);
    expect(queue.items[0]?.preflightId).toBe(preflight.preflightId);
  });

  it('rejects queue enqueue when preflight is unknown or expired', () => {
    const service = createService();
    expect(() =>
      service.enqueueArdriveTurboUpload({
        actorId: 'admin-1',
        preflightId: 'ardrive_pf_missing',
      })
    ).toThrow('preflightId is unknown or expired; run preflight again');
  });

  it('supports valid ArDrive queue transitions through worker lifecycle', async () => {
    const service = createService();
    const preflight = await service.preflightArdriveTurboUpload({
      actorId: 'admin-1',
      fileName: 'render.mov',
      fileSizeBytes: 2 * 1024 * 1024,
    });
    const queued = service.enqueueArdriveTurboUpload({
      actorId: 'admin-1',
      preflightId: preflight.preflightId,
    });

    const processing = await service.transitionArdriveTurboQueueItem({
      actorId: 'worker-1',
      queueId: queued.item.queueId,
      status: 'processing',
      note: 'Worker started upload preparation',
    });
    expect(processing.item.status).toBe('processing');
    expect(processing.item.attempts).toBe(1);

    const submitted = await service.transitionArdriveTurboQueueItem({
      actorId: 'worker-1',
      queueId: queued.item.queueId,
      status: 'submitted',
    });
    expect(submitted.item.status).toBe('submitted');
    expect(submitted.item.quoteSource).toBe('live');
    expect(submitted.item.quoteId).toMatch(/^turbo_quote_/);

    const completed = await service.transitionArdriveTurboQueueItem({
      actorId: 'worker-1',
      queueId: queued.item.queueId,
      status: 'completed',
    });
    expect(completed.item.status).toBe('completed');
  });

  it('rejects invalid ArDrive queue transitions', async () => {
    const service = createService();
    const preflight = await service.preflightArdriveTurboUpload({
      actorId: 'admin-1',
      fileName: 'capture.png',
      fileSizeBytes: 256 * 1024,
    });
    const queued = service.enqueueArdriveTurboUpload({
      actorId: 'admin-1',
      preflightId: preflight.preflightId,
    });

    await expect(
      service.transitionArdriveTurboQueueItem({
        actorId: 'worker-1',
        queueId: queued.item.queueId,
        status: 'completed',
      })
    ).rejects.toThrow(`Invalid queue transition: queued -> completed`);
  });

  it('blocks submitted transition without a live Turbo quote', async () => {
    const service = createService();
    fetchMock.mockRejectedValue(new Error('network down'));

    const preflight = await service.preflightArdriveTurboUpload({
      actorId: 'admin-1',
      fileName: 'offline.dat',
      fileSizeBytes: 300 * 1024,
    });
    expect(preflight.pricing.quoteSource).toBe('estimated');

    const queued = service.enqueueArdriveTurboUpload({
      actorId: 'admin-1',
      preflightId: preflight.preflightId,
    });

    await service.transitionArdriveTurboQueueItem({
      actorId: 'worker-1',
      queueId: queued.item.queueId,
      status: 'processing',
    });

    await expect(
      service.transitionArdriveTurboQueueItem({
        actorId: 'worker-1',
        queueId: queued.item.queueId,
        status: 'submitted',
      })
    ).rejects.toThrow(
      'Cannot transition to submitted without a live Turbo payment quote. Retry when payment API is reachable.'
    );
  });

  it('runs worker ticks to progress queue items through lifecycle', async () => {
    const service = createService();
    const preflight = await service.preflightArdriveTurboUpload({
      actorId: 'admin-1',
      fileName: 'worker-loop.mp4',
      fileSizeBytes: 600 * 1024,
    });
    const queued = service.enqueueArdriveTurboUpload({
      actorId: 'admin-1',
      preflightId: preflight.preflightId,
    });

    const tick1 = await service.runArdriveTurboWorkerTick({
      actorId: 'worker-1',
      trigger: 'manual',
    });
    expect(tick1.ok).toBe(true);
    expect(tick1.summary.processed).toBeGreaterThanOrEqual(1);
    expect(service.getArdriveTurboQueue({ limit: 1 }).items[0]?.status).toBe('processing');

    await service.runArdriveTurboWorkerTick({ actorId: 'worker-1', trigger: 'manual' });
    expect(service.getArdriveTurboQueue({ limit: 1 }).items[0]?.status).toBe('submitted');

    await service.runArdriveTurboWorkerTick({ actorId: 'worker-1', trigger: 'manual' });
    expect(service.getArdriveTurboQueue({ limit: 1 }).items[0]?.status).toBe('completed');

    const status = service.getArdriveTurboWorkerStatus();
    expect(status.worker.lastSummary).toBeTruthy();
    expect(status.queue.completed).toBeGreaterThanOrEqual(1);
    expect(queued.item.queueId).toMatch(/^ardrive_q_/);
  });

  it('worker auto-fails processing items when live quote refresh is unavailable', async () => {
    const service = createService();
    fetchMock.mockRejectedValue(new Error('payment api unavailable'));

    const preflight = await service.preflightArdriveTurboUpload({
      actorId: 'admin-1',
      fileName: 'worker-fail.bin',
      fileSizeBytes: 5 * 1024 * 1024,
    });
    const queued = service.enqueueArdriveTurboUpload({
      actorId: 'admin-1',
      preflightId: preflight.preflightId,
    });

    await service.runArdriveTurboWorkerTick({ actorId: 'worker-1', trigger: 'manual' });
    expect(service.getArdriveTurboQueue({ limit: 1 }).items[0]?.status).toBe('processing');

    const tick2 = await service.runArdriveTurboWorkerTick({
      actorId: 'worker-1',
      trigger: 'manual',
    });
    expect(tick2.summary.failed).toBeGreaterThanOrEqual(1);
    expect(service.getArdriveTurboQueue({ limit: 1 }).items[0]?.status).toBe('failed');
    expect(queued.item.queueId).toMatch(/^ardrive_q_/);
  });

  it('process-one can target a specific queue item deterministically', async () => {
    const service = createService();

    const preflightA = await service.preflightArdriveTurboUpload({
      actorId: 'admin-1',
      fileName: 'a.bin',
      fileSizeBytes: 120 * 1024,
    });
    const preflightB = await service.preflightArdriveTurboUpload({
      actorId: 'admin-1',
      fileName: 'b.bin',
      fileSizeBytes: 140 * 1024,
    });

    const queueA = service.enqueueArdriveTurboUpload({
      actorId: 'admin-1',
      preflightId: preflightA.preflightId,
    });
    const queueB = service.enqueueArdriveTurboUpload({
      actorId: 'admin-1',
      preflightId: preflightB.preflightId,
    });

    const targeted = await service.runArdriveTurboWorkerProcessOne({
      actorId: 'worker-1',
      trigger: 'manual',
      queueId: queueA.item.queueId,
    });
    expect(targeted.summary.processed).toBe(1);

    const statusA = service
      .getArdriveTurboQueue({ limit: 20 })
      .items.find((i) => i.queueId === queueA.item.queueId);
    const statusB = service
      .getArdriveTurboQueue({ limit: 20 })
      .items.find((i) => i.queueId === queueB.item.queueId);
    expect(statusA?.status).toBe('processing');
    expect(statusB?.status).toBe('queued');
  });

  it('process-one rejects unknown queue ids', async () => {
    const service = createService();
    await expect(
      service.runArdriveTurboWorkerProcessOne({
        actorId: 'worker-1',
        trigger: 'manual',
        queueId: 'ardrive_q_missing',
      })
    ).rejects.toThrow('Unknown queue item: ardrive_q_missing');
  });
});
