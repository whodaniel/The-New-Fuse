import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
var Login = React.lazy(function () { return import('./Login'); });
var Register = React.lazy(function () { return import('./Register'); });
var ForgotPassword = React.lazy(function () { return import('./ForgotPassword'); });
var ResetPassword = React.lazy(function () { return import('./ResetPassword'); });
var SSO = React.lazy(function () { return import('./SSO'); });
var AuthLayout = function (_a) {
    var children = _a.children;
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4", children: _jsxs(Card, { className: "w-full max-w-lg", children: [_jsx(CardHeader, { className: "space-y-1", children: _jsx(CardTitle, { className: "text-2xl text-center font-bold", children: "Welcome to The New Fuse" }) }), _jsx(CardContent, { children: children })] }) }));
};
var Auth = function () {
    var isAuthenticated = useAuth().isAuthenticated;
    if (isAuthenticated) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return (_jsx(Routes, { children: _jsxs(Route, { element: _jsx(AuthLayout, {}), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "login", element: _jsx(Login, {}) }), _jsx(Route, { path: "register", element: _jsx(Register, {}) }), _jsx(Route, { path: "forgot-password", element: _jsx(ForgotPassword, {}) }), _jsx(Route, { path: "reset-password/:token", element: _jsx(ResetPassword, {}) }), _jsx(Route, { path: "sso/:provider", element: _jsx(SSO, {}) })] }) }));
};
export default Auth;
