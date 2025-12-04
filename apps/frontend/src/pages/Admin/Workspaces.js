import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, } from '@/components/core';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Users, Brain } from 'lucide-react';
var Workspaces = function () {
    var _a = useState(''), searchQuery = _a[0], setSearchQuery = _a[1];
    var workspaces = [
        {
            id: '1',
            name: 'Research Lab',
            owner: 'John Doe',
            members: 12,
            neuralNetworks: 5,
            storageUsed: '45.2 GB',
            status: 'active',
            lastActive: '2 hours ago',
        },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Workspaces" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Monitor and manage all workspaces" })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "All Workspaces" }), _jsx("div", { className: "flex items-center space-x-2", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search workspaces...", className: "pl-8", value: searchQuery, onChange: function (e) { return setSearchQuery(e.target.value); } })] }) })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "border rounded-lg", children: [_jsxs("div", { className: "grid grid-cols-7 gap-4 p-4 text-sm font-medium text-muted-foreground", children: [_jsx("div", { children: "Name" }), _jsx("div", { children: "Owner" }), _jsx("div", { children: "Members" }), _jsx("div", { children: "Neural Networks" }), _jsx("div", { children: "Storage Used" }), _jsx("div", { children: "Status" }), _jsx("div", { children: "Last Active" })] }), workspaces.map(function (workspace) { return (_jsxs("div", { className: "grid grid-cols-7 gap-4 p-4 border-t items-center", children: [_jsx("div", { className: "font-medium", children: workspace.name }), _jsx("div", { className: "text-muted-foreground", children: workspace.owner }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Users, { className: "h-4 w-4" }), _jsx("span", { children: workspace.members })] }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Brain, { className: "h-4 w-4" }), _jsx("span", { children: workspace.neuralNetworks })] }), _jsx("div", { children: workspace.storageUsed }), _jsx("div", { children: _jsx("span", { className: "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ".concat(workspace.status === 'active'
                                                    ? 'bg-green-50 text-green-700'
                                                    : 'bg-red-50 text-red-700'), children: workspace.status }) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: workspace.lastActive }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", children: _jsx(MoreHorizontal, { className: "h-4 w-4" }) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuItem, { children: "View Details" }), _jsx(DropdownMenuItem, { children: "View Members" }), _jsx(DropdownMenuItem, { children: "View Analytics" }), _jsx(DropdownMenuItem, { className: "text-destructive", children: "Deactivate Workspace" })] })] })] })] }, workspace.id)); })] }) })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Resource Usage" }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-[350px] flex items-center justify-center border rounded-lg", children: "Chart: Resource Usage by Workspace" }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Activity Overview" }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-[350px] flex items-center justify-center border rounded-lg", children: "Chart: Workspace Activity" }) })] })] })] }));
};
export default Workspaces;
