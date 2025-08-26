import React from 'react';
import { renderHook } from '@testing-library/react';
import { A2AProvider, useA2AContext } from '../context/A2AContext';

describe('A2AContext', () => {
  it('should throw error when used outside provider', () => {
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      renderHook(() => useA2AContext());
    }).toThrow('useA2AContext must be used within an A2AProvider');
    
    console.error = originalError;
  });

  it('should provide context when used within provider', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <A2AProvider url="ws://test">
        {children}
      </A2AProvider>
    );

    const { result } = renderHook(() => useA2AContext(), { wrapper });
    
    // Wait for initial connection
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(result.current).toHaveProperty('url');
    expect(result.current).toHaveProperty('isConnected');
    expect(result.current).toHaveProperty('agents');
    expect(result.current).toHaveProperty('messages');
    expect(result.current).toHaveProperty('sendMessage');
    expect(result.current).toHaveProperty('connect');
    expect(result.current).toHaveProperty('disconnect');
  });
});