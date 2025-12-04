import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
/**
 * Layout for authentication pages (login, register, etc.)
 */
var AuthLayout = function () {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-3xl font-extrabold text-gray-900", children: "The New Fuse" }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: "AI Agent Management Platform" })] }), _jsx("div", { className: "mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10", children: _jsx(Outlet, {}) })] }) }));
};
export default AuthLayout;
