import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuthContext } from '../../providers/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '../Alert/Alert';
import { Button } from '../Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../Card';
import { Input } from '../Input';
/**
 * Register form component
 * @param props Register form props
 * @returns Register form component
 *
 * @example
 * // Basic usage
 * <RegisterForm onSuccess={() => navigate('/dashboard')} />
 *
 * // With cancel button
 * <RegisterForm
 *   onSuccess={() => navigate('/dashboard')}
 *   onCancel={() => navigate('/')}
 *   showCancel
 * />
 */
export function RegisterForm({ onSuccess, onCancel, showCancel = false, className, }) {
    const { register, isLoading } = useAuthContext();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            setError(null);
            await register(name, email, password);
            onSuccess?.();
        }
        catch (err) {
            setError(err.message || 'Failed to register');
        }
    };
    return (_jsxs(Card, { className: className, children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Create Account" }), _jsx(CardDescription, { children: "Enter your details to create a new account" })] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(CardContent, { className: "space-y-4", children: [error && (_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertTitle, { children: "Error" }), _jsx(AlertDescription, { children: error })] })), _jsx(Input, { label: "Name", type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "Enter your name", required: true, disabled: isLoading }), _jsx(Input, { label: "Email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Enter your email", required: true, disabled: isLoading }), _jsx(Input, { label: "Password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Enter your password", required: true, disabled: isLoading }), _jsx(Input, { label: "Confirm Password", type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "Confirm your password", required: true, disabled: isLoading })] }), _jsxs(CardFooter, { className: "flex justify-between", children: [showCancel && (_jsx(Button, { type: "button", variant: "outline", onClick: onCancel, disabled: isLoading, children: "Cancel" })), _jsx(Button, { type: "submit", disabled: isLoading, isLoading: isLoading, children: "Create Account" })] })] })] }));
}
