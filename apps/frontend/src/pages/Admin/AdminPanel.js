import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building, Heart, AlertTriangle, AlertCircle, Circle, Flag, Plug, Settings, User, RefreshCw, Bot, Plus, Hammer, BarChart, Siren, ClipboardList, } from 'lucide-react';
export default function AdminPanel() {
    var _a = useState(null), metrics = _a[0], setMetrics = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    // Mock data - replace with API call
    useEffect(function () {
        setTimeout(function () {
            setMetrics({
                totalUsers: 147,
                activeUsers: 23,
                totalWorkspaces: 12,
                activeWorkspaces: 8,
                totalAgents: 34,
                runningAgents: 12,
                systemUptime: '15 days, 4 hours',
                serverHealth: 'healthy',
                memoryUsage: 68,
                cpuUsage: 34
            });
            setLoading(false);
        }, 1000);
    }, []);
    var getHealthBadge = function (health) {
        switch (health) {
            case 'healthy':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'critical':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    var getHealthIcon = function (health) {
        switch (health) {
            case 'healthy':
                return _jsx(Heart, { className: "h-5 w-5 text-green-500" });
            case 'warning':
                return _jsx(AlertTriangle, { className: "h-5 w-5 text-yellow-500" });
            case 'critical':
                return _jsx(AlertCircle, { className: "h-5 w-5 text-red-500" });
            default:
                return _jsx(Circle, { className: "h-5 w-5 text-gray-500" });
        }
    };
    var getUsageColor = function (usage) {
        if (usage < 50)
            return 'bg-green-500';
        if (usage < 80)
            return 'bg-yellow-500';
        return 'bg-red-500';
    };
    var adminSections = [
        {
            title: 'User Management',
            description: 'Manage users, roles, and permissions',
            icon: _jsx(Users, { className: "h-6 w-6" }),
            link: '/admin/users',
            color: 'bg-blue-500'
        },
        {
            title: 'Workspace Management',
            description: 'Manage workspaces and organizations',
            icon: _jsx(Building, { className: "h-6 w-6" }),
            link: '/admin/workspaces',
            color: 'bg-green-500'
        },
        {
            title: 'System Health',
            description: 'Monitor system performance and status',
            icon: _jsx(Heart, { className: "h-6 w-6" }),
            link: '/admin/system-health',
            color: 'bg-emerald-500'
        },
        {
            title: 'Feature Flags',
            description: 'Enable/disable features and experiments',
            icon: _jsx(Flag, { className: "h-6 w-6" }),
            link: '/admin/feature-flags',
            color: 'bg-purple-500'
        },
        {
            title: 'Port Management',
            description: 'Manage application ports and services',
            icon: _jsx(Plug, { className: "h-6 w-6" }),
            link: '/admin/port-management',
            color: 'bg-orange-500'
        },
        {
            title: 'Admin Settings',
            description: 'Configure admin panel preferences',
            icon: _jsx(Settings, { className: "h-6 w-6" }),
            link: '/admin/settings',
            color: 'bg-gray-500'
        }
    ];
    if (loading) {
        return (_jsx("div", { className: "p-8 max-w-7xl mx-auto", children: _jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }) }));
    }
    return (_jsxs("div", { className: "p-8 max-w-7xl mx-auto", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2 flex items-center", children: [_jsx(User, { className: "h-8 w-8 mr-2" }), " Admin Panel"] }), _jsx("p", { className: "text-gray-600", children: "System administration and management dashboard" })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "text-sm text-gray-500", children: ["Last updated: ", new Date().toLocaleTimeString()] }), _jsxs("button", { onClick: function () { return window.location.reload(); }, className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), " Refresh"] })] })] }) }), metrics && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: metrics.totalUsers }), _jsx("p", { className: "text-sm text-gray-600", children: "Total Users" }), _jsxs("p", { className: "text-xs text-green-600", children: [metrics.activeUsers, " active now"] })] }), _jsx("div", { className: "text-3xl", children: _jsx(Users, { className: "h-8 w-8 text-gray-400" }) })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: metrics.totalWorkspaces }), _jsx("p", { className: "text-sm text-gray-600", children: "Total Workspaces" }), _jsxs("p", { className: "text-xs text-green-600", children: [metrics.activeWorkspaces, " active"] })] }), _jsx("div", { className: "text-3xl", children: _jsx(Building, { className: "h-8 w-8 text-gray-400" }) })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: metrics.totalAgents }), _jsx("p", { className: "text-sm text-gray-600", children: "Total Agents" }), _jsxs("p", { className: "text-xs text-green-600", children: [metrics.runningAgents, " running"] })] }), _jsx("div", { className: "text-3xl", children: _jsx(Bot, { className: "h-8 w-8 text-gray-400" }) })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "System Health" }), _jsxs("span", { className: "px-3 py-1 text-sm font-medium rounded-full border ".concat(getHealthBadge(metrics.serverHealth), " flex items-center"), children: [getHealthIcon(metrics.serverHealth), " ", _jsx("span", { className: "ml-1", children: metrics.serverHealth })] }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["Uptime: ", metrics.systemUptime] })] }), _jsx("div", { className: "text-3xl", children: getHealthIcon(metrics.serverHealth) })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Memory Usage" }), _jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Used" }), _jsxs("span", { className: "text-sm font-medium", children: [metrics.memoryUsage, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "h-2 rounded-full transition-all duration-300 ".concat(getUsageColor(metrics.memoryUsage)), style: { width: "".concat(metrics.memoryUsage, "%") } }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "CPU Usage" }), _jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Used" }), _jsxs("span", { className: "text-sm font-medium", children: [metrics.cpuUsage, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "h-2 rounded-full transition-all duration-300 ".concat(getUsageColor(metrics.cpuUsage)), style: { width: "".concat(metrics.cpuUsage, "%") } }) })] })] })] })), _jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [_jsxs("button", { className: "bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-left flex flex-col", children: [_jsx("div", { className: "text-2xl mb-2", children: _jsx(Plus, { className: "h-8 w-8" }) }), _jsx("div", { className: "font-medium", children: "Create User" }), _jsx("div", { className: "text-sm opacity-90", children: "Add a new user to the system" })] }), _jsxs("button", { className: "bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left flex flex-col", children: [_jsx("div", { className: "text-2xl mb-2", children: _jsx(Hammer, { className: "h-8 w-8" }) }), _jsx("div", { className: "font-medium", children: "Create Workspace" }), _jsx("div", { className: "text-sm opacity-90", children: "Set up a new workspace" })] }), _jsxs("button", { className: "bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-left flex flex-col", children: [_jsx("div", { className: "text-2xl mb-2", children: _jsx(Bot, { className: "h-8 w-8" }) }), _jsx("div", { className: "font-medium", children: "Deploy Agent" }), _jsx("div", { className: "text-sm opacity-90", children: "Deploy a new AI agent" })] }), _jsxs("button", { className: "bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors text-left flex flex-col", children: [_jsx("div", { className: "text-2xl mb-2", children: _jsx(BarChart, { className: "h-8 w-8" }) }), _jsx("div", { className: "font-medium", children: "View Reports" }), _jsx("div", { className: "text-sm opacity-90", children: "Generate system reports" })] }), _jsxs("button", { className: "bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 transition-colors text-left flex flex-col", children: [_jsx("div", { className: "text-2xl mb-2", children: _jsx(Siren, { className: "h-8 w-8" }) }), _jsx("div", { className: "font-medium", children: "System Alerts" }), _jsx("div", { className: "text-sm opacity-90", children: "Check system alerts" })] }), _jsxs("button", { className: "bg-gray-600 text-white p-4 rounded-lg hover:bg-gray-700 transition-colors text-left flex flex-col", children: [_jsx("div", { className: "text-2xl mb-2", children: _jsx(ClipboardList, { className: "h-8 w-8" }) }), _jsx("div", { className: "font-medium", children: "Audit Logs" }), _jsx("div", { className: "text-sm opacity-90", children: "Review system activity" })] })] })] }), _jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Administration" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: adminSections.map(function (section, index) { return (_jsxs(Link, { to: section.link, className: "bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow group", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("div", { className: "p-3 rounded-lg ".concat(section.color, " text-white text-2xl"), children: section.icon }), _jsx("div", { className: "text-gray-400 group-hover:text-gray-600 transition-colors", children: "\u2192" })] }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: section.title }), _jsx("p", { className: "text-sm text-gray-600", children: section.description })] }, index)); }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Recent Activity" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-4 p-3 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "text-2xl", children: "\uD83D\uDC64" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "New user registered" }), _jsx("p", { className: "text-xs text-gray-500", children: "alice@example.com \u2022 5 minutes ago" })] })] }), _jsxs("div", { className: "flex items-center space-x-4 p-3 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "text-2xl", children: "\uD83E\uDD16" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Agent deployment completed" }), _jsx("p", { className: "text-xs text-gray-500", children: "ChatBot v2.1 \u2022 12 minutes ago" })] })] }), _jsxs("div", { className: "flex items-center space-x-4 p-3 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "text-2xl", children: "\uD83C\uDFE2" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Workspace created" }), _jsx("p", { className: "text-xs text-gray-500", children: "Marketing Team \u2022 1 hour ago" })] })] }), _jsxs("div", { className: "flex items-center space-x-4 p-3 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "text-2xl", children: "\u2699\uFE0F" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "System configuration updated" }), _jsx("p", { className: "text-xs text-gray-500", children: "Feature flags modified \u2022 2 hours ago" })] })] })] }), _jsx("div", { className: "mt-4 text-center", children: _jsx("button", { className: "text-blue-600 hover:text-blue-700 text-sm font-medium", children: "View All Activity \u2192" }) })] })] }));
}
