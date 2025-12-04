import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { ApiMonitor } from '../ApiMonitor';
import { useApiMetrics } from '../../../hooks/useApiMetrics';
jest.mock('../../../hooks/useApiMetrics');
describe('ApiMonitor', function () {
    var mockMetrics = {
        totalRequests: 1000,
        errorRate: 2.5,
        avgResponseTime: 150,
        requestsOverTime: [],
        responseTimesOverTime: []
    };
    beforeEach(function () {
        useApiMetrics.mockReturnValue({
            metrics: mockMetrics,
            endpoints: [],
            errors: [],
            loading: false
        });
    });
    it('renders metrics overview', function () {
        render(_jsx(ApiMonitor, {}));
        expect(screen.getByText('1000')).toBeInTheDocument();
        expect(screen.getByText('2.5%')).toBeInTheDocument();
        expect(screen.getByText('150ms')).toBeInTheDocument();
    });
});
