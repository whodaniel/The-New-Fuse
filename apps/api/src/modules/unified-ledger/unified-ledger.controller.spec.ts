import { describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';

import { UnifiedLedgerController } from './unified-ledger.controller';

describe('UnifiedLedgerController internal ingest auth', () => {
  const ledger = {
    ingestOrchestrationEvent: jest.fn(),
    createTimelineEvent: jest.fn(),
  } as any;
  const controller = new UnifiedLedgerController(ledger);

  const originalNodeEnv = process.env.NODE_ENV;
  const originalInternalSecret = process.env.TNF_INTERNAL_INGEST_SECRET;
  const originalLegacySecret = process.env.UNIFIED_LEDGER_INTERNAL_SECRET;
  const originalTimelineUser = process.env.TNF_INTERNAL_TIMELINE_USER_ID;

  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
    process.env.TNF_INTERNAL_INGEST_SECRET = originalInternalSecret;
    process.env.UNIFIED_LEDGER_INTERNAL_SECRET = originalLegacySecret;
    process.env.TNF_INTERNAL_TIMELINE_USER_ID = originalTimelineUser;
  });

  function reqWithSecret(secret?: string) {
    return {
      header: (name: string) => {
        const normalized = name.toLowerCase();
        if (normalized === 'x-tnf-internal-secret' || normalized === 'x-internal-secret') {
          return secret;
        }
        return undefined;
      },
    } as any;
  }

  it('accepts internal orchestration ingest when secret matches', async () => {
    process.env.TNF_INTERNAL_INGEST_SECRET = 'test-secret';
    ledger.ingestOrchestrationEvent.mockResolvedValue({ ok: true });

    const body = { type: 'TASK_DISPATCH', action: 'relay_dispatch' };
    const result = await controller.ingestInternal(reqWithSecret('test-secret'), body);

    expect(result).toEqual({ ok: true });
    expect(ledger.ingestOrchestrationEvent).toHaveBeenCalledWith(body);
  });

  it('rejects internal orchestration ingest when secret mismatches', async () => {
    process.env.TNF_INTERNAL_INGEST_SECRET = 'expected-secret';

    await expect(
      controller.ingestInternal(reqWithSecret('wrong-secret'), { type: 'TASK_DISPATCH' })
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(ledger.ingestOrchestrationEvent).not.toHaveBeenCalled();
  });

  it('rejects internal timeline writes in production if no secret is configured', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.TNF_INTERNAL_INGEST_SECRET;
    delete process.env.UNIFIED_LEDGER_INTERNAL_SECRET;

    await expect(
      controller.createInternalTimelineEvent(reqWithSecret(undefined), { payload: {} })
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(ledger.createTimelineEvent).not.toHaveBeenCalled();
  });

  it('allows internal timeline writes in non-production without secret and applies defaults', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.TNF_INTERNAL_INGEST_SECRET;
    delete process.env.UNIFIED_LEDGER_INTERNAL_SECRET;
    process.env.TNF_INTERNAL_TIMELINE_USER_ID = 'tnf-relay-user';
    ledger.createTimelineEvent.mockResolvedValue({ ok: true });

    await controller.createInternalTimelineEvent(reqWithSecret(undefined), {
      payload: { relayEventType: 'bridge_access_approved' },
    });

    expect(ledger.createTimelineEvent).toHaveBeenCalledWith({
      payload: { relayEventType: 'bridge_access_approved' },
      userId: 'tnf-relay-user',
      eventType: 'historical_event',
      actor: 'relay-system',
    });
  });
});
