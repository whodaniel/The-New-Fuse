import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MasterGraph as Graph } from '../../shared/master-graph';
import AuthContext, { type AuthContextType } from '../AuthContext';
import { useMasterGraph } from '../hooks/useMasterGraph';
import { fetchMasterGraph } from '../services/masterGraph.service';
import MasterGraph from './MasterGraph';

// Only the network boundary is controlled here. The view, traversal, and hook are real.
vi.mock('../services/masterGraph.service', () => ({ fetchMasterGraph: vi.fn() }));
const proof = {
  source: 'route declaration',
  observedAt: '2026-09-09T00:00:00Z',
  status: 'declared' as const,
};
const graph: Graph = {
  schemaVersion: 'tnf.master-graph/v1',
  generatedAt: proof.observedAt,
  snapshotAt: '2026-03-09T06:56:50.490Z',
  revision: 'abcdef0123456',
  nodes: [
    { id: 'a', label: 'Frontend', kind: 'app', evidence: proof, href: '/visualizations' },
    { id: 'b', label: 'Worker', kind: 'service', evidence: proof },
  ],
  edges: [{ id: 'ab', source: 'a', target: 'b', type: 'uses', directed: true, evidence: proof }],
  issues: [{ id: 'dangling', target: 'missing', reason: 'missing-endpoint' }],
  sources: [{ id: 'snapshot', status: 'available' }],
};
beforeEach(() => {
  vi.mocked(fetchMasterGraph).mockReset().mockResolvedValue(structuredClone(graph));
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

describe('master graph native view', () => {
  it('searches real nodes, exposes evidence and app links, and presents unresolved endpoints', async () => {
    render(
      <MemoryRouter>
        <MasterGraph />
      </MemoryRouter>
    );
    await screen.findByRole('combobox', { name: 'Evidence scope' });
    expect(screen.queryByRole('button', { name: 'Inspect Frontend' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No fresh runtime observations');
    fireEvent.change(screen.getByRole('combobox', { name: 'Evidence scope' }), {
      target: { value: 'source' },
    });
    await screen.findByRole('button', { name: 'Inspect Frontend' });
    fireEvent.click(screen.getByRole('button', { name: 'Inspect Frontend' }));
    expect(screen.getByRole('link', { name: /Open app destination/ })).toHaveAttribute(
      'href',
      '/visualizations'
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Search nodes' }), {
      target: { value: 'does-not-exist' },
    });
    expect(screen.getByRole('status')).toHaveTextContent('No nodes match');
    fireEvent.click(screen.getByRole('button', { name: 'Issues (1)' }));
    expect(screen.getByText('missing-endpoint')).toBeInTheDocument();
  }, 20000);
  it('does not invent a graph when the data service fails', async () => {
    vi.mocked(fetchMasterGraph).mockRejectedValue(new Error('Service offline'));
    render(
      <MemoryRouter>
        <MasterGraph />
      </MemoryRouter>
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Service offline');
    expect(screen.queryByRole('button', { name: 'Inspect Frontend' })).not.toBeInTheDocument();
  });
  it('clears tenant data and aborts old requests when identity changes', async () => {
    let signal: AbortSignal | undefined;
    vi.mocked(fetchMasterGraph).mockImplementation(async (s) => {
      signal = s;
      return structuredClone(graph);
    });
    const auth = {
      user: { id: 'one', tenantId: 'tenant-one' },
      isAuthenticated: true,
    } as AuthContextType;
    function Probe() {
      const state = useMasterGraph();
      return <div>{state.graph ? 'Tenant data' : 'No data'}</div>;
    }
    const view = render(
      <AuthContext.Provider value={auth}>
        <Probe />
      </AuthContext.Provider>
    );
    await screen.findByText('Tenant data');
    const oldSignal = signal;
    vi.mocked(fetchMasterGraph).mockImplementation(() => new Promise(() => {}));
    act(() =>
      view.rerender(
        <AuthContext.Provider value={{ ...auth, user: null, isAuthenticated: false }}>
          <Probe />
        </AuthContext.Provider>
      )
    );
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(oldSignal?.aborted).toBe(true);
    await waitFor(() => expect(fetchMasterGraph).toHaveBeenCalledTimes(2));
  });
});
