var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building, Heart, Database, BarChart3, Settings, FileText, HardDrive, Activity, Flag, Bot, RefreshCw, TrendingUp, Server, Shield, Clock, AlertCircle, CheckCircle, XCircle, ArrowUp, } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
export default function ComprehensiveAdminDashboard() {
    var _this = this;
    var _a = useState(null), metrics = _a[0], setMetrics = _a[1];
    var _b = useState([]), recentActivities = _b[0], setRecentActivities = _b[1];
    var _c = useState([]), alerts = _c[0], setAlerts = _c[1];
    var _d = useState(true), loading = _d[0], setLoading = _d[1];
    var _e = useState('24h'), timeRange = _e[0], setTimeRange = _e[1];
    // Mock performance data for charts
    var performanceData = [
        { time: '00:00', cpu: 45, memory: 62, requests: 1200 },
        { time: '04:00', cpu: 32, memory: 58, requests: 800 },
        { time: '08:00', cpu: 68, memory: 72, requests: 3500 },
        { time: '12:00', cpu: 78, memory: 76, requests: 4200 },
        { time: '16:00', cpu: 85, memory: 80, requests: 4800 },
        { time: '20:00', cpu: 52, memory: 68, requests: 2100 },
    ];
    var apiUsageData = [
        { name: 'Auth', value: 4200 },
        { name: 'Users', value: 3100 },
        { name: 'Agents', value: 2800 },
        { name: 'Chat', value: 5200 },
        { name: 'Other', value: 1500 },
    ];
    var COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
    useEffect(function () {
        loadDashboardData();
        var interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
        return function () { return clearInterval(interval); };
    }, [timeRange]);
    var loadDashboardData = function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    // In production, replace with actual API calls
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    // In production, replace with actual API calls
                    _a.sent();
                    setMetrics({
                        totalUsers: 1247,
                        activeUsers: 342,
                        totalWorkspaces: 156,
                        activeWorkspaces: 89,
                        totalAgents: 234,
                        runningAgents: 87,
                        systemUptime: '45 days, 12 hours',
                        serverHealth: 'healthy',
                        memoryUsage: 68,
                        cpuUsage: 45,
                        diskUsage: 52,
                        networkTraffic: 1.2,
                        apiRequests: 145234,
                        apiErrors: 234,
                        databaseConnections: 45,
                        cacheHitRate: 94.2,
                    });
                    setRecentActivities([
                        {
                            id: '1',
                            type: 'user',
                            user: 'alice@example.com',
                            action: 'Created new workspace "Marketing Team"',
                            timestamp: new Date(Date.now() - 5 * 60000),
                            status: 'success',
                        },
                        {
                            id: '2',
                            type: 'agent',
                            user: 'ChatBot v3.2',
                            action: 'Agent deployed successfully',
                            timestamp: new Date(Date.now() - 12 * 60000),
                            status: 'success',
                        },
                        {
                            id: '3',
                            type: 'system',
                            user: 'System',
                            action: 'Database backup completed',
                            timestamp: new Date(Date.now() - 30 * 60000),
                            status: 'success',
                        },
                        {
                            id: '4',
                            type: 'security',
                            user: 'bob@example.com',
                            action: 'Failed login attempt detected',
                            timestamp: new Date(Date.now() - 45 * 60000),
                            status: 'warning',
                        },
                        {
                            id: '5',
                            type: 'system',
                            user: 'System',
                            action: 'Cache cleared successfully',
                            timestamp: new Date(Date.now() - 60 * 60000),
                            status: 'success',
                        },
                    ]);
                    setAlerts([
                        {
                            id: '1',
                            level: 'warning',
                            message: 'High CPU usage detected on server-02 (85%)',
                            timestamp: new Date(Date.now() - 10 * 60000),
                            resolved: false,
                        },
                        {
                            id: '2',
                            level: 'info',
                            message: 'System maintenance scheduled for Saturday 2:00 AM',
                            timestamp: new Date(Date.now() - 120 * 60000),
                            resolved: false,
                        },
                        {
                            id: '3',
                            level: 'error',
                            message: 'Database connection pool exhausted',
                            timestamp: new Date(Date.now() - 180 * 60000),
                            resolved: true,
                        },
                    ]);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error loading dashboard data:', error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var getHealthBadge = function (health) {
        var badges = {
            healthy: 'bg-green-100 text-green-800 border-green-200',
            warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            critical: 'bg-red-100 text-red-800 border-red-200',
        };
        return badges[health];
    };
    var getHealthIcon = function (health) {
        var icons = {
            healthy: _jsx(CheckCircle, { className: "h-5 w-5 text-green-500" }),
            warning: _jsx(AlertCircle, { className: "h-5 w-5 text-yellow-500" }),
            critical: _jsx(XCircle, { className: "h-5 w-5 text-red-500" }),
        };
        return icons[health];
    };
    var getUsageColor = function (usage) {
        if (usage < 50)
            return 'bg-green-500';
        if (usage < 80)
            return 'bg-yellow-500';
        return 'bg-red-500';
    };
    var formatTimestamp = function (date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var minutes = Math.floor(diff / 60000);
        if (minutes < 1)
            return 'Just now';
        if (minutes < 60)
            return "".concat(minutes, "m ago");
        var hours = Math.floor(minutes / 60);
        if (hours < 24)
            return "".concat(hours, "h ago");
        var days = Math.floor(hours / 24);
        return "".concat(days, "d ago");
    };
    var getActivityIcon = function (type) {
        var icons = {
            user: _jsx(Users, { className: "h-5 w-5 text-blue-500" }),
            agent: _jsx(Bot, { className: "h-5 w-5 text-green-500" }),
            system: _jsx(Server, { className: "h-5 w-5 text-gray-500" }),
            security: _jsx(Shield, { className: "h-5 w-5 text-red-500" }),
        };
        return icons[type];
    };
    var getAlertIcon = function (level) {
        var icons = {
            info: _jsx(AlertCircle, { className: "h-5 w-5 text-blue-500" }),
            warning: _jsx(AlertCircle, { className: "h-5 w-5 text-yellow-500" }),
            error: _jsx(XCircle, { className: "h-5 w-5 text-red-500" }),
            critical: _jsx(XCircle, { className: "h-5 w-5 text-red-700" }),
        };
        return icons[level];
    };
    var adminSections = [
        {
            title: 'User Management',
            description: 'Manage users, roles, and permissions',
            icon: _jsx(Users, { className: "h-6 w-6" }),
            link: '/admin/user-management',
            color: 'bg-blue-500',
            count: (metrics === null || metrics === void 0 ? void 0 : metrics.totalUsers) || 0,
        },
        {
            title: 'System Metrics',
            description: 'Real-time performance monitoring',
            icon: _jsx(BarChart3, { className: "h-6 w-6" }),
            link: '/admin/system-metrics',
            color: 'bg-purple-500',
            count: "".concat((metrics === null || metrics === void 0 ? void 0 : metrics.cpuUsage) || 0, "%"),
        },
        {
            title: 'Agent Management',
            description: 'Monitor and control AI agents',
            icon: _jsx(Bot, { className: "h-6 w-6" }),
            link: '/admin/agent-management',
            color: 'bg-green-500',
            count: (metrics === null || metrics === void 0 ? void 0 : metrics.runningAgents) || 0,
        },
        {
            title: 'Database Admin',
            description: 'Database queries and management',
            icon: _jsx(Database, { className: "h-6 w-6" }),
            link: '/admin/database',
            color: 'bg-indigo-500',
            count: (metrics === null || metrics === void 0 ? void 0 : metrics.databaseConnections) || 0,
        },
        {
            title: 'API Analytics',
            description: 'API usage and performance stats',
            icon: _jsx(Activity, { className: "h-6 w-6" }),
            link: '/admin/api-analytics',
            color: 'bg-orange-500',
            count: (metrics === null || metrics === void 0 ? void 0 : metrics.apiRequests) || 0,
        },
        {
            title: 'Configuration',
            description: 'System configuration management',
            icon: _jsx(Settings, { className: "h-6 w-6" }),
            link: '/admin/configuration',
            color: 'bg-gray-500',
        },
        {
            title: 'Audit Logs',
            description: 'View system activity logs',
            icon: _jsx(FileText, { className: "h-6 w-6" }),
            link: '/admin/audit-logs',
            color: 'bg-yellow-500',
        },
        {
            title: 'Backup & Restore',
            description: 'Data backup and recovery',
            icon: _jsx(HardDrive, { className: "h-6 w-6" }),
            link: '/admin/backup-restore',
            color: 'bg-red-500',
        },
        {
            title: 'System Health',
            description: 'Infrastructure monitoring',
            icon: _jsx(Heart, { className: "h-6 w-6" }),
            link: '/admin/system-health',
            color: 'bg-pink-500',
        },
        {
            title: 'Feature Flags',
            description: 'Toggle features and experiments',
            icon: _jsx(Flag, { className: "h-6 w-6" }),
            link: '/admin/feature-flags',
            color: 'bg-teal-500',
        },
    ];
    if (loading && !metrics) {
        return (_jsx("div", { className: "p-8 max-w-7xl mx-auto", children: _jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: _jsxs("div", { className: "text-center", children: [_jsx(RefreshCw, { className: "h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading dashboard..." })] }) }) }));
    }
    return (_jsxs("div", { className: "p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-4xl font-bold text-gray-900 mb-2 flex items-center", children: [_jsx(Shield, { className: "h-10 w-10 mr-3 text-blue-600" }), "Admin Dashboard"] }), _jsx("p", { className: "text-gray-600", children: "Comprehensive platform management and monitoring" })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("select", { value: timeRange, onChange: function (e) { return setTimeRange(e.target.value); }, className: "px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "1h", children: "Last Hour" }), _jsx("option", { value: "24h", children: "Last 24 Hours" }), _jsx("option", { value: "7d", children: "Last 7 Days" }), _jsx("option", { value: "30d", children: "Last 30 Days" })] }), _jsxs("button", { onClick: loadDashboardData, className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 ".concat(loading ? 'animate-spin' : '') }), "Refresh"] })] })] }) }), metrics && (_jsx("div", { className: "mb-8 p-6 rounded-lg border-2 ".concat(metrics.serverHealth === 'healthy'
                    ? 'bg-green-50 border-green-200'
                    : metrics.serverHealth === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [getHealthIcon(metrics.serverHealth), _jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-semibold", children: ["System Status: ", metrics.serverHealth.charAt(0).toUpperCase() + metrics.serverHealth.slice(1)] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Uptime: ", metrics.systemUptime, " | Last updated: ", new Date().toLocaleTimeString()] })] })] }), _jsxs("div", { className: "flex items-center space-x-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold", children: metrics.activeUsers }), _jsx("div", { className: "text-xs text-gray-600", children: "Active Users" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold", children: metrics.runningAgents }), _jsx("div", { className: "text-xs text-gray-600", children: "Running Agents" })] }), _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-2xl font-bold", children: [metrics.cacheHitRate, "%"] }), _jsx("div", { className: "text-xs text-gray-600", children: "Cache Hit Rate" })] })] })] }) })), metrics && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(Users, { className: "h-8 w-8 text-blue-500" }), _jsx(TrendingUp, { className: "h-5 w-5 text-green-500" })] }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: metrics.totalUsers.toLocaleString() }), _jsx("div", { className: "text-sm text-gray-600", children: "Total Users" }), _jsxs("div", { className: "mt-2 text-xs text-green-600 flex items-center", children: [_jsx(ArrowUp, { className: "h-3 w-3 mr-1" }), "12% from last month"] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(Bot, { className: "h-8 w-8 text-green-500" }), _jsx(Activity, { className: "h-5 w-5 text-green-500" })] }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: metrics.totalAgents }), _jsx("div", { className: "text-sm text-gray-600", children: "Total Agents" }), _jsxs("div", { className: "mt-2 text-xs text-gray-600", children: [metrics.runningAgents, " currently active"] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(BarChart3, { className: "h-8 w-8 text-purple-500" }), _jsx(TrendingUp, { className: "h-5 w-5 text-green-500" })] }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: metrics.apiRequests.toLocaleString() }), _jsx("div", { className: "text-sm text-gray-600", children: "API Requests (24h)" }), _jsxs("div", { className: "mt-2 text-xs text-red-600 flex items-center", children: [metrics.apiErrors, " errors (0.16%)"] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(Building, { className: "h-8 w-8 text-orange-500" }), _jsx(Activity, { className: "h-5 w-5 text-green-500" })] }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: metrics.totalWorkspaces }), _jsx("div", { className: "text-sm text-gray-600", children: "Workspaces" }), _jsxs("div", { className: "mt-2 text-xs text-gray-600", children: [metrics.activeWorkspaces, " active"] })] })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "System Performance" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: performanceData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "time" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Area, { type: "monotone", dataKey: "cpu", stackId: "1", stroke: "#3b82f6", fill: "#3b82f6", name: "CPU %" }), _jsx(Area, { type: "monotone", dataKey: "memory", stackId: "2", stroke: "#10b981", fill: "#10b981", name: "Memory %" })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "API Request Volume" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: performanceData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "time" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "requests", stroke: "#8b5cf6", strokeWidth: 2, name: "Requests" })] }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "API Endpoints Usage" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: apiUsageData, cx: "50%", cy: "50%", labelLine: false, label: function (_a) {
                                                var name = _a.name, percent = _a.percent;
                                                return "".concat(name, " ").concat((percent * 100).toFixed(0), "%");
                                            }, outerRadius: 100, fill: "#8884d8", dataKey: "value", children: apiUsageData.map(function (entry, index) { return (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, "cell-".concat(index))); }) }), _jsx(Tooltip, {})] }) })] }), metrics && (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Resource Usage" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "CPU Usage" }), _jsxs("span", { className: "text-sm font-bold", children: [metrics.cpuUsage, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-3", children: _jsx("div", { className: "h-3 rounded-full transition-all duration-300 ".concat(getUsageColor(metrics.cpuUsage)), style: { width: "".concat(metrics.cpuUsage, "%") } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Memory Usage" }), _jsxs("span", { className: "text-sm font-bold", children: [metrics.memoryUsage, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-3", children: _jsx("div", { className: "h-3 rounded-full transition-all duration-300 ".concat(getUsageColor(metrics.memoryUsage)), style: { width: "".concat(metrics.memoryUsage, "%") } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Disk Usage" }), _jsxs("span", { className: "text-sm font-bold", children: [metrics.diskUsage, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-3", children: _jsx("div", { className: "h-3 rounded-full transition-all duration-300 ".concat(getUsageColor(metrics.diskUsage)), style: { width: "".concat(metrics.diskUsage, "%") } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Network Traffic" }), _jsxs("span", { className: "text-sm font-bold", children: [metrics.networkTraffic, " GB/s"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-3", children: _jsx("div", { className: "h-3 rounded-full transition-all duration-300 bg-blue-500", style: { width: "".concat(Math.min(metrics.networkTraffic * 20, 100), "%") } }) })] })] })] }))] }), _jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Admin Tools" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", children: adminSections.map(function (section, index) { return (_jsxs(Link, { to: section.link, className: "bg-white rounded-lg shadow-lg p-5 hover:shadow-xl transition-all group hover:-translate-y-1", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", { className: "p-3 rounded-lg ".concat(section.color, " text-white"), children: section.icon }), section.count && (_jsx("div", { className: "text-2xl font-bold text-gray-700", children: section.count }))] }), _jsx("h3", { className: "text-sm font-semibold text-gray-900 mb-1", children: section.title }), _jsx("p", { className: "text-xs text-gray-600", children: section.description })] }, index)); }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Recent Activity" }), _jsx(Clock, { className: "h-5 w-5 text-gray-400" })] }), _jsx("div", { className: "space-y-4", children: recentActivities.map(function (activity) { return (_jsxs("div", { className: "flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors", children: [_jsx("div", { className: "mt-1", children: getActivityIcon(activity.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: activity.user }), _jsx("p", { className: "text-xs text-gray-600", children: activity.action }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: formatTimestamp(activity.timestamp) })] }), _jsxs("div", { children: [activity.status === 'success' && _jsx(CheckCircle, { className: "h-4 w-4 text-green-500" }), activity.status === 'warning' && _jsx(AlertCircle, { className: "h-4 w-4 text-yellow-500" }), activity.status === 'error' && _jsx(XCircle, { className: "h-4 w-4 text-red-500" })] })] }, activity.id)); }) }), _jsx(Link, { to: "/admin/audit-logs", className: "block text-center mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium", children: "View All Activity \u2192" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "System Alerts" }), _jsx(AlertCircle, { className: "h-5 w-5 text-gray-400" })] }), _jsx("div", { className: "space-y-4", children: alerts.filter(function (a) { return !a.resolved; }).length === 0 ? (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx(CheckCircle, { className: "h-12 w-12 mx-auto mb-2 text-green-500" }), _jsx("p", { children: "No active alerts" })] })) : (alerts.filter(function (a) { return !a.resolved; }).map(function (alert) { return (_jsx("div", { className: "p-4 rounded-lg border-l-4 ".concat(alert.level === 'critical'
                                        ? 'bg-red-50 border-red-500'
                                        : alert.level === 'error'
                                            ? 'bg-red-50 border-red-400'
                                            : alert.level === 'warning'
                                                ? 'bg-yellow-50 border-yellow-500'
                                                : 'bg-blue-50 border-blue-500'), children: _jsxs("div", { className: "flex items-start space-x-3", children: [getAlertIcon(alert.level), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-semibold capitalize", children: alert.level }), _jsx("div", { className: "text-sm text-gray-700 mt-1", children: alert.message }), _jsx("div", { className: "text-xs text-gray-500 mt-2", children: formatTimestamp(alert.timestamp) })] })] }) }, alert.id)); })) }), alerts.filter(function (a) { return !a.resolved; }).length > 0 && (_jsx(Link, { to: "/admin/system-health", className: "block text-center mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium", children: "View All Alerts \u2192" }))] })] }), _jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6 text-center", children: [_jsxs("div", { children: [_jsx("div", { className: "text-3xl font-bold text-gray-900", children: metrics === null || metrics === void 0 ? void 0 : metrics.systemUptime }), _jsx("div", { className: "text-sm text-gray-600", children: "System Uptime" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-3xl font-bold text-gray-900", children: metrics === null || metrics === void 0 ? void 0 : metrics.databaseConnections }), _jsx("div", { className: "text-sm text-gray-600", children: "DB Connections" })] }), _jsxs("div", { children: [_jsxs("div", { className: "text-3xl font-bold text-gray-900", children: [metrics === null || metrics === void 0 ? void 0 : metrics.cacheHitRate, "%"] }), _jsx("div", { className: "text-sm text-gray-600", children: "Cache Hit Rate" })] }), _jsxs("div", { children: [_jsxs("div", { className: "text-3xl font-bold text-gray-900", children: [((metrics === null || metrics === void 0 ? void 0 : metrics.apiErrors) || 0) / ((metrics === null || metrics === void 0 ? void 0 : metrics.apiRequests) || 1) * 100, "%"] }), _jsx("div", { className: "text-sm text-gray-600", children: "Error Rate" })] })] }) })] }));
}
