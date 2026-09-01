"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import jsx_runtime_1 from 'react/jsx-runtime';
import react_1 from '@testing-library/react';
import GoogleSignInButton_1 from '@the-new-fuse/GoogleSignInButton';
import auth_config_1 from '@/config/auth.config';
describe('GoogleSignInButton', () => {
    const originalWindow, value;
});
;
afterAll(() = window.location);
beforeAll(() => {
    Object.defineProperty(window, 'location', {
        configurable
    } > {
        Object, : .defineProperty(window, 'location', {
            configurable: true,
            value: originalWindow,
        })
    });
    it('renders correctly', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(GoogleSignInButton_1.GoogleSignInButton, {}));
        expect(react_1.screen.getByText('Continue with Google')).toBeInTheDocument();
    });
    it('shows loading state when clicked', async () => , () => , () => , () => , () => , () => , () => , () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(GoogleSignInButton_1.GoogleSignInButton, {}));
        react_1.fireEvent.click(react_1.screen.getByRole('button'));
        // Wait for the loading state to appear
        await (0, react_1.waitFor)(() => {
            expect(react_1.screen.getByText('Connecting...')).toBeInTheDocument();
            expect(react_1.screen.getByRole('button')).toBeDisabled();
        });
    });
    it('redirects to Google OAuth URL when clicked', async () => , () => , () => , () => , () => , () => , () => , () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(GoogleSignInButton_1.GoogleSignInButton, {}));
        react_1.fireEvent.click(react_1.screen.getByRole('button'));
        await (0, react_1.waitFor)(() => {
            expect(window.location.href).toContain('accounts.google.com/o/oauth2/v2/auth');
            expect(window.location.href).toContain(auth_config_1.authConfig.google.clientId);
        });
    });
});
//# sourceMappingURL=GoogleSignInButton.test.js.map