var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Bot, Code, FileText, Database, MoreVertical, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Mock data for agents
var mockAgents = [
    {
        id: 1,
        name: 'CodeAssistant',
        description: 'Helps with coding tasks and code reviews',
        type: 'Development',
        status: 'Active',
        lastActive: '2 minutes ago',
        tasks: 42,
        successRate: '98%',
        icon: Code,
    },
    {
        id: 2,
        name: 'DataAnalyzer',
        description: 'Analyzes data and generates insights',
        type: 'Analytics',
        status: 'Active',
        lastActive: '15 minutes ago',
        tasks: 38,
        successRate: '95%',
        icon: Database,
    },
    {
        id: 3,
        name: 'ContentWriter',
        description: 'Creates and edits content for various platforms',
        type: 'Content',
        status: 'Inactive',
        lastActive: '2 days ago',
        tasks: 31,
        successRate: '92%',
        icon: FileText,
    },
    {
        id: 4,
        name: 'BugHunter',
        description: 'Identifies and fixes bugs in the codebase',
        type: 'QA',
        status: 'Maintenance',
        lastActive: '1 hour ago',
        tasks: 27,
        successRate: '89%',
        icon: Bot,
    },
    {
        id: 5,
        name: 'APIIntegrator',
        description: 'Handles API integrations and data synchronization',
        type: 'Development',
        status: 'Active',
        lastActive: '30 minutes ago',
        tasks: 24,
        successRate: '94%',
        icon: Code,
    },
    {
        id: 6,
        name: 'DocumentationBot',
        description: 'Creates and maintains documentation',
        type: 'Content',
        status: 'Active',
        lastActive: '45 minutes ago',
        tasks: 19,
        successRate: '97%',
        icon: FileText,
    },
];
/**
 * Agents page component
 */
var Agents = function () {
    var navigate = useNavigate();
    var _a = useState(''), searchQuery = _a[0], setSearchQuery = _a[1];
    var _b = useState('All'), filterType = _b[0], setFilterType = _b[1];
    var _c = useState('All'), filterStatus = _c[0], setFilterStatus = _c[1];
    // Filter agents based on search query and filters
    var filteredAgents = mockAgents.filter(function (agent) {
        var matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agent.description.toLowerCase().includes(searchQuery.toLowerCase());
        var matchesType = filterType === 'All' || agent.type === filterType;
        var matchesStatus = filterStatus === 'All' || agent.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });
    // Get unique agent types for filter
    var agentTypes = __spreadArray(['All'], new Set(mockAgents.map(function (agent) { return agent.type; })), true);
    // Get unique agent statuses for filter
    var agentStatuses = __spreadArray(['All'], new Set(mockAgents.map(function (agent) { return agent.status; })), true);
    // Get status badge color
    var getStatusBadge = function (status) {
        switch (status) {
            case 'Active':
                return (_jsxs(Badge, { className: "bg-green-100 text-green-800 hover:bg-green-100", children: [_jsx(CheckCircle, { className: "w-3 h-3 mr-1" }), status] }));
            case 'Inactive':
                return (_jsxs(Badge, { className: "bg-gray-100 text-gray-800 hover:bg-gray-100", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), status] }));
            case 'Maintenance':
                return (_jsxs(Badge, { className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100", children: [_jsx(AlertCircle, { className: "w-3 h-3 mr-1" }), status] }));
            default:
                return _jsx(Badge, { children: status });
        }
    };
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 p-6 overflow-auto", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Agents" }), _jsx("p", { className: "text-muted-foreground", children: "Manage and monitor your AI agents" })] }), _jsxs(Button, { onClick: function () { return navigate('/agents/new'); }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " Create Agent"] })] }), _jsxs("div", { className: "flex flex-col md:flex-row gap-4 mb-6", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" }), _jsx(Input, { placeholder: "Search agents...", className: "pl-10", value: searchQuery, onChange: function (e) { return setSearchQuery(e.target.value); } })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "relative", children: [_jsx("select", { className: "h-10 px-3 py-2 rounded-md border border-input bg-background text-sm", value: filterType, onChange: function (e) { return setFilterType(e.target.value); }, children: agentTypes.map(function (type) { return (_jsx("option", { value: type, children: type }, type)); }) }), _jsx(Filter, { className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" })] }), _jsxs("div", { className: "relative", children: [_jsx("select", { className: "h-10 px-3 py-2 rounded-md border border-input bg-background text-sm", value: filterStatus, onChange: function (e) { return setFilterStatus(e.target.value); }, children: agentStatuses.map(function (status) { return (_jsx("option", { value: status, children: status }, status)); }) }), _jsx(Filter, { className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" })] })] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredAgents.map(function (agent) { return (_jsxs(Card, { className: "overflow-hidden", children: [_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("div", { className: "p-2 rounded-lg bg-primary/10", children: _jsx(agent.icon, { className: "h-6 w-6 text-primary" }) }), _jsxs("div", { className: "flex items-center", children: [getStatusBadge(agent.status), _jsx("button", { className: "ml-2 text-gray-500 hover:text-gray-700", title: "More options", children: _jsx(MoreVertical, { className: "h-4 w-4" }) })] })] }), _jsx("h3", { className: "text-xl font-semibold mb-2", children: agent.name }), _jsx("p", { className: "text-muted-foreground mb-4", children: agent.description }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Type" }), _jsx("p", { className: "font-medium", children: agent.type })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Tasks" }), _jsx("p", { className: "font-medium", children: agent.tasks })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Success" }), _jsx("p", { className: "font-medium", children: agent.successRate })] })] })] }), _jsxs("div", { className: "px-6 py-4 bg-muted/50 flex justify-between items-center", children: [_jsxs("span", { className: "text-sm text-muted-foreground", children: ["Last active: ", agent.lastActive] }), _jsx(Button, { variant: "outline", size: "sm", onClick: function () { return navigate("/agents/".concat(agent.id)); }, title: "View agent details", children: "View Details" })] })] }, agent.id)); }) }), filteredAgents.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx(Bot, { className: "mx-auto h-12 w-12 text-muted-foreground mb-4" }), _jsx("h3", { className: "text-lg font-medium mb-2", children: "No agents found" }), _jsx("p", { className: "text-muted-foreground mb-4", children: searchQuery || filterType !== 'All' || filterStatus !== 'All'
                                        ? "Try adjusting your search or filters"
                                        : "Create your first agent to get started" }), _jsxs(Button, { onClick: function () { return navigate('/agents/new'); }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " Create Agent"] })] }))] }) })] }));
};
export default Agents;
