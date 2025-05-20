import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { StatusMonitor } from '../StatusMonitor.js';
import { useWebSocket } from '../../hooks/useWebSocket.js';

jest.mock('../../hooks/useWebSocket');

const mockSystemStatus = {
  cpu: 45,
  memory: 60,
  activeConnections: 123,
  queueSize: 50,
  status: 'healthy'
};

describe('StatusMonitor', () => {
  beforeEach(() => {
    const mockSubscribe = jest.fn((channel, callback) => {
      if (channel === 'system_metrics') {
        callback(mockSystemStatus);
      }
      return () => {};
    });

    (useWebSocket as jest.Mock).mockReturnValue({
      subscribe: mockSubscribe
    });
  });

  it('renders system metrics', async () => {
    render(<StatusMonitor />);

    await waitFor(() => {
      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
  });

  it('displays correct status indicator', async () => {
    render(<StatusMonitor />);

    await waitFor(() => {
      const statusBadge = screen.getByText('Healthy');
      expect(statusBadge).toHaveClass('bg-green-500');
    });
  });
});