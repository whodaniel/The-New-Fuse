import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditLogs } from '../AuditLogs.js';
import { useAuditLogs } from '../../../hooks/useAuditLogs.js';

jest.mock('../../../hooks/useAuditLogs');

describe('AuditLogs', () => {
  const mockLogs = [
    {
      id: '1',
      timestamp: '2024-03-01',
      type: 'user',
      user: 'admin',
      action: 'login',
      details: 'Successful login'
    }
  ];

  beforeEach(() => {
    (useAuditLogs as jest.Mock).mockReturnValue({
      logs: mockLogs,
      filters: { type: '', search: '' },
      setFilters: jest.fn(),
      loading: false
    });
  });

  it('renders audit logs', () => {
    render(<AuditLogs />);
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('login')).toBeInTheDocument();
  });
});
