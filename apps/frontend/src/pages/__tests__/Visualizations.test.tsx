import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Visualizations from '../Visualizations';

describe('Visualizations', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        timestamp: '2026-03-18T00:00:00.000Z',
        source: 'redis-master-clock-state',
        orchestrator: {
          sessionId: 'ORCHESTRATOR-1',
          isActive: true,
          lastHeartbeat: '2026-03-18T00:00:00.000Z',
          ageMs: 1000,
          heartbeatIntervalMs: 3000,
          stallThresholdMs: 5000,
          stats: { total: 4, active: 3, stalled: 1, offline: 0 },
          superCycleSummary: { total: 2, healthy: 2, stale: 0 },
        },
        superCycle: {
          lastUpdated: '2026-03-18T00:00:00.000Z',
          staleThresholdMs: 90000,
          stats: { total: 2, healthy: 2, stale: 0 },
          processes: [
            {
              processId: 'tnf-self-improvement-loop',
              name: 'TNF Self Improvement Loop',
              kind: 'continuous-loop',
              owner: 'orchestrator',
              status: 'running',
              stale: false,
              heartbeatCount: 12,
              expectedIntervalMs: 25000,
              cadenceSource: 'metadata',
              lastHeartbeat: '2026-03-18T00:00:00.000Z',
              heartbeatAgeMs: 1000,
              lastRunAt: '2026-03-18T00:00:00.000Z',
              lastRunAgeMs: 1000,
              lastResult: 'success',
              metadata: { component: 'self-improvement', intervalSeconds: 25 },
            },
            {
              processId: 'jules-autonomous-loop',
              name: 'Jules Autonomous Loop',
              kind: 'cron',
              owner: 'ci',
              status: 'running',
              stale: false,
              heartbeatCount: 4,
              expectedIntervalMs: 60000,
              cadenceSource: 'inferred',
              lastHeartbeat: '2026-03-18T00:00:00.000Z',
              heartbeatAgeMs: 5000,
              lastRunAt: '2026-03-18T00:00:00.000Z',
              lastRunAgeMs: 5000,
              lastResult: 'success',
              metadata: { channel: 'General' },
            },
          ],
        },
        recentActivity: [],
      }),
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders master clock concept and toggles chron jobs', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Visualizations />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /turn tnf chron jobs into a living watch movement/i })
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/master clock state|fallback concept mode/i, undefined, {
        timeout: 4000,
      })
    ).toBeInTheDocument();

    const julesLoopCard = await screen.findByRole('button', {
      name: /toggle jules autonomous loop/i,
    });
    expect(screen.getAllByText(/last run/i).length).toBeGreaterThan(0);

    await user.click(julesLoopCard);

    expect(screen.getAllByText(/locked into gear train/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/selected routine/i)).toBeInTheDocument();
  }, 15000);

  test('routes static surfaces through the in-app viewer while keeping native routes direct', () => {
    render(
      <MemoryRouter>
        <Visualizations />
      </MemoryRouter>
    );

    const staticSurfaceCandidates = screen.getAllByRole('link', {
      name: /agent communication flow/i,
    });
    const staticSurfaceLink = staticSurfaceCandidates.find((link) =>
      (link.getAttribute('href') || '').includes('/visualizations/surface?')
    );
    expect(staticSurfaceLink).toBeTruthy();
    const staticHref = staticSurfaceLink?.getAttribute('href') || '';
    expect(staticHref).toContain('/visualizations/surface?');
    expect(decodeURIComponent(staticHref)).toContain(
      'src=/visualizations/agent-communication-flow.html'
    );

    const nativeSurfaceCandidates = screen.getAllByRole('link', { name: /terminal graph view/i });
    const nativeSurfaceLink = nativeSurfaceCandidates.find(
      (link) => link.getAttribute('href') === '/visualizations/terminals'
    );
    expect(nativeSurfaceLink).toBeTruthy();
  }, 15000);
});
