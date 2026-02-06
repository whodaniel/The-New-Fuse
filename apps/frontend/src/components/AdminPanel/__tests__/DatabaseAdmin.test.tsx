import { render, screen } from '@testing-library/react';
import { useDatabase } from '../../../hooks/useDatabase';
import { DatabaseAdmin } from '../DatabaseAdmin';

jest.mock('../../../hooks/useDatabase');

describe('DatabaseAdmin', () => {
  const mockTables = [{ name: 'users', rowCount: 100, size: '1MB', lastUpdated: '2024-03-01' }];

  beforeEach(() => {
    (useDatabase as jest.Mock).mockReturnValue({
      tables: mockTables,
      migrations: [],
      backups: [],
      loading: false,
    });
  });

  it('renders database tables', () => {
    render(<DatabaseAdmin />);
    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
