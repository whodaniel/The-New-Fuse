import { render, screen, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../../../hooks/useSystemMetrics';
import { SystemMetrics } from '../SystemMetrics';

jest.mock('../../../hooks/useSystemMetrics');

describe('SystemMetrics', () => {
  it('should render loading state', () => {
    (useSystemMetrics as jest.Mock).mockReturnValue({ loading: true });
    render(<SystemMetrics />);
    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
  });

  it('should render metrics when loaded', async () => {
    const mockMetrics = {
      cpuUsage: { value: 45 },
      memoryUsage: { value: 1024 },
      activeConnections: { value: 100 },
    };

    (useSystemMetrics as jest.Mock).mockReturnValue({
      loading: false,
      metrics: mockMetrics,
    });

    render(<SystemMetrics />);
    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('1024MB')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });
});
