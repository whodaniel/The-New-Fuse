import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Outlet, NavLink, useParams } from 'react-router-dom';
import { BarChart, Settings, Users, Home, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/hooks/useWorkspace';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
export var WorkspaceLayout = function () {
    var workspaceId = useParams().workspaceId;
    var _a = useWorkspace(), workspaces = _a.workspaces, currentWorkspace = _a.currentWorkspace, selectWorkspace = _a.selectWorkspace, createWorkspace = _a.createWorkspace;
    var navItems = [
        { icon: Home, label: 'Overview', to: 'overview' },
        { icon: Users, label: 'Members', to: 'members' },
        { icon: BarChart, label: 'Analytics', to: 'analytics' },
        { icon: Settings, label: 'Settings', to: 'settings' },
    ];
    React.useEffect(function () {
        if (workspaceId) {
            selectWorkspace(workspaceId);
        }
    }, [workspaceId, selectWorkspace]);
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx("header", { className: "border-b", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsx("div", { className: "h-16 flex items-center justify-between", children: _jsx("div", { className: "flex items-center space-x-4", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", className: "h-auto px-2", children: [_jsx("span", { className: "font-medium", children: (currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.name) || 'Select Workspace' }), _jsx(ChevronDown, { className: "ml-2 h-4 w-4" })] }) }), _jsxs(DropdownMenuContent, { align: "start", className: "w-48", children: [workspaces === null || workspaces === void 0 ? void 0 : workspaces.map(function (workspace) { return (_jsx(DropdownMenuItem, { onClick: function () { return selectWorkspace(workspace.id); }, children: workspace.name }, workspace.id)); }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: createWorkspace, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Create Workspace"] })] })] }) }) }), _jsx("nav", { className: "flex space-x-4", children: navItems.map(function (_a) {
                                var Icon = _a.icon, label = _a.label, to = _a.to;
                                return (_jsxs(NavLink, { to: "".concat(workspaceId, "/").concat(to), className: function (_a) {
                                        var isActive = _a.isActive;
                                        return "flex items-center px-3 py-2 text-sm font-medium rounded-md ".concat(isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:text-primary');
                                    }, children: [_jsx(Icon, { className: "mr-2 h-4 w-4" }), label] }, to));
                            }) })] }) }), _jsx("main", { className: "container mx-auto px-4 py-6", children: _jsx(Outlet, {}) })] }));
};
export default WorkspaceLayout;
