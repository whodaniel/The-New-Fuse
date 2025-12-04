import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Folders, Activity, Settings, Bell, Layers } from 'lucide-react';
import { Button } from '@/components/core';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
var AdminLayout = function () {
    var navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', to: 'dashboard' },
        { icon: Users, label: 'Users', to: 'users' },
        { icon: Folders, label: 'Workspaces', to: 'workspaces' },
        { icon: Layers, label: 'Onboarding', to: 'onboarding' },
        { icon: Activity, label: 'System Health', to: 'system-health' },
        { icon: Settings, label: 'Settings', to: 'settings' },
    ];
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx("header", { className: "border-b", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs("div", { className: "h-16 flex items-center justify-between", children: [_jsx("div", { className: "flex items-center space-x-4", children: _jsx("h1", { className: "text-xl font-bold", children: "Admin Dashboard" }) }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Button, { variant: "ghost", size: "icon", children: _jsx(Bell, { className: "h-5 w-5" }) }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", className: "relative h-8 w-8 rounded-full", children: _jsx("div", { className: "flex h-full w-full items-center justify-center rounded-full bg-muted", children: "A" }) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuItem, { children: "Profile" }), _jsx(DropdownMenuItem, { children: "Settings" }), _jsx(DropdownMenuItem, { className: "text-destructive", children: "Sign out" })] })] })] })] }), _jsx("nav", { className: "flex space-x-4", children: navItems.map(function (_a) {
                                var Icon = _a.icon, label = _a.label, to = _a.to;
                                return (_jsxs(NavLink, { to: to, className: function (_a) {
                                        var isActive = _a.isActive;
                                        return "flex items-center px-3 py-2 text-sm font-medium rounded-md ".concat(isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:text-foreground');
                                    }, children: [_jsx(Icon, { className: "mr-2 h-4 w-4" }), label] }, to));
                            }) })] }) }), _jsx("main", { className: "container mx-auto px-4 py-8", children: _jsx(Outlet, {}) })] }));
};
export default AdminLayout;
