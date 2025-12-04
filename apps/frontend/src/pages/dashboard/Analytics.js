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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Download, Loader } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
var COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
var Analytics = function () {
    var _a = useState(null), data = _a[0], setData = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState('7d'), timeRange = _c[0], setTimeRange = _c[1];
    var _d = useState(false), refreshing = _d[0], setRefreshing = _d[1];
    var toast = useToast().toast;
    useEffect(function () {
        fetchAnalyticsData();
    }, [timeRange]);
    var fetchAnalyticsData = function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    // Fetch from multiple endpoints
                    return [4 /*yield*/, Promise.all([
                            fetch("/api/analytics/default/overview?timeframe=".concat(timeRange)),
                            fetch("/api/analytics/default/performance?timeframe=".concat(timeRange)),
                            fetch("/api/analytics/default/providers/performance?timeframe=".concat(timeRange)),
                            fetch("/api/analytics/default/quality-trends?timeframe=".concat(timeRange))
                        ])];
                case 1:
                    // Fetch from multiple endpoints
                    _a.sent();
                    mockData = {
                        overview: {
                            totalAgents: 24,
                            activeAgents: 18,
                            totalInteractions: 15420,
                            successRate: 98.5,
                            averageResponseTime: 245,
                            totalWorkflows: 156
                        },
                        performance: {
                            timeRange: '7d',
                            dataPoints: Array.from({ length: 7 }, function (_, i) { return ({
                                timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                                requests: Math.floor(Math.random() * 1000) + 500,
                                responses: Math.floor(Math.random() * 900) + 450,
                                errors: Math.floor(Math.random() * 50) + 5,
                                avgResponseTime: Math.floor(Math.random() * 200) + 100
                            }); })
                        },
                        agentMetrics: [
                            {
                                agentId: 'agent-1',
                                agentName: 'Data Analyzer',
                                totalTasks: 342,
                                successRate: 99.2,
                                avgResponseTime: 156,
                                lastActive: '2 minutes ago'
                            },
                            {
                                agentId: 'agent-2',
                                agentName: 'Report Generator',
                                totalTasks: 289,
                                successRate: 97.8,
                                avgResponseTime: 203,
                                lastActive: '5 minutes ago'
                            },
                            {
                                agentId: 'agent-3',
                                agentName: 'Content Creator',
                                totalTasks: 198,
                                successRate: 98.5,
                                avgResponseTime: 189,
                                lastActive: '12 minutes ago'
                            }
                        ],
                        qualityTrends: Array.from({ length: 30 }, function (_, i) { return ({
                            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                            qualityScore: Math.floor(Math.random() * 10) + 90,
                            userSatisfaction: Math.floor(Math.random() * 10) + 85,
                            errorRate: Math.floor(Math.random() * 5) + 1
                        }); }),
                        providerPerformance: [
                            {
                                provider: 'OpenAI',
                                totalRequests: 5420,
                                successRate: 99.1,
                                avgLatency: 145,
                                costPerRequest: 0.002
                            },
                            {
                                provider: 'Anthropic',
                                totalRequests: 3892,
                                successRate: 98.7,
                                avgLatency: 203,
                                costPerRequest: 0.003
                            },
                            {
                                provider: 'Google',
                                totalRequests: 2108,
                                successRate: 97.9,
                                avgLatency: 189,
                                costPerRequest: 0.0015
                            }
                        ],
                        costAnalysis: {
                            totalCost: 2847.50,
                            costByProvider: [
                                { provider: 'OpenAI', cost: 1247.50, percentage: 43.8 },
                                { provider: 'Anthropic', cost: 892.30, percentage: 31.3 },
                                { provider: 'Google', cost: 707.70, percentage: 24.9 }
                            ],
                            dailyCosts: Array.from({ length: 30 }, function (_, i) { return ({
                                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                                cost: Math.floor(Math.random() * 100) + 50
                            }); })
                        }
                    };
                    setData(mockData);
                    return [3 /*break*/, 4];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error fetching analytics:', error_1);
                    toast({
                        title: "Error",
                        description: "Failed to load analytics data",
                        variant: "destructive"
                    });
                    return [3 /*break*/, 4];
                case 3:
                    setLoading(false);
                    setRefreshing(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleRefresh = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setRefreshing(true);
                    return [4 /*yield*/, fetchAnalyticsData()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var handleExport = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, blob, url, a, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/analytics/default/export?timeframe=".concat(timeRange, "&format=json"))];
                case 1:
                    response = _b.sent();
                    return [4 /*yield*/, response.blob()];
                case 2:
                    blob = _b.sent();
                    url = window.URL.createObjectURL(blob);
                    a = document.createElement('a');
                    a.href = url;
                    a.download = "analytics-".concat(timeRange, "-").concat(new Date().toISOString(), ".json");
                    a.click();
                    window.URL.revokeObjectURL(url);
                    toast({
                        title: "Success",
                        description: "Analytics data exported successfully"
                    });
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    toast({
                        title: "Error",
                        description: "Failed to export analytics data",
                        variant: "destructive"
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(Loader, { className: "animate-spin h-8 w-8 text-primary" }) }));
    }
    if (!data) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("p", { className: "text-muted-foreground", children: "Failed to load analytics data" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold", children: "Analytics & Performance" }), _jsx("p", { className: "text-muted-foreground", children: "Monitor your system performance and usage metrics" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Select, { value: timeRange, onValueChange: setTimeRange, children: [_jsx(SelectTrigger, { className: "w-[180px]", children: _jsx(SelectValue, { placeholder: "Select time range" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "24h", children: "Last 24 hours" }), _jsx(SelectItem, { value: "7d", children: "Last 7 days" }), _jsx(SelectItem, { value: "30d", children: "Last 30 days" }), _jsx(SelectItem, { value: "90d", children: "Last 90 days" })] })] }), _jsxs(Button, { variant: "outline", onClick: handleRefresh, disabled: refreshing, children: [_jsx(RefreshCw, { className: "mr-2 h-4 w-4 ".concat(refreshing ? 'animate-spin' : '') }), "Refresh"] }), _jsxs(Button, { onClick: handleExport, children: [_jsx(Download, { className: "mr-2 h-4 w-4" }), "Export"] })] })] }), _jsxs(Tabs, { defaultValue: "overview", className: "space-y-4", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "performance", children: "Performance" }), _jsx(TabsTrigger, { value: "agents", children: "Agents" }), _jsx(TabsTrigger, { value: "quality", children: "Quality" }), _jsx(TabsTrigger, { value: "costs", children: "Costs" })] }), _jsx(TabsContent, { value: "overview", className: "space-y-4", children: _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Total Agents" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: data.overview.totalAgents }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [data.overview.activeAgents, " active"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Total Interactions" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: data.overview.totalInteractions.toLocaleString() }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Avg response: ", data.overview.averageResponseTime, "ms"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Success Rate" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold", children: [data.overview.successRate, "%"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Across all agents" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Total Workflows" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: data.overview.totalWorkflows }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Executed successfully" })] })] })] }) }), _jsx(TabsContent, { value: "performance", className: "space-y-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Performance Metrics" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: data.performance.dataPoints, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "timestamp" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "requests", stroke: "#8884d8", name: "Requests" }), _jsx(Line, { type: "monotone", dataKey: "responses", stroke: "#82ca9d", name: "Responses" }), _jsx(Line, { type: "monotone", dataKey: "errors", stroke: "#ff7300", name: "Errors" })] }) }) })] }) }), _jsx(TabsContent, { value: "agents", className: "space-y-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Agent Performance" }) }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", children: [_jsx("th", { className: "text-left p-2", children: "Agent Name" }), _jsx("th", { className: "text-left p-2", children: "Total Tasks" }), _jsx("th", { className: "text-left p-2", children: "Success Rate" }), _jsx("th", { className: "text-left p-2", children: "Avg Response Time" }), _jsx("th", { className: "text-left p-2", children: "Last Active" })] }) }), _jsx("tbody", { children: data.agentMetrics.map(function (agent) { return (_jsxs("tr", { className: "border-b", children: [_jsx("td", { className: "p-2", children: agent.agentName }), _jsx("td", { className: "p-2", children: agent.totalTasks }), _jsxs("td", { className: "p-2", children: [agent.successRate, "%"] }), _jsxs("td", { className: "p-2", children: [agent.avgResponseTime, "ms"] }), _jsx("td", { className: "p-2", children: agent.lastActive })] }, agent.agentId)); }) })] }) }) })] }) }), _jsx(TabsContent, { value: "quality", className: "space-y-4", children: _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Quality Trends" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: data.qualityTrends, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Area, { type: "monotone", dataKey: "qualityScore", stackId: "1", stroke: "#8884d8", fill: "#8884d8", name: "Quality Score" }), _jsx(Area, { type: "monotone", dataKey: "userSatisfaction", stackId: "1", stroke: "#82ca9d", fill: "#82ca9d", name: "User Satisfaction" })] }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Error Rate" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: data.qualityTrends, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "errorRate", fill: "#ff7300", name: "Error Rate %" })] }) }) })] })] }) }), _jsxs(TabsContent, { value: "costs", className: "space-y-4", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Cost by Provider" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: data.costAnalysis.costByProvider, cx: "50%", cy: "50%", labelLine: false, label: function (_a) {
                                                                    var provider = _a.provider, percentage = _a.percentage;
                                                                    return "".concat(provider, " ").concat(percentage, "%");
                                                                }, outerRadius: 80, fill: "#8884d8", dataKey: "cost", children: data.costAnalysis.costByProvider.map(function (entry, index) { return (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, "cell-".concat(index))); }) }), _jsx(Tooltip, {})] }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Daily Costs" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: data.costAnalysis.dailyCosts, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "cost", fill: "#8884d8", name: "Daily Cost ($)" })] }) }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Cost Summary" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-3xl font-bold", children: ["$", data.costAnalysis.totalCost.toLocaleString()] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Total cost for selected period" })] })] })] })] })] }));
};
export default Analytics;
