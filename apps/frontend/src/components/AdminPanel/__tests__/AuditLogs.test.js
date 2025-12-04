import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { AuditLogs } from '../AuditLogs';
import { useAuditLogs } from '../../../hooks/useAuditLogs';
jest.mock('../../../hooks/useAuditLogs');
describe('AuditLogs', function () {
    var mockLogs = [
        {
            id: '1',
            timestamp: '2024-03-01',
            type: 'user',
            user: 'admin',
            action: 'login',
            details: 'Successful login'
        }
    ];
    beforeEach(function () {
        useAuditLogs.mockReturnValue({
            logs: mockLogs,
            filters: { type: '', search: '' },
            setFilters: jest.fn(),
            loading: false
        });
    });
    it('renders audit logs', function () {
        render(_jsx(AuditLogs, {}));
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('login')).toBeInTheDocument();
    });
});
