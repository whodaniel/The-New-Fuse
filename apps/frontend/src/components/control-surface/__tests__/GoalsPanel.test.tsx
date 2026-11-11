import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { GoalsPanel } from '../GoalsPanel';

vi.mock('../useLocalRuntime', () => ({
  useLocalRuntimeSummary: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

import { useQuery } from '@tanstack/react-query';
import { useLocalRuntimeSummary } from '../useLocalRuntime';

describe('GoalsPanel', () => {
  it('renders safely when local-runtime summary is a flat unavailable payload (no goals)', () => {
    vi.mocked(useLocalRuntimeSummary).mockReturnValue({
      data: {
        available: false,
        reason: 'Local runtime is not available on this deployment',
        generatedAt: new Date().toISOString(),
      },
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    expect(() =>
      render(
        <MemoryRouter>
          <GoalsPanel />
        </MemoryRouter>
      )
    ).not.toThrow();
    expect(screen.getByText(/No goals yet/i)).toBeInTheDocument();
  });
});
