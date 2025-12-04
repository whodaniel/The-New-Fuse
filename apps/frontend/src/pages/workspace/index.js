import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { WorkspaceLayout } from './WorkspaceLayout';
import { useWorkspace } from '@/hooks/useWorkspace';
import WorkspaceOverview from './Overview';
import WorkspaceSettings from './Settings';
import WorkspaceMembers from './Members';
import WorkspaceAnalytics from './Analytics';
var WorkspaceRoutes = function () {
    var _a = useWorkspace(), workspaces = _a.workspaces, createWorkspace = _a.createWorkspace;
    if (!(workspaces === null || workspaces === void 0 ? void 0 : workspaces.length)) {
        return (_jsx("div", { className: "container mx-auto px-4 py-8", children: _jsxs("div", { className: "max-w-lg mx-auto space-y-8", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Create your first workspace" }), _jsx("p", { className: "text-muted-foreground", children: "Get started by creating a workspace to organize your agents and tasks." })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "No workspaces found" }) }), _jsx(CardContent, { children: _jsxs(Button, { onClick: createWorkspace, className: "w-full", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Create Workspace"] }) })] })] }) }));
    }
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: workspaces[0].id, replace: true }) }), _jsxs(Route, { path: ":workspaceId", element: _jsx(WorkspaceLayout, {}), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "overview", replace: true }) }), _jsx(Route, { path: "overview", element: _jsx(WorkspaceOverview, {}) }), _jsx(Route, { path: "members", element: _jsx(WorkspaceMembers, {}) }), _jsx(Route, { path: "analytics", element: _jsx(WorkspaceAnalytics, {}) }), _jsx(Route, { path: "settings", element: _jsx(WorkspaceSettings, {}) })] })] }));
};
export default WorkspaceRoutes;
