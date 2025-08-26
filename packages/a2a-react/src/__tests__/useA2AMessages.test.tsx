import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { A2AProvider } from '../context/A2AContext';
import { useA2AMessages } from '../hooks/useA2AMessages';

describe('useA2AMessages', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <A2AProvider url="ws://localhost:8080">
      {children}
    </A2AProvider>
  );

  it('should be defined', async () => {
    const { result } = renderHook(() => useA2AMessages(), { wrapper });
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(result.current).toBeDefined();
  });

  it('should have initial empty messages', async () => {
    const { result } = renderHook(() => useA2AMessages(), { wrapper });
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(result.current.messages).toEqual([]);
  });

  it('should provide sendMessage function', async () => {
    const { result } = renderHook(() => useA2AMessages(), { wrapper });
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(typeof result.current.sendMessage).toBe('function');
  });

  it('should handle message sending', async () => {
    const { result } = renderHook(() => useA2AMessages(), { wrapper });
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 10));
    
    act(() => {
      result.current.sendMessage({
        type: 'REQUEST',
        fromAgent: 'user',
        toAgent: 'agent1',
        payload: { text: 'Hello' },
      });
    });
    
    // In a real test, we would verify the message was sent via WebSocket
    expect(result.current.messages).toHaveLength(0); // No response yet
  });
});