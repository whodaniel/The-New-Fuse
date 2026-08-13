import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import SystemStatus from '../SystemStatus';

const makeResponse = (status: number, payload: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  }) as Response;

describe('SystemStatus', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('shows healthy overall status when all probes succeed', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/system/mesh-health')) {
        return makeResponse(200, { gateway: true, backend: true, api: true });
      }

      if (url.includes('/system/master-clock')) {
        return makeResponse(200, {
          status: 'ok',
          orchestrator: { isActive: true },
        });
      }

      if (url.includes('/analytics/default/overview')) {
        return makeResponse(200, { overview: { totalAgents: 7, activeAgents: 4 } });
      }

      if (url.includes('/health')) {
        return makeResponse(200, { status: 'healthy' });
      }

      return makeResponse(404, { message: 'missing' });
    });

    render(<SystemStatus />);

    expect(await screen.findByText(/all systems operational/i)).toBeInTheDocument();
    expect(await screen.findByText(/gateway is responding normally/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/master clock is active and publishing telemetry/i)
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
  });

  test('marks analytics as unavailable when every analytics candidate fails', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/analytics/default/overview')) {
        return makeResponse(404, { message: 'not found' });
      }

      if (url.includes('/system/mesh-health')) {
        return makeResponse(200, { gateway: true, backend: true, api: true });
      }

      if (url.includes('/system/master-clock')) {
        return makeResponse(200, { status: 'ok', orchestrator: { isActive: true } });
      }

      if (url.includes('/health')) {
        return makeResponse(200, { status: 'healthy' });
      }

      return makeResponse(404, { message: 'missing' });
    });

    render(<SystemStatus />);

    expect(await screen.findByText(/multiple services unavailable/i)).toBeInTheDocument();

    const analyticsHeading = await screen.findByRole('heading', { name: /analytics readiness/i });
    const analyticsCard = analyticsHeading.closest('article');
    expect(analyticsCard).not.toBeNull();
    if (!analyticsCard) return;

    expect(
      within(analyticsCard).getByText(
        /service is currently unavailable\. please try again shortly\./i
      )
    ).toBeInTheDocument();
  });

  test('falls back to secondary analytics candidate and records attempt count', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/api/analytics/default/overview')) {
        return makeResponse(404, { message: 'legacy path missing' });
      }

      if (url.includes('/api/v1/analytics/default/overview')) {
        return makeResponse(200, { overview: { totalInteractions: 52 } });
      }

      if (url.includes('/system/mesh-health')) {
        return makeResponse(200, { gateway: true, backend: true, api: true });
      }

      if (url.includes('/system/master-clock')) {
        return makeResponse(200, { status: 'ok', orchestrator: { isActive: true } });
      }

      if (url.includes('/health')) {
        return makeResponse(200, { status: 'healthy' });
      }

      return makeResponse(404, { message: 'missing' });
    });

    render(<SystemStatus />);

    const analyticsHeading = await screen.findByRole('heading', { name: /analytics readiness/i });
    const analyticsCard = analyticsHeading.closest('article');
    expect(analyticsCard).not.toBeNull();
    if (!analyticsCard) return;

    expect(
      await within(analyticsCard).findByText(
        /analytics overview endpoint is returning structured data/i
      )
    ).toBeInTheDocument();
    expect(within(analyticsCard).getByText(/attempts: 2/i)).toBeInTheDocument();
  });
});
