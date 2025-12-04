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
import { FileText, Search, Download, RefreshCw, User, Shield, Activity, AlertCircle, CheckCircle, XCircle, Eye, } from 'lucide-react';
export default function AuditLogViewer() {
    var _this = this;
    var _a = useState([]), logs = _a[0], setLogs = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(''), searchTerm = _c[0], setSearchTerm = _c[1];
    var _d = useState('all'), selectedType = _d[0], setSelectedType = _d[1];
    var _e = useState('all'), selectedStatus = _e[0], setSelectedStatus = _e[1];
    var _f = useState('today'), dateRange = _f[0], setDateRange = _f[1];
    var _g = useState(null), selectedLog = _g[0], setSelectedLog = _g[1];
    useEffect(function () {
        loadLogs();
    }, [dateRange, selectedType, selectedStatus]);
    var loadLogs = function () { return __awaiter(_this, void 0, void 0, function () {
        var mockLogs, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    _a.sent();
                    mockLogs = [
                        {
                            id: '1',
                            timestamp: new Date(),
                            type: 'security',
                            action: 'Failed login attempt',
                            user: 'unknown@example.com',
                            ipAddress: '192.168.1.100',
                            resource: '/api/auth/login',
                            status: 'warning',
                            details: 'Invalid credentials provided',
                        },
                        {
                            id: '2',
                            timestamp: new Date(Date.now() - 5 * 60000),
                            type: 'admin',
                            action: 'User role updated',
                            user: 'admin@example.com',
                            ipAddress: '192.168.1.50',
                            resource: '/api/admin/users/123',
                            status: 'success',
                            details: 'Changed user role from user to moderator',
                        },
                        {
                            id: '3',
                            timestamp: new Date(Date.now() - 10 * 60000),
                            type: 'user',
                            action: 'Password changed',
                            user: 'john@example.com',
                            ipAddress: '192.168.1.75',
                            resource: '/api/users/profile',
                            status: 'success',
                            details: 'User successfully changed password',
                        },
                        {
                            id: '4',
                            timestamp: new Date(Date.now() - 15 * 60000),
                            type: 'system',
                            action: 'Database backup completed',
                            user: 'system',
                            ipAddress: '127.0.0.1',
                            resource: '/backup/daily',
                            status: 'success',
                            details: 'Automated daily backup completed successfully',
                        },
                        {
                            id: '5',
                            timestamp: new Date(Date.now() - 30 * 60000),
                            type: 'security',
                            action: 'API rate limit exceeded',
                            user: 'api-user@example.com',
                            ipAddress: '203.0.113.42',
                            resource: '/api/chat/messages',
                            status: 'error',
                            details: 'Rate limit exceeded: 1000 requests in 1 hour',
                        },
                    ];
                    setLogs(mockLogs);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error loading logs:', error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var filteredLogs = logs.filter(function (log) {
        var matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.resource.toLowerCase().includes(searchTerm.toLowerCase());
        var matchesType = selectedType === 'all' || log.type === selectedType;
        var matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
        return matchesSearch && matchesType && matchesStatus;
    });
    var getTypeBadge = function (type) {
        var badges = {
            user: { bg: 'bg-blue-100', text: 'text-blue-800', icon: User },
            system: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Activity },
            security: { bg: 'bg-red-100', text: 'text-red-800', icon: Shield },
            admin: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Shield },
        };
        return badges[type];
    };
    var getStatusIcon = function (status) {
        var icons = {
            success: _jsx(CheckCircle, { className: "h-5 w-5 text-green-500" }),
            warning: _jsx(AlertCircle, { className: "h-5 w-5 text-yellow-500" }),
            error: _jsx(XCircle, { className: "h-5 w-5 text-red-500" }),
        };
        return icons[status];
    };
    var formatTimestamp = function (date) {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };
    return (_jsxs("div", { className: "p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2 flex items-center", children: [_jsx(FileText, { className: "h-8 w-8 mr-3 text-blue-600" }), "Audit Log Viewer"] }), _jsx("p", { className: "text-gray-600", children: "Track and monitor system activity and user actions" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { onClick: loadLogs, className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 ".concat(loading ? 'animate-spin' : '') }), "Refresh"] }), _jsxs("button", { className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center", children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), "Export Logs"] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Total Events" }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: logs.length })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Security Events" }), _jsx("div", { className: "text-3xl font-bold text-red-600", children: logs.filter(function (l) { return l.type === 'security'; }).length })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Admin Actions" }), _jsx("div", { className: "text-3xl font-bold text-purple-600", children: logs.filter(function (l) { return l.type === 'admin'; }).length })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Errors" }), _jsx("div", { className: "text-3xl font-bold text-red-600", children: logs.filter(function (l) { return l.status === 'error'; }).length })] })] }), _jsx("div", { className: "bg-white rounded-lg shadow p-6 mb-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx("div", { className: "md:col-span-2", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search logs...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }) }), _jsx("div", { children: _jsxs("select", { value: selectedType, onChange: function (e) { return setSelectedType(e.target.value); }, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Types" }), _jsx("option", { value: "user", children: "User" }), _jsx("option", { value: "system", children: "System" }), _jsx("option", { value: "security", children: "Security" }), _jsx("option", { value: "admin", children: "Admin" })] }) }), _jsx("div", { children: _jsxs("select", { value: dateRange, onChange: function (e) { return setDateRange(e.target.value); }, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "today", children: "Today" }), _jsx("option", { value: "week", children: "This Week" }), _jsx("option", { value: "month", children: "This Month" }), _jsx("option", { value: "all", children: "All Time" })] }) })] }) }), _jsxs("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Timestamp" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Type" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Action" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "User" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "IP Address" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Resource" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: loading ? (_jsx("tr", { children: _jsxs("td", { colSpan: 8, className: "px-6 py-12 text-center", children: [_jsx(RefreshCw, { className: "h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" }), _jsx("p", { className: "text-gray-600", children: "Loading logs..." })] }) })) : filteredLogs.length === 0 ? (_jsx("tr", { children: _jsxs("td", { colSpan: 8, className: "px-6 py-12 text-center", children: [_jsx(FileText, { className: "h-12 w-12 text-gray-400 mx-auto mb-2" }), _jsx("p", { className: "text-gray-600", children: "No logs found" })] }) })) : (filteredLogs.map(function (log) {
                                        var typeBadge = getTypeBadge(log.type);
                                        var TypeIcon = typeBadge.icon;
                                        return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: formatTimestamp(log.timestamp) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("span", { className: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(typeBadge.bg, " ").concat(typeBadge.text), children: [_jsx(TypeIcon, { className: "h-3 w-3 mr-1" }), log.type] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children: log.action }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: log.user }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono", children: log.ipAddress }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono", children: log.resource }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: getStatusIcon(log.status) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: _jsx("button", { onClick: function () { return setSelectedLog(log); }, className: "text-blue-600 hover:text-blue-900", children: _jsx(Eye, { className: "h-5 w-5" }) }) })] }, log.id));
                                    })) })] }) }), _jsxs("div", { className: "bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200", children: [_jsxs("div", { className: "text-sm text-gray-700", children: ["Showing ", filteredLogs.length, " of ", logs.length, " logs"] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { className: "px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm", children: "Previous" }), _jsx("button", { className: "px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm", children: "1" }), _jsx("button", { className: "px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm", children: "Next" })] })] })] }), selectedLog && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-8 max-w-2xl w-full mx-4", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Log Details" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: "Timestamp" }), _jsx("div", { className: "text-lg font-medium", children: selectedLog.timestamp.toLocaleString() })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: "Action" }), _jsx("div", { className: "text-lg font-medium", children: selectedLog.action })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: "User" }), _jsx("div", { className: "text-lg font-medium", children: selectedLog.user })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: "IP Address" }), _jsx("div", { className: "text-lg font-mono", children: selectedLog.ipAddress })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: "Resource" }), _jsx("div", { className: "text-lg font-mono", children: selectedLog.resource })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: "Details" }), _jsx("div", { className: "text-sm text-gray-900 bg-gray-50 p-4 rounded-lg", children: selectedLog.details })] })] }), _jsx("div", { className: "mt-6 flex justify-end", children: _jsx("button", { onClick: function () { return setSelectedLog(null); }, className: "px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700", children: "Close" }) })] }) }))] }));
}
