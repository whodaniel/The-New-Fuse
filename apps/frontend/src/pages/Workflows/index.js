import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWorkflow } from '@/hooks';
import { Plus, Search, Calendar, Clock, Play, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
/**
 * Workflows page component
 */
var WorkflowsPage = function () {
    var navigate = useNavigate();
    var _a = useWorkflow(), workflows = _a.workflows, loading = _a.loading, error = _a.error, loadWorkflows = _a.loadWorkflows, createWorkflow = _a.createWorkflow, deleteWorkflow = _a.deleteWorkflow;
    var _b = useState(''), searchQuery = _b[0], setSearchQuery = _b[1];
    var _c = useState(false), isCreateDialogOpen = _c[0], setIsCreateDialogOpen = _c[1];
    var _d = useState(''), newWorkflowName = _d[0], setNewWorkflowName = _d[1];
    var _e = useState(''), newWorkflowDescription = _e[0], setNewWorkflowDescription = _e[1];
    // Load workflows on mount
    useEffect(function () {
        loadWorkflows();
    }, [loadWorkflows]);
    // Filter workflows based on search query
    var filteredWorkflows = workflows.filter(function (workflow) {
        return workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (workflow.description && workflow.description.toLowerCase().includes(searchQuery.toLowerCase()));
    });
    // Handle create workflow
    var handleCreateWorkflow = function () {
        if (!newWorkflowName.trim())
            return;
        var workflow = createWorkflow(newWorkflowName, newWorkflowDescription);
        setIsCreateDialogOpen(false);
        setNewWorkflowName('');
        setNewWorkflowDescription('');
        // Navigate to the workflow builder
        navigate("/workflows/builder?id=".concat(workflow.id));
    };
    // Format date
    var formatDate = function (date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "container mx-auto py-6 space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Workflows" }), _jsx("p", { className: "text-muted-foreground", children: "Create and manage your workflows" })] }), _jsxs(Dialog, { open: isCreateDialogOpen, onOpenChange: setIsCreateDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "New Workflow"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create New Workflow" }), _jsx(DialogDescription, { children: "Create a new workflow to automate your tasks." })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "name", children: "Name" }), _jsx(Input, { id: "name", value: newWorkflowName, onChange: function (e) { return setNewWorkflowName(e.target.value); }, placeholder: "My Workflow" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Textarea, { id: "description", value: newWorkflowDescription, onChange: function (e) { return setNewWorkflowDescription(e.target.value); }, placeholder: "Describe what this workflow does", rows: 3 })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: function () { return setIsCreateDialogOpen(false); }, children: "Cancel" }), _jsx(Button, { onClick: handleCreateWorkflow, children: "Create" })] })] })] })] }), _jsx("div", { className: "flex items-center space-x-2", children: _jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search workflows...", className: "pl-8", value: searchQuery, onChange: function (e) { return setSearchQuery(e.target.value); } })] }) }), loading ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) })) : error ? (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md", children: error.message })) : filteredWorkflows.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-64 text-center", children: [_jsx("div", { className: "text-muted-foreground mb-4", children: searchQuery ? 'No workflows match your search' : 'No workflows yet' }), !searchQuery && (_jsxs(Button, { onClick: function () { return setIsCreateDialogOpen(true); }, children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Create your first workflow"] }))] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredWorkflows.map(function (workflow) { return (_jsxs(Card, { className: "overflow-hidden", children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardTitle, { children: workflow.name }), _jsx(CardDescription, { className: "line-clamp-2", children: workflow.description || 'No description' })] }), _jsxs(CardContent, { className: "pb-2", children: [_jsxs("div", { className: "flex items-center text-sm text-muted-foreground", children: [_jsx(Calendar, { className: "h-4 w-4 mr-1" }), _jsxs("span", { children: ["Created: ", formatDate(workflow.createdAt)] })] }), _jsxs("div", { className: "flex items-center text-sm text-muted-foreground mt-1", children: [_jsx(Clock, { className: "h-4 w-4 mr-1" }), _jsxs("span", { children: ["Updated: ", formatDate(workflow.updatedAt)] })] })] }), _jsxs(CardFooter, { className: "flex justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", asChild: true, children: _jsxs(Link, { to: "/workflows/builder?id=".concat(workflow.id), children: [_jsx(Edit, { className: "h-4 w-4 mr-2" }), "Edit"] }) }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Play, { className: "h-4 w-4 mr-2" }), "Run"] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: _jsx(MoreHorizontal, { className: "h-4 w-4" }) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuLabel, { children: "Actions" }), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, { children: _jsxs(Link, { to: "/workflows/builder?id=".concat(workflow.id), className: "flex items-center w-full", children: [_jsx(Edit, { className: "h-4 w-4 mr-2" }), "Edit"] }) }), _jsxs(DropdownMenuItem, { children: [_jsx(Play, { className: "h-4 w-4 mr-2" }), "Run"] }), _jsxs(DropdownMenuItem, { children: [_jsx(Calendar, { className: "h-4 w-4 mr-2" }), "View History"] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { className: "text-red-600", onClick: function () { return deleteWorkflow(workflow.id); }, children: [_jsx(Trash2, { className: "h-4 w-4 mr-2" }), "Delete"] })] })] })] })] })] }, workflow.id)); }) }))] }) })] }));
};
export default WorkflowsPage;
