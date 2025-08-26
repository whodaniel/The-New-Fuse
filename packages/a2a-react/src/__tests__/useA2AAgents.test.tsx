import React from 'react';
import { renderHook } from '@testing-library/react';
import { A2AProvider } from '../context/A2AContext';
import { useA2AAgents } from '../hooks/useA2AAgents';

describe('useA2AAgents', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <A2AProvider url="ws://localhost:8080">
      {children}
    </A2AProvider>
  );

  it('should be defined', async () => {
    const { result } = renderHook(() => useA2AAgents(), { wrapper });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(result.current).toBeDefined();
  });

  it('should have initial empty agents', async () => {
    const { result } = renderHook(() => useA2AAgents(), { wrapper });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(result.current.agents).toEqual([]);
  });

  it('should provide isConnected status', async () => {
    const { result } = renderHook(() => useA2AAgents(), { wrapper });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(typeof result.current.isConnected).toBe('boolean');
  });
});