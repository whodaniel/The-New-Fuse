"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import react_2 from '@testing-library/react';
import TwoFactorAuth_1 from '../TwoFactorAuth.js';
import AuthContext_1 from '../../../contexts/AuthContext';
import testUtils_1 from '../../../utils/testUtils';
describe('TwoFactorAuth', () => {
    it('renders the component', () => {
        (0, react_2.render)(value, { testUtils_1, : .mockAuthContextValue } >
            />
            < /AuthContext_1.AuthContext.Provider>);
        expect(react_2.screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    });
    it('handles code input correctly', () => {
        (0, react_2.render)(value, { testUtils_1, : .mockAuthContextValue } >
            />
            < /AuthContext_1.AuthContext.Provider>);
        const input = react_2.screen.getByPlaceholderText('Enter code');
        react_2.fireEvent.change(input, { target: { value: '123456' } });
        expect(input).toHaveValue('123456');
    });
    it('calls the verifyTwoFactor function on form submit', () => {
        const verifyTwoFactorMock = jest.fn();
        const mockAuthContextValueWithVerify = Object.assign(Object.assign({}, testUtils_1.mockAuthContextValue), { verifyTwoFactor: verifyTwoFactorMock });
        (0, react_2.render)(value, { mockAuthContextValueWithVerify } >
            />
            < /AuthContext_1.AuthContext.Provider>);
        const input = react_2.screen.getByPlaceholderText('Enter code');
        react_2.fireEvent.change(input, { target: { value: '123456' } });
        react_2.fireEvent.submit(react_2.screen.getByRole('form'));
        expect(verifyTwoFactorMock).toHaveBeenCalledWith('123456');
    });
});
//# sourceMappingURL=TwoFactorAuth.test.js.map