import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceMonitor } from '../ServiceMonitor';
import { useServices } from '../../../hooks/useServices';
jest.mock('../../../hooks/useServices');
describe('ServiceMonitor', function () {
    var mockServices = [
        {
            id: '1',
            name: 'API Service',
            status: 'ACTIVE',
            uptime: '24h',
            lastError: null
        }
    ];
    var mockRestartService = jest.fn();
    beforeEach(function () {
        useServices.mockReturnValue({
            services: mockServices,
            restartService: mockRestartService
        });
    });
    it('renders service list', function () {
        render(_jsx(ServiceMonitor, {}));
        expect(screen.getByText('API Service')).toBeInTheDocument();
        expect(screen.getByText('24h')).toBeInTheDocument();
    });
    it('handles service restart', function () {
        render(_jsx(ServiceMonitor, {}));
        var restartButton = screen.getByLabelText('Restart service');
        fireEvent.click(restartButton);
        expect(mockRestartService).toHaveBeenCalledWith('1');
    });
});
