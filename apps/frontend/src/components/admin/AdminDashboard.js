import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiUsers, FiActivity, FiMessageSquare, FiServer, FiAlertCircle } from 'react-icons/fi';
export var AdminDashboard = function () {
    var _a = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalAgents: 0,
        activeAgents: 0,
        systemHealth: 0,
        userGrowth: 0,
        agentGrowth: 0
    }), stats = _a[0], setStats = _a[1];
    var _b = useState([]), recentActivities = _b[0], setRecentActivities = _b[1];
    var _c = useState([]), alerts = _c[0], setAlerts = _c[1];
    // Simulate fetching data
    useEffect(function () {
        // In a real implementation, this would fetch data from an API
        setStats({
            totalUsers: 256,
            activeUsers: 124,
            totalAgents: 78,
            activeAgents: 42,
            systemHealth: 98,
            userGrowth: 12,
            agentGrowth: 24
        });
        setRecentActivities([
            {
                id: '1',
                type: 'user',
                user: 'John Doe',
                action: 'Created a new workspace',
                timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
            },
            {
                id: '2',
                type: 'agent',
                user: 'Research Assistant',
                action: 'Completed a task',
                timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
            },
            {
                id: '3',
                type: 'system',
                user: 'System',
                action: 'Backup completed',
                timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
            },
            {
                id: '4',
                type: 'user',
                user: 'Jane Smith',
                action: 'Updated profile',
                timestamp: new Date(Date.now() - 1000 * 60 * 45) // 45 minutes ago
            },
            {
                id: '5',
                type: 'agent',
                user: 'Code Assistant',
                action: 'Generated code',
                timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
            }
        ]);
        setAlerts([
            {
                id: '1',
                level: 'info',
                message: 'System update scheduled for tomorrow',
                timestamp: new Date(Date.now() - 1000 * 60 * 120) // 2 hours ago
            },
            {
                id: '2',
                level: 'warning',
                message: 'High CPU usage detected',
                timestamp: new Date(Date.now() - 1000 * 60 * 180) // 3 hours ago
            }
        ]);
    }, []);
    // Format timestamp
    var formatTime = function (date) {
        var now = new Date();
        var diffMs = now.getTime() - date.getTime();
        var diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins < 1)
            return 'Just now';
        if (diffMins < 60)
            return "".concat(diffMins, " min").concat(diffMins === 1 ? '' : 's', " ago");
        var diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24)
            return "".concat(diffHours, " hour").concat(diffHours === 1 ? '' : 's', " ago");
        var diffDays = Math.floor(diffHours / 24);
        return "".concat(diffDays, " day").concat(diffDays === 1 ? '' : 's', " ago");
    };
    return (_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Admin Dashboard" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsxs("div", { className: "p-4 shadow-md border border-gray-200 rounded-md", children: [_jsx("div", { className: "text-sm text-gray-500", children: "Total Users" }), _jsxs("div", { className: "flex items-center", children: [_jsx(FiUsers, { className: "mr-2 text-blue-500" }), _jsx("div", { className: "text-2xl font-bold", children: stats.totalUsers })] }), _jsxs("div", { className: "text-sm text-gray-500", children: [_jsx("span", { className: "text-green-500", children: "\u2191" }), stats.userGrowth, "% since last month"] })] }), _jsxs("div", { className: "p-4 shadow-md border border-gray-200 rounded-md", children: [_jsx("div", { className: "text-sm text-gray-500", children: "Active Users" }), _jsx("div", { className: "text-2xl font-bold", children: stats.activeUsers }), _jsxs("div", { className: "text-sm text-gray-500", children: [Math.round((stats.activeUsers / stats.totalUsers) * 100), "% of total users"] })] }), _jsxs("div", { className: "p-4 shadow-md border border-gray-200 rounded-md", children: [_jsx("div", { className: "text-sm text-gray-500", children: "Total Agents" }), _jsxs("div", { className: "flex items-center", children: [_jsx(FiMessageSquare, { className: "mr-2 text-green-500" }), _jsx("div", { className: "text-2xl font-bold", children: stats.totalAgents })] }), _jsxs("div", { className: "text-sm text-gray-500", children: [_jsx("span", { className: "text-green-500", children: "\u2191" }), stats.agentGrowth, "% since last month"] })] }), _jsxs("div", { className: "p-4 shadow-md border border-gray-200 rounded-md", children: [_jsx("div", { className: "text-sm text-gray-500", children: "System Health" }), _jsxs("div", { className: "flex items-center", children: [_jsx(FiServer, { className: "mr-2 text-purple-500" }), _jsxs("div", { className: "text-2xl font-bold", children: [stats.systemHealth, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2", children: _jsx("div", { className: "bg-green-600 h-2.5 rounded-full", style: { width: "".concat(stats.systemHealth, "%") } }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md", children: [_jsx("div", { className: "p-4 border-b", children: _jsx("h2", { className: "text-lg font-semibold", children: "Recent Activity" }) }), _jsx("div", { className: "p-4", children: _jsx("div", { className: "divide-y divide-gray-200", children: recentActivities.map(function (activity) { return (_jsx("div", { className: "py-4", children: _jsxs("div", { className: "flex justify-between", children: [_jsxs("div", { className: "flex", children: [_jsx(FiActivity, { className: "mr-3 ".concat(activity.type === 'user' ? 'text-blue-500' : activity.type === 'agent' ? 'text-green-500' : 'text-gray-500') }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: activity.user }), _jsx("div", { className: "text-sm text-gray-600", children: activity.action })] })] }), _jsx("div", { className: "text-sm text-gray-500", children: formatTime(activity.timestamp) })] }) }, activity.id)); }) }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md", children: [_jsx("div", { className: "p-4 border-b", children: _jsx("h2", { className: "text-lg font-semibold", children: "System Alerts" }) }), _jsx("div", { className: "p-4", children: _jsx("div", { className: "space-y-4", children: alerts.map(function (alert) { return (_jsxs("div", { className: "p-4 rounded-md flex items-start ".concat(alert.level === 'info' ? 'bg-blue-100 text-blue-800' : alert.level === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'), children: [_jsx(FiAlertCircle, { className: "mr-3 mt-1" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: alert.level.charAt(0).toUpperCase() + alert.level.slice(1) }), _jsx("div", { className: "text-sm", children: alert.message }), _jsx("div", { className: "text-xs mt-1", children: formatTime(alert.timestamp) })] })] }, alert.id)); }) }) })] })] })] }));
};
