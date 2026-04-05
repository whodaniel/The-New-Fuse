import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuthContext } from '../../providers/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '../Alert/Alert';
import { Button } from '../Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../Card';
import { Input } from '../Input';
/**
 * Login form component
 * @param props Login form props
 * @returns Login form component
 *
 * @example
 * // Basic usage
 * <LoginForm onSuccess={() => navigate('/dashboard')} />
 *
 * // With cancel button
 * <LoginForm
 *   onSuccess={() => navigate('/dashboard')}
 *   onCancel={() => navigate('/')}
 *   showCancel
 * />
 */
export function LoginForm({ onSuccess, onCancel, showCancel = false, className, }) {
    const { login, isLoading } = useAuthContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }
        try {
            setError(null);
            await login(email, password);
            onSuccess?.();
        }
        catch (err) {
            setError(err.message || 'Failed to login');
        }
    };
    return (_jsxs(Card, { className: className, children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Sign In" }), _jsx(CardDescription, { children: "Enter your credentials to sign in to your account" })] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(CardContent, { className: "space-y-4", children: [error && (_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertTitle, { children: "Error" }), _jsx(AlertDescription, { children: error })] })), _jsx(Input, { label: "Email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Enter your email", required: true, disabled: isLoading }), _jsx(Input, { label: "Password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Enter your password", required: true, disabled: isLoading })] }), _jsxs(CardFooter, { className: "flex justify-between", children: [showCancel && (_jsx(Button, { type: "button", variant: "outline", onClick: onCancel, disabled: isLoading, children: "Cancel" })), _jsx(Button, { type: "submit", disabled: isLoading, isLoading: isLoading, children: "Sign In" })] })] })] }));
}
