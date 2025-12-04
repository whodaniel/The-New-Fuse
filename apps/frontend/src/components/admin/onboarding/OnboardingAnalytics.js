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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Download, Calendar, RefreshCw, MoreVertical, BarChart2, PieChart, TrendingUp, Users, Clock, AlertCircle } from 'lucide-react';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service';
import { LineChart, Line, BarChart, Bar, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
export var OnboardingAnalytics = function () {
    var _a = useState(true), isLoading = _a[0], setIsLoading = _a[1];
    var _b = useState(null), error = _b[0], setError = _b[1];
    var _c = useState(null), analytics = _c[0], setAnalytics = _c[1];
    var _d = useState('last30days'), dateRange = _d[0], setDateRange = _d[1];
    var _e = useState('previous'), comparisonPeriod = _e[0], setComparisonPeriod = _e[1];
    // Chart colors
    var COLORS = ['#3182CE', '#4FD1C5', '#F6AD55', '#F56565', '#9F7AEA', '#ED64A6'];
    // Fetch analytics data
    useEffect(function () {
        var fetchAnalytics = function () { return __awaiter(void 0, void 0, void 0, function () {
            var data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        setIsLoading(true);
                        setError(null);
                        return [4 /*yield*/, OnboardingAdminService.getAnalytics()];
                    case 1:
                        data = _a.sent();
                        setAnalytics(data);
                        return [3 /*break*/, 4];
                    case 2:
                        err_1 = _a.sent();
                        console.error('Error fetching analytics:', err_1);
                        setError('Failed to load analytics data. Please try again.');
                        return [3 /*break*/, 4];
                    case 3:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        fetchAnalytics();
    }, [dateRange]);
    // Handle refresh
    var handleRefresh = function () { return __awaiter(void 0, void 0, void 0, function () {
        var data, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setIsLoading(true);
                    setError(null);
                    return [4 /*yield*/, OnboardingAdminService.getAnalytics()];
                case 1:
                    data = _a.sent();
                    setAnalytics(data);
                    return [3 /*break*/, 4];
                case 2:
                    err_2 = _a.sent();
                    console.error('Error refreshing analytics:', err_2);
                    setError('Failed to refresh analytics data. Please try again.');
                    return [3 /*break*/, 4];
                case 3:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Handle export
    var handleExport = function () {
        // In a real implementation, this would download the analytics data
        alert('Export functionality would be implemented here');
    };
    // Generate daily completion data for the chart
    var generateDailyCompletionData = function () {
        var today = new Date();
        var data = [];
        for (var i = 29; i >= 0; i--) {
            var date = new Date();
            date.setDate(today.getDate() - i);
            // Generate random data for demonstration
            var completions = Math.floor(Math.random() * 10) + 1;
            var starts = completions + Math.floor(Math.random() * 5);
            data.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                completions: completions,
                starts: starts
            });
        }
        return data;
    };
    // Generate step completion data for the chart
    var generateStepCompletionData = function () {
        var steps = [
            'Welcome',
            'Profile',
            'AI Preferences',
            'Workspace',
            'Tools',
            'Greeter',
            'Completion'
        ];
        return steps.map(function (step) { return ({
            name: step,
            completion: Math.floor(Math.random() * 40) + 60, // 60-100%
            dropoff: Math.floor(Math.random() * 10) // 0-10%
        }); });
    };
    // Generate user type data for the pie chart
    var generateUserTypeData = function () {
        if (analytics && analytics.userTypeDistribution) {
            return analytics.userTypeDistribution;
        }
        // Fallback to mock data
        return [
            { type: 'human', count: 156 },
            { type: 'ai_agent', count: 42 }
        ];
    };
    // Daily completion data
    var dailyCompletionData = generateDailyCompletionData();
    // Step completion data
    var stepCompletionData = generateStepCompletionData();
    // User type data
    var userTypeData = generateUserTypeData();
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Onboarding Analytics" }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("select", { value: dateRange, onChange: function (e) { return setDateRange(e.target.value); }, className: "px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500", "aria-label": "Select date range", children: [_jsx("option", { value: "last7days", children: "Last 7 Days" }), _jsx("option", { value: "last30days", children: "Last 30 Days" }), _jsx("option", { value: "last90days", children: "Last 90 Days" }), _jsx("option", { value: "thisYear", children: "This Year" }), _jsx("option", { value: "allTime", children: "All Time" })] }), _jsxs("select", { value: comparisonPeriod, onChange: function (e) { return setComparisonPeriod(e.target.value); }, className: "px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500", "aria-label": "Select comparison period", children: [_jsx("option", { value: "previous", children: "vs. Previous Period" }), _jsx("option", { value: "lastYear", children: "vs. Last Year" }), _jsx("option", { value: "none", children: "No Comparison" })] }), _jsx("div", { className: "relative group", children: _jsx("button", { onClick: handleRefresh, disabled: isLoading, className: "p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50", title: "Refresh data", children: _jsx(RefreshCw, { className: "w-4 h-4 ".concat(isLoading ? 'animate-spin' : '') }) }) }), _jsxs("div", { className: "relative group", children: [_jsx("button", { className: "p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors", children: _jsx(MoreVertical, { className: "w-4 h-4" }) }), _jsxs("div", { className: "absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10", children: [_jsxs("button", { onClick: handleExport, className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors", children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), "Export Data"] }), _jsxs("button", { className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), "Custom Date Range"] }), _jsxs("button", { className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors", children: [_jsx(BarChart2, { className: "w-4 h-4 mr-2" }), "Advanced Analytics"] })] })] })] })] }), isLoading && (_jsxs("div", { className: "text-center py-10", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Loading analytics data..." })] })), error && !isLoading && (_jsx("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4", children: _jsxs("div", { className: "flex items-start", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-sm font-medium text-red-800 dark:text-red-200", children: "Error Loading Analytics" }), _jsx("p", { className: "text-sm text-red-700 dark:text-red-300 mt-1", children: error })] }), _jsx("button", { onClick: handleRefresh, className: "ml-3 px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors", children: "Retry" })] }) })), !isLoading && !error && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6", children: _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: "Completion Rate" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: analytics ? "".concat((analytics.completionRate * 100).toFixed(1), "%") : '78.0%' }), _jsxs("p", { className: "text-sm text-green-600 dark:text-green-400 flex items-center mt-1", children: [_jsx(TrendingUp, { className: "w-3 h-3 mr-1" }), "5.2% vs. previous period"] })] }) }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6", children: _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: "Avg. Time to Complete" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: analytics ? "".concat(Math.floor(analytics.averageTimeSpent / 60), "m ").concat(analytics.averageTimeSpent % 60, "s") : '4m 0s' }), _jsxs("p", { className: "text-sm text-green-600 dark:text-green-400 flex items-center mt-1", children: [_jsx(TrendingUp, { className: "w-3 h-3 mr-1 rotate-180" }), "30s vs. previous period"] })] }) }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6", children: _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: "Total Onboardings" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: analytics ? analytics.totalOnboardings : 198 }), _jsxs("p", { className: "text-sm text-green-600 dark:text-green-400 flex items-center mt-1", children: [_jsx(TrendingUp, { className: "w-3 h-3 mr-1" }), "12.5% vs. previous period"] })] }) }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6", children: _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: "Completed Onboardings" }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: analytics ? analytics.completedOnboardings : 154 }), _jsxs("p", { className: "text-sm text-green-600 dark:text-green-400 flex items-center mt-1", children: [_jsx(TrendingUp, { className: "w-3 h-3 mr-1" }), "18.3% vs. previous period"] })] }) }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg", children: [_jsx("div", { className: "p-6 pb-0", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Daily Onboarding Activity" }) }), _jsx("div", { className: "p-6", children: _jsx("div", { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: dailyCompletionData, margin: { top: 5, right: 30, left: 20, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(RechartsTooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "starts", stroke: "#3182CE", name: "Started", activeDot: { r: 8 } }), _jsx(Line, { type: "monotone", dataKey: "completions", stroke: "#4FD1C5", name: "Completed" })] }) }) }) })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg", children: [_jsx("div", { className: "p-6 pb-0", children: _jsx(Heading, { size: "sm", children: "User Type Distribution" }) }), _jsx("div", { className: "p-6", children: _jsx("div", { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: userTypeData, cx: "50%", cy: "50%", labelLine: false, outerRadius: 100, fill: "#8884d8", dataKey: "count", nameKey: "type", label: function (_a) {
                                                                var type = _a.type, count = _a.count, percent = _a.percent;
                                                                return "".concat(type, ": ").concat((percent * 100).toFixed(0), "%");
                                                            }, children: userTypeData.map(function (entry, index) { return (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, "cell-".concat(index))); }) }), _jsx(RechartsTooltip, {}), _jsx(Legend, {})] }) }) }) })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg", children: [_jsx("div", { className: "p-6 pb-0", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Step Completion Rates" }) }), _jsx("div", { className: "p-6", children: _jsx("div", { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: stepCompletionData, margin: { top: 5, right: 30, left: 20, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(RechartsTooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "completion", name: "Completion Rate", fill: "#3182CE" }), _jsx(Bar, { dataKey: "dropoff", name: "Drop-off Rate", fill: "#F56565" })] }) }) }) })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg", children: [_jsx("div", { className: "p-6 pb-0", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Drop-off Points" }) }), _jsx("div", { className: "p-6", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200 dark:divide-gray-700", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-gray-800", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Step" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Drop-off Rate" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Users" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Trend" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Action" })] }) }), _jsx("tbody", { className: "bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700", children: analytics && analytics.dropOffPoints ? (analytics.dropOffPoints.map(function (point, index) { return (_jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white", children: point.step }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: [(point.rate * 100).toFixed(1), "%"] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: Math.round(point.rate * (analytics.totalOnboardings || 198)) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: _jsxs("span", { className: "flex items-center ".concat(index % 2 === 0 ? 'text-green-600' : 'text-red-600'), children: [_jsx(TrendingUp, { className: "w-3 h-3 mr-1 ".concat(index % 2 === 0 ? '' : 'rotate-180') }), (Math.random() * 5).toFixed(1), "%"] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: _jsx("button", { className: "px-3 py-1 text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors", "aria-label": "Analyze drop-off point", title: "Analyze drop-off point", children: "Analyze" }) })] }, index)); })) : (_jsxs(_Fragment, { children: [_jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white", children: "Profile" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: "12.0%" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: "24" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: _jsxs("span", { className: "flex items-center text-green-600", children: [_jsx(TrendingUp, { className: "w-3 h-3 mr-1" }), "2.3%"] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: _jsx("button", { className: "px-3 py-1 text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors", "aria-label": "Analyze Profile step drop-off", title: "Analyze Profile step drop-off", children: "Analyze" }) })] }), _jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white", children: "AI Preferences" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: "8.0%" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: "16" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: _jsxs("span", { className: "flex items-center text-red-600", children: [_jsx(TrendingUp, { className: "w-3 h-3 mr-1 rotate-180" }), "1.5%"] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: _jsx("button", { className: "px-3 py-1 text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors", "aria-label": "Analyze AI Preferences step drop-off", title: "Analyze AI Preferences step drop-off", children: "Analyze" }) })] }), _jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white", children: "Workspace" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: "2.0%" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: "4" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: _jsxs("span", { className: "flex items-center text-green-600", children: [_jsx(TrendingUp, { className: "w-3 h-3 mr-1" }), "0.5%"] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400", children: _jsx("button", { className: "px-3 py-1 text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors", "aria-label": "Analyze Workspace step drop-off", title: "Analyze Workspace step drop-off", children: "Analyze" }) })] })] })) })] }) }) })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg", children: [_jsx("div", { className: "p-6 pb-0", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Recommendations" }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: "text-blue-500 mt-1", children: _jsx(AlertCircle, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: "Simplify the Profile step" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "This step has the highest drop-off rate. Consider reducing the number of required fields." })] })] }), _jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: "text-blue-500 mt-1", children: _jsx(Users, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: "Optimize for AI Agents" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "AI Agents have a lower completion rate. Consider creating a more streamlined flow for them." })] })] }), _jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: "text-blue-500 mt-1", children: _jsx(Clock, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: "Reduce time spent on AI Preferences" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Users spend an average of 90 seconds on this step, which is higher than other steps." })] })] })] }) })] })] }))] }));
};
