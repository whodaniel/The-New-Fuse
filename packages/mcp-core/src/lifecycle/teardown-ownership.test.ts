import { RBACManager } from '../auth/RBACManager.js';
import { ConnectionManager } from '../client/ConnectionManager.js';
import { CircuitBreaker } from '../error/CircuitBreaker.js';

/**
 * RC Phase B T3 regression guard for mcp-core teardown ownership.
 *
 * Phase B failed with force-exited jest workers because several production
 * classes started intervals (and, for ConnectionManager, process signal
 * handlers) without exposing any way to stop them. The repairs added
 * idempotent stop()/shutdown() lifecycle methods; these tests pin that
 * ownership so the teardown paths cannot silently regress.
 */
describe('mcp-core teardown ownership (RC Phase B T3 guard)', () => {
  let clearIntervalSpy: jest.SpyInstance;

  beforeEach(() => {
    clearIntervalSpy = jest.spyOn(global, 'clearInterval');
  });

  afterEach(() => {
    clearIntervalSpy.mockRestore();
  });

  it('stops the CircuitBreaker monitoring interval on stop() and is idempotent', () => {
    const breaker = new CircuitBreaker('t3-guard', { enableMonitoring: true });
    const callsBefore = clearIntervalSpy.mock.calls.length;

    breaker.stop();
    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(callsBefore);

    expect(() => breaker.stop()).not.toThrow();
  });

  it('stops the RBACManager cleanup interval on stop() and is idempotent', () => {
    const manager = new RBACManager();
    const callsBefore = clearIntervalSpy.mock.calls.length;

    manager.stop();
    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(callsBefore);

    expect(() => manager.stop()).not.toThrow();
  });

  it('removes ConnectionManager process signal handlers on shutdown()', async () => {
    const manager = new ConnectionManager();
    const sigtermBefore = process.listenerCount('SIGTERM');
    const sigintBefore = process.listenerCount('SIGINT');
    expect(process.listenerCount('SIGTERM')).toBeGreaterThan(0);

    await manager.shutdown();

    expect(process.listenerCount('SIGTERM')).toBe(sigtermBefore - 1);
    expect(process.listenerCount('SIGINT')).toBe(sigintBefore - 1);
  });
});
