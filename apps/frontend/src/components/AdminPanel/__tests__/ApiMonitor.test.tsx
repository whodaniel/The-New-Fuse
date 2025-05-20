import React from 'react';
import { render, screen } from '@testing-library/react';
import { ApiMonitor } from '../ApiMonitor.js';
import { useApiMetrics } from '../../../hooks/useApiMetrics.js';

jest.mock('../../../hooks/useApiMetrics');

describe('ApiMonitor', () => {
  const mockMetrics = {
    totalRequests: 1000,
    errorRate: 2.5,
    avgResponseTime: 150,
    requestsOverTime: [],
    responseTimesOverTime: []
  };

  beforeEach(() => {
    (useApiMetrics as jest.Mock).mockReturnValue({
      metrics: mockMetrics,
      endpoints: [],
      errors: [],
      loading: false
    });
  });

  it('renders metrics overview', () => {
    render(<ApiMonitor />);
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('2.5%')).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });
});
