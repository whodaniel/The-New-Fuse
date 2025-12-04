import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkflow } from '@/hooks';
import WorkflowAnalytics from '@/components/workflow/WorkflowAnalytics';
import { ChevronLeft, Play, Edit, Clock, GitBranch } from 'lucide-react';
/**
 * Workflow Detail page component
 */
var WorkflowDetail = function () {
    var id = useParams().id;
    var navigate = useNavigate();
    var _a = useWorkflow(), workflows = _a.workflows, loading = _a.loading, error = _a.error;
    var _b = useState(null), workflow = _b[0], setWorkflow = _b[1];
    // Find the workflow by ID
    useEffect(function () {
        if (id && workflows.length > 0) {
            var foundWorkflow = workflows.find(function (w) { return w.id === id; });
            setWorkflow(foundWorkflow || null);
        }
    }, [id, workflows]);
    // Format date
    var formatDate = function (date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        }).format(date);
    };
    if (loading) {
        return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx("div", { className: "container mx-auto py-6", children: _jsx("div", { className: "flex justify-center items-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }) }) })] }));
    }
    if (error) {
        return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx("div", { className: "container mx-auto py-6", children: _jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md", children: error.message }) }) })] }));
    }
    if (!workflow) {
        return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "container mx-auto py-6", children: [_jsx("div", { className: "bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md", children: "Workflow not found. The workflow may have been deleted or you may not have access to it." }), _jsx("div", { className: "mt-4", children: _jsxs(Button, { variant: "outline", onClick: function () { return navigate('/workflows'); }, children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-2" }), "Back to Workflows"] }) })] }) })] }));
    }
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "container mx-auto py-6 space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: function () { return navigate('/workflows'); }, className: "mr-4", children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), "Back"] }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: workflow.name }), _jsxs("p", { className: "text-muted-foreground", children: ["Created ", formatDate(workflow.createdAt), " \u2022 Updated ", formatDate(workflow.updatedAt)] })] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { variant: "outline", asChild: true, children: _jsxs(Link, { to: "/workflows/builder?id=".concat(workflow.id), children: [_jsx(Edit, { className: "h-4 w-4 mr-2" }), "Edit"] }) }), _jsxs(Button, { children: [_jsx(Play, { className: "h-4 w-4 mr-2" }), "Execute"] })] })] }), _jsxs(Tabs, { defaultValue: "overview", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "executions", children: "Executions" }), _jsx(TabsTrigger, { value: "settings", children: "Settings" }), _jsx(TabsTrigger, { value: "analytics", children: "Analytics" })] }), _jsxs(TabsContent, { value: "overview", className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Nodes" }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: workflow.nodes.length }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Connections" }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: workflow.edges.length }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Last Execution" }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-sm text-muted-foreground", children: "Never executed" }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Description" }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-muted-foreground", children: workflow.description || 'No description provided.' }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Workflow Diagram" }) }), _jsx(CardContent, { className: "h-64 flex items-center justify-center bg-gray-50 rounded-md", children: _jsxs("div", { className: "text-center", children: [_jsx(GitBranch, { className: "h-12 w-12 text-gray-300 mx-auto mb-2" }), _jsx("p", { className: "text-muted-foreground", children: "Open the workflow builder to view and edit the workflow diagram." }), _jsx(Button, { variant: "outline", className: "mt-4", asChild: true, children: _jsx(Link, { to: "/workflows/builder?id=".concat(workflow.id), children: "Open Workflow Builder" }) })] }) })] })] }), _jsx(TabsContent, { value: "executions", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Execution History" }), _jsx(CardDescription, { children: "View the history of workflow executions." })] }), _jsx(CardContent, { children: _jsxs("div", { className: "text-center py-8", children: [_jsx(Clock, { className: "h-12 w-12 text-gray-300 mx-auto mb-2" }), _jsx("p", { className: "text-muted-foreground", children: "No executions yet. Execute the workflow to see results here." }), _jsxs(Button, { className: "mt-4", children: [_jsx(Play, { className: "h-4 w-4 mr-2" }), "Execute Workflow"] })] }) })] }) }), _jsx(TabsContent, { value: "settings", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Workflow Settings" }), _jsx(CardDescription, { children: "Configure settings for this workflow." })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "Execution Mode" }), _jsxs("select", { id: "execution-mode", "aria-label": "Execution Mode", className: "w-full p-2 border rounded-md", children: [_jsx("option", { value: "sequential", children: "Sequential" }), _jsx("option", { value: "parallel", children: "Parallel" })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "Error Handling" }), _jsxs("select", { id: "error-handling", "aria-label": "Error Handling", className: "w-full p-2 border rounded-md", children: [_jsx("option", { value: "stop", children: "Stop on Error" }), _jsx("option", { value: "continue", children: "Continue on Error" }), _jsx("option", { value: "retry", children: "Retry on Error" })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "Timeout (seconds)" }), _jsx("input", { id: "timeout", type: "number", "aria-label": "Timeout in seconds", className: "w-full p-2 border rounded-md", defaultValue: 300, min: 1 })] })] }) }), _jsx(CardFooter, { children: _jsx(Button, { children: "Save Settings" }) })] }) }), _jsx(TabsContent, { value: "analytics", className: "space-y-4", children: _jsx(WorkflowAnalytics, { workflowId: (workflow === null || workflow === void 0 ? void 0 : workflow.id) || '' }) })] })] }) })] }));
};
export default WorkflowDetail;
