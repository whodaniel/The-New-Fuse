import React from 'react';
import { renderHook } from '@testing-library/react';
import { useA2AAgents, A2AProvider } from '..';

describe('useA2AAgents', () => {
  it('should return agents from context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <A2AProvider config={{ url: 'ws://localhost:8080', agentId: 'test-agent' }}>{children}</A2AProvider>
    );
    const { result } = renderHook(() => useA2AAgents(), { wrapper });

    expect(result.current.agents).toEqual([]);
  });
});