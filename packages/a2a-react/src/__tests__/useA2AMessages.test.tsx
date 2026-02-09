import { renderHook } from '@testing-library/react';
import { useA2AMessages, A2AProvider } from '..';

describe('useA2AMessages', () => {
  it('should return messages from context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <A2AProvider config={{ url: 'ws://localhost:8080', agentId: 'test-agent' }}>{children}</A2AProvider>
    );
    const { result } = renderHook(() => useA2AMessages(), { wrapper });

    expect(result.current.messages).toEqual([]);
  });
});