import { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RateLimitingService } from './index.js';

describe('RateLimitingService', () => {
  let service: RateLimitingService;

  beforeEach(() => {
    service = new RateLimitingService({ windowMs: 1000, maxRequests: 2 });
  });

  it('should allow requests within limit', async () => {
    const req = { ip: '127.0.0.1' } as Request;

    const result1 = await service.isAllowed(req);
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(1);

    const result2 = await service.isAllowed(req);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(0);
  });

  it('should block requests exceeding limit', async () => {
    const req = { ip: '127.0.0.1' } as Request;

    await service.isAllowed(req);
    await service.isAllowed(req);

    const result3 = await service.isAllowed(req);
    expect(result3.allowed).toBe(false);
    expect(result3.remaining).toBe(0);
  });

  it('should reset limit after window', async () => {
    vi.useFakeTimers();
    const serviceWithFakeTimers = new RateLimitingService({ windowMs: 1000, maxRequests: 2 });
    const req = { ip: '127.0.0.1' } as Request;

    await serviceWithFakeTimers.isAllowed(req);
    await serviceWithFakeTimers.isAllowed(req);

    // Fast forward time
    vi.advanceTimersByTime(1100);

    const result = await serviceWithFakeTimers.isAllowed(req);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);

    vi.useRealTimers();
  });

  it('should clean up expired entries automatically', async () => {
    vi.useFakeTimers();
    const shortWindowService = new RateLimitingService({ windowMs: 100, maxRequests: 5 });

    // Add many entries
    for (let i = 0; i < 10; i++) {
      await shortWindowService.isAllowed({ ip: `192.168.1.${i}` } as Request);
    }

    // Access internal store to verify size
    let storeSize = (shortWindowService as any).store.size;
    expect(storeSize).toBe(10);

    // Advance time past window to trigger cleanup
    // Cleanup runs every windowMs (100ms)
    vi.advanceTimersByTime(200);

    storeSize = (shortWindowService as any).store.size;
    console.log('Store size after cleanup:', storeSize);
    expect(storeSize).toBe(0); // Should be 0 as all expired

    vi.useRealTimers();
  });
});
