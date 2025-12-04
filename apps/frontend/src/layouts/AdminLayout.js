import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, UserPlus, Settings, FileText, BarChart2, CreditCard, ChevronLeft } from 'lucide-react';
/**
 * Layout for administration pages
 */
var AdminLayout = function () {
    var location = useLocation();
    // Admin navigation items
    var adminNavItems = [
        { name: 'Users', icon: Users, href: '/admin/users', current: location.pathname === '/admin/users' },
        { name: 'Teams', icon: UserPlus, href: '/admin/teams', current: location.pathname === '/admin/teams' },
        { name: 'Settings', icon: Settings, href: '/admin/settings', current: location.pathname === '/admin/settings' },
        { name: 'Audit Logs', icon: FileText, href: '/admin/audit-logs', current: location.pathname === '/admin/audit-logs' },
        { name: 'Usage Statistics', icon: BarChart2, href: '/admin/usage', current: location.pathname === '/admin/usage' },
        { name: 'Billing', icon: CreditCard, href: '/admin/billing', current: location.pathname === '/admin/billing' },
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gray-100", children: [_jsx("div", { className: "bg-white shadow", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between h-16", children: [_jsx("div", { className: "flex", children: _jsx("div", { className: "flex-shrink-0 flex items-center", children: _jsxs(Link, { to: "/dashboard", className: "flex items-center text-blue-600 hover:text-blue-800", children: [_jsx(ChevronLeft, { className: "h-5 w-5 mr-1" }), _jsx("span", { className: "font-medium", children: "Back to Dashboard" })] }) }) }), _jsx("div", { className: "flex items-center", children: _jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "Admin Panel" }) })] }) }) }), _jsx("div", { className: "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex flex-col md:flex-row", children: [_jsx("div", { className: "w-full md:w-64 mb-6 md:mb-0 md:mr-6", children: _jsxs("div", { className: "bg-white shadow rounded-lg overflow-hidden", children: [_jsx("div", { className: "px-4 py-5 sm:px-6", children: _jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Administration" }) }), _jsx("div", { className: "border-t border-gray-200", children: _jsx("nav", { className: "px-4 py-3", children: _jsx("div", { className: "space-y-1", children: adminNavItems.map(function (item) { return (_jsxs(Link, { to: item.href, className: "".concat(item.current
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900', " group flex items-center px-3 py-2 text-sm font-medium rounded-md"), children: [_jsx(item.icon, { className: "".concat(item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500', " mr-3 flex-shrink-0 h-5 w-5") }), item.name] }, item.name)); }) }) }) })] }) }), _jsx("div", { className: "flex-1", children: _jsx("div", { className: "bg-white shadow rounded-lg", children: _jsx("div", { className: "px-4 py-5 sm:p-6", children: _jsx(Outlet, {}) }) }) })] }) })] }));
};
export default AdminLayout;
