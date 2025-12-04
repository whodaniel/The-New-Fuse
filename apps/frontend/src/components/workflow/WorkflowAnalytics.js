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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
export var WorkflowAnalytics = function (_a) {
    var workflowId = _a.workflowId;
    var _b = useState(null), metrics = _b[0], setMetrics = _b[1];
    var _c = useState(true), loading = _c[0], setLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    // Fetch metrics
    useEffect(function () {
        var fetchMetrics = function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockMetrics, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoading(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        // In a real app, this would fetch metrics from an API
                        // For now, we'll just simulate a delay and return mock data
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1500); })];
                    case 2:
                        // In a real app, this would fetch metrics from an API
                        // For now, we'll just simulate a delay and return mock data
                        _a.sent();
                        mockMetrics = {
                            executionCount: 42,
                            averageExecutionTime: 1250, // ms
                            successRate: 0.95, // 95%
                            lastExecutionTime: Date.now() - 3600000, // 1 hour ago
                            nodeMetrics: [
                                {
                                    nodeId: 'node-1',
                                    nodeName: 'Input',
                                    nodeType: 'input',
                                    executionCount: 42,
                                    averageExecutionTime: 50,
                                    successRate: 1.0,
                                    lastExecutionTime: Date.now() - 3600000
                                },
                                {
                                    nodeId: 'node-2',
                                    nodeName: 'Agent',
                                    nodeType: 'agent',
                                    executionCount: 42,
                                    averageExecutionTime: 850,
                                    successRate: 0.95,
                                    lastExecutionTime: Date.now() - 3600000
                                },
                                {
                                    nodeId: 'node-3',
                                    nodeName: 'Transform',
                                    nodeType: 'transform',
                                    executionCount: 40,
                                    averageExecutionTime: 120,
                                    successRate: 0.98,
                                    lastExecutionTime: Date.now() - 3600000
                                },
                                {
                                    nodeId: 'node-4',
                                    nodeName: 'A2A',
                                    nodeType: 'a2a',
                                    executionCount: 38,
                                    averageExecutionTime: 950,
                                    successRate: 0.92,
                                    lastExecutionTime: Date.now() - 3600000
                                },
                                {
                                    nodeId: 'node-5',
                                    nodeName: 'Output',
                                    nodeType: 'output',
                                    executionCount: 35,
                                    averageExecutionTime: 30,
                                    successRate: 1.0,
                                    lastExecutionTime: Date.now() - 3600000
                                }
                            ]
                        };
                        setMetrics(mockMetrics);
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        setError('Failed to fetch metrics');
                        console.error('Failed to fetch metrics:', err_1);
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        fetchMetrics();
    }, [workflowId]);
    // Format time
    var formatTime = function (time) {
        if (time < 1000) {
            return "".concat(time, "ms");
        }
        else if (time < 60000) {
            return "".concat((time / 1000).toFixed(1), "s");
        }
        else {
            return "".concat((time / 60000).toFixed(1), "m");
        }
    };
    // Format date
    var formatDate = function (timestamp) {
        return new Date(timestamp).toLocaleString();
    };
    // Format percentage
    var formatPercentage = function (value) {
        return "".concat((value * 100).toFixed(1), "%");
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }));
    }
    if (error) {
        return (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md", children: error }));
    }
    if (!metrics) {
        return (_jsx("div", { className: "text-center text-muted-foreground", children: "No metrics available" }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Executions" }), _jsx(CardDescription, { children: "Total workflow executions" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: metrics.executionCount }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Avg. Execution Time" }), _jsx(CardDescription, { children: "Average workflow execution time" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: formatTime(metrics.averageExecutionTime) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Success Rate" }), _jsx(CardDescription, { children: "Percentage of successful executions" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: formatPercentage(metrics.successRate) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Last Execution" }), _jsx(CardDescription, { children: "Time of last execution" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-sm font-bold", children: formatDate(metrics.lastExecutionTime) }) })] })] }), _jsxs(Tabs, { defaultValue: "execution-time", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "execution-time", children: "Execution Time" }), _jsx(TabsTrigger, { value: "success-rate", children: "Success Rate" }), _jsx(TabsTrigger, { value: "execution-count", children: "Execution Count" })] }), _jsx(TabsContent, { value: "execution-time", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Node Execution Time" }), _jsx(CardDescription, { children: "Average execution time per node" })] }), _jsx(CardContent, { children: _jsx("div", { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: metrics.nodeMetrics, margin: { top: 20, right: 30, left: 20, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "nodeName" }), _jsx(YAxis, { label: { value: 'Time (ms)', angle: -90, position: 'insideLeft' } }), _jsx(Tooltip, { formatter: function (value) { return formatTime(value); } }), _jsx(Bar, { dataKey: "averageExecutionTime", fill: "#8884d8", name: "Execution Time" })] }) }) }) })] }) }), _jsx(TabsContent, { value: "success-rate", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Node Success Rate" }), _jsx(CardDescription, { children: "Success rate per node" })] }), _jsx(CardContent, { children: _jsx("div", { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: metrics.nodeMetrics, margin: { top: 20, right: 30, left: 20, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "nodeName" }), _jsx(YAxis, { domain: [0, 1], label: { value: 'Success Rate', angle: -90, position: 'insideLeft' } }), _jsx(Tooltip, { formatter: function (value) { return formatPercentage(value); } }), _jsx(Bar, { dataKey: "successRate", fill: "#82ca9d", name: "Success Rate" })] }) }) }) })] }) }), _jsx(TabsContent, { value: "execution-count", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Node Execution Count" }), _jsx(CardDescription, { children: "Number of executions per node" })] }), _jsx(CardContent, { children: _jsx("div", { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: metrics.nodeMetrics, margin: { top: 20, right: 30, left: 20, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "nodeName" }), _jsx(YAxis, { label: { value: 'Count', angle: -90, position: 'insideLeft' } }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "executionCount", fill: "#ffc658", name: "Execution Count" })] }) }) }) })] }) })] })] }));
};
export default WorkflowAnalytics;
