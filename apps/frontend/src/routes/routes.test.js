import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './index';
import { AuthProvider } from '@/providers/AuthProvider';
var MockProvider = function (_a) {
    var children = _a.children;
    return (_jsx(BrowserRouter, { children: _jsx(AuthProvider, { children: children }) }));
};
describe('AppRoutes', function () {
    test('renders landing page at root route', function () {
        render(_jsx(MemoryRouter, { initialEntries: ['/'], children: _jsx(AuthProvider, { children: _jsx(AppRoutes, {}) }) }));
        expect(screen.getByText(/welcome to the new fuse/i)).toBeInTheDocument();
    });
    test('redirects to login for protected routes when not authenticated', function () {
        render(_jsx(MemoryRouter, { initialEntries: ['/dashboard'], children: _jsx(AuthProvider, { children: _jsx(AppRoutes, {}) }) }));
        expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
    test('renders not found for invalid routes', function () {
        render(_jsx(MemoryRouter, { initialEntries: ['/invalid-route'], children: _jsx(AuthProvider, { children: _jsx(AppRoutes, {}) }) }));
        expect(screen.getByText(/page not found/i)).toBeInTheDocument();
    });
});
