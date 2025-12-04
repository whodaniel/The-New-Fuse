import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
export var LandingHeader = function () {
    return (_jsx("header", { className: "bg-background shadow-sm sticky top-0 z-50", role: "banner", children: _jsxs("nav", { className: "container mx-auto px-4 py-3 flex justify-between items-center", role: "navigation", "aria-label": "Main navigation", children: [_jsx(Link, { to: "/", className: "text-2xl font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/20 rounded-md px-2 py-1", "aria-label": "The New Fuse - Home", children: "The New Fuse" }), _jsxs("div", { className: "space-x-2", role: "group", "aria-label": "Account actions", children: [_jsx(Button, { asChild: true, variant: "ghost", className: "focus:ring-4 focus:ring-primary/20", "aria-label": "Log in to your account", children: _jsx(Link, { to: "/auth/login", children: "Login" }) }), _jsx(Button, { asChild: true, className: "focus:ring-4 focus:ring-primary/20", "aria-label": "Sign up for a new account", children: _jsx(Link, { to: "/auth/register", children: "Sign Up" }) })] })] }) }));
};
