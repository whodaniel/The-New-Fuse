import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@the-new-fuse/ui-consolidated';
import { FiMenu, FiHome, FiUsers, FiSettings, FiLayers, FiTool, FiMessageSquare, FiDatabase, FiActivity, FiShield, FiX } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
export var AdminLayout = function (_a) {
    var children = _a.children;
    var _b = useState(false), isMobileMenuOpen = _b[0], setIsMobileMenuOpen = _b[1];
    var location = useLocation();
    var menuItems = [
        { name: 'Dashboard', icon: FiHome, path: '/admin' },
        { name: 'Users', icon: FiUsers, path: '/admin/users' },
        { name: 'Onboarding', icon: FiLayers, path: '/admin/onboarding' },
        { name: 'Tools', icon: FiTool, path: '/admin/tools' },
        { name: 'Agents', icon: FiMessageSquare, path: '/admin/agents' },
        { name: 'Integrations', icon: FiDatabase, path: '/admin/integrations' },
        { name: 'Analytics', icon: FiActivity, path: '/admin/analytics' },
        { name: 'Security', icon: FiShield, path: '/admin/security' },
        { name: 'Settings', icon: FiSettings, path: '/admin/settings' },
    ];
    var closeMobileMenu = function () { return setIsMobileMenuOpen(false); };
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsxs("div", { className: "flex md:hidden items-center p-4 border-b border-border bg-background", children: [_jsx(Button, { variant: "outline", size: "icon", onClick: function () { return setIsMobileMenuOpen(true); }, "aria-label": "Open menu", children: _jsx(FiMenu, { className: "h-4 w-4" }) }), _jsx("h1", { className: "ml-4 font-bold text-foreground", children: "Admin Panel" })] }), isMobileMenuOpen && (_jsxs("div", { className: "fixed inset-0 z-50 md:hidden", children: [_jsx("div", { className: "fixed inset-0 bg-black/50", onClick: closeMobileMenu }), _jsxs("div", { className: "fixed left-0 top-0 h-full w-64 bg-background border-r border-border", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-border", children: [_jsx("h2", { className: "font-bold text-foreground", children: "Admin Panel" }), _jsx(Button, { variant: "ghost", size: "icon", onClick: closeMobileMenu, "aria-label": "Close menu", children: _jsx(FiX, { className: "h-4 w-4" }) })] }), _jsx("nav", { className: "flex flex-col", children: menuItems.map(function (item) {
                                    var Icon = item.icon;
                                    var isActive = location.pathname === item.path;
                                    return (_jsxs(Link, { to: item.path, onClick: closeMobileMenu, className: "flex items-center space-x-3 py-3 px-4 transition-colors hover:bg-accent hover:text-accent-foreground ".concat(isActive
                                            ? 'bg-accent text-accent-foreground border-r-2 border-primary'
                                            : 'text-muted-foreground'), children: [_jsx(Icon, { className: "h-4 w-4" }), _jsx("span", { children: item.name })] }, item.path));
                                }) })] })] })), _jsxs("div", { className: "flex", children: [_jsxs("div", { className: "hidden md:block w-64 h-screen bg-background border-r border-border fixed left-0 top-0 overflow-y-auto", children: [_jsx("div", { className: "p-4 border-b border-border", children: _jsx("h1", { className: "text-lg font-semibold text-foreground", children: "Admin Panel" }) }), _jsx("nav", { className: "flex flex-col", children: menuItems.map(function (item) {
                                    var Icon = item.icon;
                                    var isActive = location.pathname === item.path;
                                    return (_jsxs(Link, { to: item.path, className: "flex items-center space-x-3 py-3 px-4 transition-colors hover:bg-accent hover:text-accent-foreground ".concat(isActive
                                            ? 'bg-accent text-accent-foreground border-r-2 border-primary'
                                            : 'text-muted-foreground'), children: [_jsx(Icon, { className: "h-4 w-4" }), _jsx("span", { children: item.name })] }, item.path));
                                }) })] }), _jsx("div", { className: "w-full md:ml-64 p-6", children: children })] })] }));
};
