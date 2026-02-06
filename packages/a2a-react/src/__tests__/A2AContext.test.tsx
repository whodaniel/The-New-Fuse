import { renderHook } from '@testing-library/react';
import React from 'react';
import { A2AProvider, useA2AContext } from '..';

describe('useA2AContext', () => {
  it('should throw an error when used outside of a provider', () => {
    // Suppress console.error for this test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useA2AContext())).toThrow(
      'useA2AContext must be used within an A2AProvider'
    );
    consoleErrorSpy.mockRestore();
  });

  it('should provide context when used within a provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <A2AProvider config={{ url: 'ws://test', agentId: 'test-agent' }}>{children}</A2AProvider>
    );
    const { result } = renderHook(() => useA2AContext(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.connectionState.connected).toBe(false);
    expect(result.current.agents).toEqual([]);
  });
});
