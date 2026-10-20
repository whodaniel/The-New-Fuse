import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CronPanel } from '../CronPanel';

vi.mock('@/hooks/useAuthorization', () => ({
  useAuthorization: vi.fn(),
}));

vi.mock('../useLocalRuntime', () => ({
  useLocalRuntimeSummary: vi.fn(),
  useSystemProcesses: vi.fn(),
  runSystemProcessNow: vi.fn(),
}));

import { useAuthorization } from '@/hooks/useAuthorization';
import { useLocalRuntimeSummary, useSystemProcesses } from '../useLocalRuntime';

describe('CronPanel', () => {
  it('renders safely when user is admin and system processes returns unavailable structure (no summary or processes)', () => {
    vi.mocked(useAuthorization).mockReturnValue({
      isAdmin: true,
      hasRole: vi.fn().mockReturnValue(true),
      hasPermission: vi.fn().mockReturnValue(true),
      user: { id: 'admin-1', email: 'admin@example.com' },
      roles: ['ADMIN'],
      permissions: [],
      isLoading: false,
    } as any);

    vi.mocked(useLocalRuntimeSummary).mockReturnValue({
      data: {
        available: false,
        reason: 'Local runtime offline',
        generatedAt: new Date().toISOString(),
      },
      isLoading: false,
      isError: false,
    } as any);

    // This replicates the exact response returned when /api/admin/metrics/chronological-processes
    // is unavailable or 401/403/404
    vi.mocked(useSystemProcesses).mockReturnValue({
      data: {
        available: false,
        reason: 'Local runtime requires an authenticated operator session',
        generatedAt: new Date().toISOString(),
      },
      isLoading: false,
      isError: false,
    } as any);

    expect(() => render(<CronPanel />)).not.toThrow();
    expect(screen.getByText('System process registry unavailable.')).toBeInTheDocument();
  });

  it('renders safely with full valid system process data', () => {
    vi.mocked(useAuthorization).mockReturnValue({
      isAdmin: true,
      hasRole: vi.fn().mockReturnValue(true),
      hasPermission: vi.fn().mockReturnValue(true),
      user: { id: 'admin-1', email: 'admin@example.com' },
      roles: ['ADMIN'],
      permissions: [],
      isLoading: false,
    } as any);

    vi.mocked(useLocalRuntimeSummary).mockReturnValue({
      data: {
        available: true,
        generatedAt: new Date().toISOString(),
        cron: {
          available: true,
          jobs: [],
        },
      },
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(useSystemProcesses).mockReturnValue({
      data: {
        generatedAt: new Date().toISOString(),
        summary: { total: 1, enabled: 1, disabled: 0, healthy: 1, errored: 0 },
        processes: [
          {
            id: 'proc-1',
            title: 'Audit Sync',
            description: 'Nightly audit sync',
            canonical: { scope: 'system', category: 'maintenance', locked: true },
            procedural: {
              enabled: true,
              cadence: '0 0 * * *',
              timezone: 'UTC',
              nextRunAt: new Date(Date.now() + 60000).toISOString(),
              nextRunHint: 'in 1m',
            },
            runtime: {
              status: 'healthy',
              lastRunAt: null,
              lastExitCode: 0,
              lastError: null,
            },
            controls: { canRunNow: true, runDeniedReason: null },
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as any);

    render(<CronPanel />);
    expect(screen.getByText('Audit Sync')).toBeInTheDocument();
    expect(screen.getByText('1 enabled')).toBeInTheDocument();
  });
});
