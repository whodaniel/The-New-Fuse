import { BadRequestException } from '@nestjs/common';
import { SgpNestjsTranslationService } from './sgp-nestjs-translation.service';

describe('SgpNestjsTranslationService', () => {
  let service: SgpNestjsTranslationService;

  beforeEach(() => {
    service = new SgpNestjsTranslationService();
  });

  it('translates SGP envelope to NestJS packet', () => {
    const packet = service.toNestPacket({
      id: '018f3a76-03a7-7a4f-a4f2-0f1f2a22d4f2',
      spec: 'sgp/0.1',
      type: 'QUERY.REQUEST',
      tenant: 'acme',
      resource: 'sgp://acme/wb_sales/q1/orders',
      sent_at: '2026-03-18T21:00:00Z',
      actor: { id: 'user_123', roles: ['analyst'] },
      trace: { correlation_id: '018f3a76-03a7-7a4f-a4f2-0f1f2a22d4f2', causation_id: null },
      payload: { select: ['order_id'], from: 'sgp://acme/wb_sales/q1/orders' },
    });

    expect(packet.pattern).toBe('sgp.query.request');
    expect(packet.id).toBe('018f3a76-03a7-7a4f-a4f2-0f1f2a22d4f2');
    expect(packet.data).toEqual({ select: ['order_id'], from: 'sgp://acme/wb_sales/q1/orders' });
    expect(packet.meta).toMatchObject({
      protocol: 'sgp/0.1',
      sgp_type: 'QUERY.REQUEST',
      tenant: 'acme',
      resource: 'sgp://acme/wb_sales/q1/orders',
    });
  });

  it('translates NestJS packet to SGP envelope using defaults', () => {
    const envelope = service.fromNestPacket(
      {
        pattern: 'sgp/query/response',
        id: 'packet-123',
        data: {
          schema: [{ name: 'order_id', type: 'string' }],
          rows: [],
          next_cursor: null,
          stats: { rows_scanned: 0, rows_returned: 0, latency_ms: 1 },
        },
      },
      {
        tenant: 'acme',
        resource: 'sgp://acme/wb_sales/q1/orders',
        actor: { id: 'translator', roles: ['system'] },
      }
    );

    expect(envelope.spec).toBe('sgp/0.1');
    expect(envelope.type).toBe('QUERY.RESPONSE');
    expect(envelope.id).toBe('packet-123');
    expect(envelope.tenant).toBe('acme');
    expect(envelope.resource).toBe('sgp://acme/wb_sales/q1/orders');
    expect(envelope.actor).toEqual({ id: 'translator', roles: ['system'] });
    expect(envelope.payload).toMatchObject({
      schema: [{ name: 'order_id', type: 'string' }],
      stats: { rows_scanned: 0, rows_returned: 0, latency_ms: 1 },
    });
  });

  it('rejects unsupported SGP type when translating to NestJS packet', () => {
    expect(() =>
      service.toNestPacket({
        id: 'id-1',
        spec: 'sgp/0.1',
        type: 'UNKNOWN.TYPE',
        tenant: 'acme',
        resource: 'sgp://acme/wb_sales/q1/orders',
        sent_at: '2026-03-18T21:00:00Z',
        actor: { id: 'user_123', roles: ['analyst'] },
        trace: { correlation_id: 'corr-1', causation_id: null },
        payload: { hello: 'world' },
      } as any)
    ).toThrow(BadRequestException);
  });

  it('rejects packet patterns that cannot be mapped to an SGP type', () => {
    expect(() =>
      service.fromNestPacket(
        {
          pattern: 'other.event',
          data: { foo: 'bar' },
        },
        {
          tenant: 'acme',
          resource: 'sgp://acme/wb_sales/q1/orders',
        }
      )
    ).toThrow(BadRequestException);
  });
});
