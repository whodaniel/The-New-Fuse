import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../providers/AuthProvider';
import { Home, LayoutGrid, BarChart2, BrainCircuit, MessageSquare, Settings, } from 'lucide-react';
export function Sidebar(_a) {
    var _b = _a.className, className = _b === void 0 ? '' : _b;
    var layout = useLayout().layout;
    var isAuthenticated = useAuth().isAuthenticated;
    var location = useLocation();
    var navItems = [
        {
            name: 'Home',
            path: '/',
            icon: _jsx(Home, { className: "h-5 w-5" }),
            requiresAuth: false,
        },
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: _jsx(LayoutGrid, { className: "h-5 w-5" }),
            requiresAuth: true,
        },
        {
            name: 'Analytics',
            path: '/analytics',
            icon: _jsx(BarChart2, { className: "h-5 w-5" }),
            requiresAuth: true,
        },
        {
            name: 'AI Portal',
            path: '/ai-portal',
            icon: _jsx(BrainCircuit, { className: "h-5 w-5" }),
            requiresAuth: true,
        },
        {
            name: 'Multi-Agent Chat',
            path: '/multi-agent-chat',
            icon: _jsx(MessageSquare, { className: "h-5 w-5" }),
            requiresAuth: false,
        },
        {
            name: 'Settings',
            path: '/settings',
            icon: _jsx(Settings, { className: "h-5 w-5" }),
            requiresAuth: true,
        },
    ];
    var filteredNavItems = navItems.filter(function (item) { return !item.requiresAuth || isAuthenticated; });
    return (_jsx("aside", { className: "bg-background border-r border-border transition-all duration-300 ".concat(className), children: _jsx("nav", { className: "p-4", children: _jsx("ul", { className: "space-y-2", children: filteredNavItems.map(function (item) {
                    var isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (_jsx("li", { children: _jsxs(Link, { to: item.path, className: "flex items-center p-2 rounded-md transition-colors ".concat(isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-foreground hover:bg-accent hover:text-accent-foreground'), children: [_jsx("span", { className: "mr-3", children: item.icon }), layout.sidebarOpen && _jsx("span", { children: item.name })] }) }, item.path));
                }) }) }) }));
}
