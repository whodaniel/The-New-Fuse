import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { DatabaseAdmin } from '../DatabaseAdmin';
import { useDatabase } from '../../../hooks/useDatabase';
jest.mock('../../../hooks/useDatabase');
describe('DatabaseAdmin', function () {
    var mockTables = [
        { name: 'users', rowCount: 100, size: '1MB', lastUpdated: '2024-03-01' }
    ];
    beforeEach(function () {
        useDatabase.mockReturnValue({
            tables: mockTables,
            migrations: [],
            backups: [],
            loading: false
        });
    });
    it('renders database tables', function () {
        render(_jsx(DatabaseAdmin, {}));
        expect(screen.getByText('users')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
    });
});
