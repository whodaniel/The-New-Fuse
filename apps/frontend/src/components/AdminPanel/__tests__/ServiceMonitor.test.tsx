import { fireEvent, render, screen } from '@testing-library/react';
import { useServices } from '../../../hooks/useServices';
import { ServiceMonitor } from '../ServiceMonitor';

jest.mock('../../../hooks/useServices');

describe('ServiceMonitor', () => {
  const mockServices = [
    {
      id: '1',
      name: 'API Service',
      status: 'ACTIVE',
      uptime: '24h',
      lastError: null,
    },
  ];

  const mockRestartService = jest.fn();

  beforeEach(() => {
    (useServices as jest.Mock).mockReturnValue({
      services: mockServices,
      restartService: mockRestartService,
    });
  });

  it('renders service list', () => {
    render(<ServiceMonitor />);
    expect(screen.getByText('API Service')).toBeInTheDocument();
    expect(screen.getByText('24h')).toBeInTheDocument();
  });

  it('handles service restart', () => {
    render(<ServiceMonitor />);
    const restartButton = screen.getByLabelText('Restart service');
    fireEvent.click(restartButton);
    expect(mockRestartService).toHaveBeenCalledWith('1');
  });
});
