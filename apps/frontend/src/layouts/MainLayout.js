import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
var MainLayout = function () {
    var isAuthenticated = useAuth().isAuthenticated;
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("nav", { className: "bg-white shadow-sm", children: _jsx("div", { className: "w-full px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "flex justify-between h-16", children: _jsx("div", { className: "flex", children: _jsx("div", { className: "flex-shrink-0 flex items-center", children: _jsx("img", { className: "h-8 w-auto", src: "/logo.svg", alt: "Logo" }) }) }) }) }) }), _jsx("main", { className: "w-full", children: _jsx(Outlet, {}) })] }));
};
export default MainLayout;
