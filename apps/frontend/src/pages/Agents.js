import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
export default function AgentsPage() {
    var _a = useState([]), agents = _a[0], setAgents = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    useEffect(function () {
        // Simulate loading agents from API
        setTimeout(function () {
            setAgents([
                {
                    id: '1',
                    name: 'Data Analyst Agent',
                    type: 'Analytics',
                    status: 'active',
                    lastActive: '2 minutes ago',
                    description: 'Specialized in data analysis and reporting',
                    capabilities: ['Data Processing', 'Report Generation', 'Chart Creation']
                },
                {
                    id: '2',
                    name: 'Customer Support Agent',
                    type: 'Support',
                    status: 'active',
                    lastActive: '5 minutes ago',
                    description: 'Handles customer inquiries and support tickets',
                    capabilities: ['Chat Support', 'Ticket Management', 'FAQ Assistance']
                },
                {
                    id: '3',
                    name: 'Code Review Agent',
                    type: 'Development',
                    status: 'inactive',
                    lastActive: '1 hour ago',
                    description: 'Reviews code for quality and security issues',
                    capabilities: ['Code Analysis', 'Security Scanning', 'Best Practices']
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);
    var getStatusColor = function (status) {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'inactive': return 'bg-gray-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading agents..." })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50 p-6", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "\uD83E\uDD16 AI Agents" }), _jsx("p", { className: "text-gray-600 mt-2", children: "Manage and monitor your AI agents" })] }), _jsx(Link, { to: "/agents/new", children: _jsx(Button, { className: "bg-blue-600 hover:bg-blue-700", children: "\u2795 Create New Agent" }) })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "p-2 bg-blue-100 rounded-lg", children: _jsx("span", { className: "text-2xl", children: "\uD83E\uDD16" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Agents" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: agents.length })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "p-2 bg-green-100 rounded-lg", children: _jsx("span", { className: "text-2xl", children: "\u2705" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Active" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: agents.filter(function (a) { return a.status === 'active'; }).length })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "p-2 bg-gray-100 rounded-lg", children: _jsx("span", { className: "text-2xl", children: "\u23F8\uFE0F" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Inactive" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: agents.filter(function (a) { return a.status === 'inactive'; }).length })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "p-2 bg-red-100 rounded-lg", children: _jsx("span", { className: "text-2xl", children: "\u274C" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Errors" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: agents.filter(function (a) { return a.status === 'error'; }).length })] })] }) }) })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: agents.map(function (agent) { return (_jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [_jsxs(CardHeader, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-lg", children: agent.name }), _jsx("div", { className: "w-3 h-3 rounded-full ".concat(getStatusColor(agent.status)) })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Badge, { variant: "secondary", children: agent.type }), _jsx("span", { className: "text-sm text-gray-500", children: agent.lastActive })] })] }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-gray-600 mb-4", children: agent.description }), _jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-700 mb-2", children: "Capabilities:" }), _jsx("div", { className: "flex flex-wrap gap-1", children: agent.capabilities.map(function (capability, index) { return (_jsx(Badge, { variant: "outline", className: "text-xs", children: capability }, index)); }) })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Link, { to: "/agents/".concat(agent.id), className: "flex-1", children: _jsx(Button, { variant: "outline", className: "w-full", children: "View Details" }) }), _jsx(Button, { variant: agent.status === 'active' ? 'destructive' : 'default', className: "flex-1", children: agent.status === 'active' ? 'Stop' : 'Start' })] })] })] }, agent.id)); }) }), _jsxs("div", { className: "mt-8 bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "\uD83D\uDE80 Quick Actions" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx(Link, { to: "/agents/new", children: _jsxs(Button, { variant: "outline", className: "w-full h-20 flex flex-col", children: [_jsx("span", { className: "text-2xl mb-2", children: "\u2795" }), _jsx("span", { children: "Create Agent" })] }) }), _jsx(Link, { to: "/dashboard/agents", children: _jsxs(Button, { variant: "outline", className: "w-full h-20 flex flex-col", children: [_jsx("span", { className: "text-2xl mb-2", children: "\uD83D\uDCCA" }), _jsx("span", { children: "View Analytics" })] }) }), _jsx(Link, { to: "/multi-agent-chat", children: _jsxs(Button, { variant: "outline", className: "w-full h-20 flex flex-col", children: [_jsx("span", { className: "text-2xl mb-2", children: "\uD83D\uDCAC" }), _jsx("span", { children: "Multi-Agent Chat" })] }) })] })] })] }) }));
}
