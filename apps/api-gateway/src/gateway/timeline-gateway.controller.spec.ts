import { TimelineGatewayController } from './timeline-gateway.controller';

describe('TimelineGatewayController', () => {
  const proxyService = {
    proxyRequest: jest.fn(),
  };

  const makeRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    (res.status as jest.Mock).mockReturnValue(res);
    return res as any;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('proxies /api/v1/timeline/* requests to unified-ledger timeline upstream', async () => {
    proxyService.proxyRequest.mockResolvedValueOnce({
      status: 200,
      data: { ok: true },
    });

    const controller = new TimelineGatewayController(proxyService as any);
    const req = {
      originalUrl: '/api/v1/timeline/events?ownerId=user_1',
      url: '/api/v1/timeline/events?ownerId=user_1',
      method: 'GET',
    } as any;
    const res = makeRes();

    await controller.proxyTimelineRequest(req, res, undefined, { ownerId: 'user_1' }, {});

    expect(proxyService.proxyRequest).toHaveBeenCalledWith(
      'api',
      '/api/unified-ledger/timeline/events',
      'GET',
      {},
      undefined,
      { ownerId: 'user_1' }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('proxies /api/unified-ledger/timeline/* requests with the same suffix', async () => {
    proxyService.proxyRequest.mockResolvedValueOnce({
      status: 200,
      data: { nodes: [] },
    });

    const controller = new TimelineGatewayController(proxyService as any);
    const req = {
      originalUrl: '/api/unified-ledger/timeline/github/graph',
      url: '/api/unified-ledger/timeline/github/graph',
      method: 'GET',
    } as any;
    const res = makeRes();

    await controller.proxyTimelineRequest(req, res, undefined, {}, {});

    expect(proxyService.proxyRequest).toHaveBeenCalledWith(
      'api',
      '/api/unified-ledger/timeline/github/graph',
      'GET',
      {},
      undefined,
      {}
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ nodes: [] });
  });

  it('falls back to /api/timeline base when unified-ledger base returns 404', async () => {
    proxyService.proxyRequest
      .mockResolvedValueOnce({
        status: 404,
        data: { message: 'not found' },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: { data: [] },
      });

    const controller = new TimelineGatewayController(proxyService as any);
    const req = {
      originalUrl: '/api/v1/unified-ledger/timeline/events',
      url: '/api/v1/unified-ledger/timeline/events',
      method: 'GET',
    } as any;
    const res = makeRes();

    await controller.proxyTimelineRequest(req, res, undefined, {}, {});

    expect(proxyService.proxyRequest).toHaveBeenNthCalledWith(
      1,
      'api',
      '/api/unified-ledger/timeline/events',
      'GET',
      {},
      undefined,
      {}
    );
    expect(proxyService.proxyRequest).toHaveBeenNthCalledWith(
      2,
      'api',
      '/api/timeline/events',
      'GET',
      {},
      undefined,
      {}
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: [] });
  });
});
