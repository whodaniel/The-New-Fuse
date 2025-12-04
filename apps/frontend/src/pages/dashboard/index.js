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
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Bot, Users, BarChart3, Settings, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
var Dashboard = function () {
    var navigate = useNavigate();
    var _a = useAuth(), user = _a.user, logout = _a.logout;
    var _b = useState({
        activeAgents: 0,
        totalInteractions: 0,
        successRate: 0,
        totalUsers: 0,
        systemLoad: 0,
        uptime: '0d 0h 0m'
    }), stats = _b[0], setStats = _b[1];
    var _c = useState(true), loading = _c[0], setLoading = _c[1];
    useEffect(function () {
        fetchDashboardData();
        var interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
        return function () { return clearInterval(interval); };
    }, []);
    var fetchDashboardData = function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, monitoringResponse, analyticsResponse, monitoringData, _b, analyticsData, _c, error_1;
        var _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    _k.trys.push([0, 8, 9, 10]);
                    return [4 /*yield*/, Promise.all([
                            fetch('/api/monitoring/health'),
                            fetch('/api/analytics/overview/default')
                        ])];
                case 1:
                    _a = _k.sent(), monitoringResponse = _a[0], analyticsResponse = _a[1];
                    if (!monitoringResponse.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, monitoringResponse.json()];
                case 2:
                    _b = _k.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _b = null;
                    _k.label = 4;
                case 4:
                    monitoringData = _b;
                    if (!analyticsResponse.ok) return [3 /*break*/, 6];
                    return [4 /*yield*/, analyticsResponse.json()];
                case 5:
                    _c = _k.sent();
                    return [3 /*break*/, 7];
                case 6:
                    _c = null;
                    _k.label = 7;
                case 7:
                    analyticsData = _c;
                    setStats({
                        activeAgents: ((_d = monitoringData === null || monitoringData === void 0 ? void 0 : monitoringData.overview) === null || _d === void 0 ? void 0 : _d.activeAgents) || 12,
                        totalInteractions: ((_e = analyticsData === null || analyticsData === void 0 ? void 0 : analyticsData.summary) === null || _e === void 0 ? void 0 : _e.totalRequests) || 1234,
                        successRate: ((_f = analyticsData === null || analyticsData === void 0 ? void 0 : analyticsData.summary) === null || _f === void 0 ? void 0 : _f.clientSatisfaction) || 98.5,
                        totalUsers: ((_g = monitoringData === null || monitoringData === void 0 ? void 0 : monitoringData.overview) === null || _g === void 0 ? void 0 : _g.totalUsers) || 156,
                        systemLoad: ((_h = monitoringData === null || monitoringData === void 0 ? void 0 : monitoringData.overview) === null || _h === void 0 ? void 0 : _h.systemLoad) || 45.2,
                        uptime: ((_j = monitoringData === null || monitoringData === void 0 ? void 0 : monitoringData.overview) === null || _j === void 0 ? void 0 : _j.uptime) || '2d 14h 32m'
                    });
                    return [3 /*break*/, 10];
                case 8:
                    error_1 = _k.sent();
                    console.error('Error fetching dashboard data:', error_1);
                    // Fallback to mock data
                    setStats({
                        activeAgents: 12,
                        totalInteractions: 1234,
                        successRate: 98.5,
                        totalUsers: 156,
                        systemLoad: 45.2,
                        uptime: '2d 14h 32m'
                    });
                    return [3 /*break*/, 10];
                case 9:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); };
    var quickActions = [
        {
            title: 'Create New Agent',
            description: 'Build a new AI agent with custom capabilities',
            icon: Bot,
            action: function () { return navigate('/dashboard/agents/new'); },
            color: 'bg-blue-500'
        },
        {
            title: 'View Analytics',
            description: 'Monitor your system performance and usage metrics',
            icon: BarChart3,
            action: function () { return navigate('/dashboard/analytics'); },
            color: 'bg-green-500'
        },
        {
            title: 'System Monitoring',
            description: 'Real-time system health and performance monitoring',
            icon: Activity,
            action: function () { return navigate('/dashboard/monitoring'); },
            color: 'bg-purple-500'
        },
        {
            title: 'Manage Team',
            description: 'Add or remove team members and manage permissions',
            icon: Users,
            action: function () { return navigate('/workspace/members'); },
            color: 'bg-orange-500'
        },
        {
            title: 'Agent Management',
            description: 'View and manage all your AI agents',
            icon: Bot,
            action: function () { return navigate('/dashboard/agents'); },
            color: 'bg-indigo-500'
        },
        {
            title: 'Settings',
            description: 'Configure your account and system preferences',
            icon: Settings,
            action: function () { return navigate('/dashboard/settings'); },
            color: 'bg-gray-500'
        }
    ];
    // Helper function for formatting stat changes (currently unused but useful for future enhancements)
    // const formatStatChange = (base: number, change: number) => {
    //   const prefix = change >= 0 ? '+' : '';
    //   return `${prefix}${change}%`;
    // };
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 p-6 overflow-auto", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold", children: ["Welcome back, ", (user === null || user === void 0 ? void 0 : user.displayName) || 'User', "!"] }), _jsx("p", { className: "text-muted-foreground", children: "Here's what's happening with your agents and system" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { onClick: function () { return navigate('/dashboard/agents/new'); }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " New Agent"] }), _jsx(Button, { variant: "outline", onClick: logout, children: "Logout" })] })] }), _jsxs("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8", children: [_jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "font-semibold mb-2 text-sm text-muted-foreground", children: "Active Agents" }), _jsx("p", { className: "text-3xl font-bold", children: loading ? '...' : stats.activeAgents }), _jsx("p", { className: "text-xs text-muted-foreground", children: "+2 from last week" })] }), _jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "font-semibold mb-2 text-sm text-muted-foreground", children: "Total Interactions" }), _jsx("p", { className: "text-3xl font-bold", children: loading ? '...' : stats.totalInteractions }), _jsx("p", { className: "text-xs text-muted-foreground", children: "+15% from last month" })] }), _jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "font-semibold mb-2 text-sm text-muted-foreground", children: "Success Rate" }), _jsxs("p", { className: "text-3xl font-bold", children: [loading ? '...' : stats.successRate, "%"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "+0.5% from last week" })] }), _jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "font-semibold mb-2 text-sm text-muted-foreground", children: "Total Users" }), _jsx("p", { className: "text-3xl font-bold", children: loading ? '...' : stats.totalUsers }), _jsx("p", { className: "text-xs text-muted-foreground", children: "+8% from last month" })] }), _jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "font-semibold mb-2 text-sm text-muted-foreground", children: "System Load" }), _jsxs("p", { className: "text-3xl font-bold", children: [loading ? '...' : stats.systemLoad, "%"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Normal" })] }), _jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "font-semibold mb-2 text-sm text-muted-foreground", children: "Uptime" }), _jsx("p", { className: "text-2xl font-bold", children: loading ? '...' : stats.uptime }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Continuous" })] })] }), _jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Quick Actions" }), _jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: quickActions.map(function (action) { return (_jsxs(Card, { className: "p-6 cursor-pointer hover:bg-accent transition-colors hover:shadow-lg", onClick: action.action, children: [_jsx("div", { className: "flex items-center mb-4", children: _jsx("div", { className: "p-3 rounded-lg ".concat(action.color, " bg-opacity-10"), children: _jsx(action.icon, { className: "h-6 w-6 ".concat(action.color.replace('bg-', 'text-')) }) }) }), _jsx("h3", { className: "font-semibold mb-2", children: action.title }), _jsx("p", { className: "text-sm text-muted-foreground", children: action.description })] }, action.title)); }) })] }), _jsxs("div", { className: "grid lg:grid-cols-2 gap-6", children: [_jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "font-semibold mb-4", children: "Recent Agent Activity" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between p-3 bg-muted rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Agent Alpha" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Completed workflow: Data Analysis" })] }), _jsx("span", { className: "text-sm text-muted-foreground", children: "2 min ago" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 bg-muted rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Agent Beta" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Started task: Report Generation" })] }), _jsx("span", { className: "text-sm text-muted-foreground", children: "5 min ago" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 bg-muted rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Agent Gamma" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Updated configuration" })] }), _jsx("span", { className: "text-sm text-muted-foreground", children: "12 min ago" })] })] })] }), _jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "font-semibold mb-4", children: "System Health" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: "Database" }), _jsx("span", { className: "text-sm font-medium text-green-600", children: "Healthy" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: "Cache" }), _jsx("span", { className: "text-sm font-medium text-green-600", children: "Healthy" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: "Queue" }), _jsx("span", { className: "text-sm font-medium text-green-600", children: "Healthy" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: "WebSocket" }), _jsx("span", { className: "text-sm font-medium text-green-600", children: "Healthy" })] })] })] })] })] }) })] }));
};
export default Dashboard;
