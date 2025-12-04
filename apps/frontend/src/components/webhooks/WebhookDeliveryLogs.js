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
var _a, _b;
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@the-new-fuse/ui-consolidated';
import { Button } from '@the-new-fuse/ui-consolidated';
import { Badge } from '@the-new-fuse/ui-consolidated';
import { Input } from '@the-new-fuse/ui-consolidated';
import { Select } from '@the-new-fuse/ui-consolidated';
import { Search, RefreshCw, Download, Eye, AlertTriangle, CheckCircle, XCircle, Clock, RotateCcw, ExternalLink, Filter, } from 'lucide-react';
import { DeliveryStatus, IntegrationSource } from '@the-new-fuse/types';
import { useWebhookManagement } from './hooks/useWebhookManagement';
var STATUS_COLORS = (_a = {},
    _a[DeliveryStatus.PENDING] = 'bg-yellow-100 text-yellow-800',
    _a[DeliveryStatus.DELIVERED] = 'bg-green-100 text-green-800',
    _a[DeliveryStatus.FAILED] = 'bg-red-100 text-red-800',
    _a[DeliveryStatus.RETRYING] = 'bg-blue-100 text-blue-800',
    _a[DeliveryStatus.ABANDONED] = 'bg-gray-100 text-gray-800',
    _a);
var STATUS_ICONS = (_b = {},
    _b[DeliveryStatus.PENDING] = _jsx(Clock, { className: "w-4 h-4" }),
    _b[DeliveryStatus.DELIVERED] = _jsx(CheckCircle, { className: "w-4 h-4" }),
    _b[DeliveryStatus.FAILED] = _jsx(XCircle, { className: "w-4 h-4" }),
    _b[DeliveryStatus.RETRYING] = _jsx(RotateCcw, { className: "w-4 h-4" }),
    _b[DeliveryStatus.ABANDONED] = _jsx(AlertTriangle, { className: "w-4 h-4" }),
    _b);
export function WebhookDeliveryLogs(_a) {
    var _this = this;
    var webhookConfigId = _a.webhookConfigId, className = _a.className;
    var _b = useState(''), searchTerm = _b[0], setSearchTerm = _b[1];
    var _c = useState('all'), selectedStatus = _c[0], setSelectedStatus = _c[1];
    var _d = useState('all'), selectedSource = _d[0], setSelectedSource = _d[1];
    var _e = useState(null), selectedLog = _e[0], setSelectedLog = _e[1];
    var _f = useState(false), showDetails = _f[0], setShowDetails = _f[1];
    var _g = useWebhookManagement(), getDeliveryLogs = _g.getDeliveryLogs, retryDelivery = _g.retryDelivery, loading = _g.loading;
    var _h = useState([]), logs = _h[0], setLogs = _h[1];
    var handleRetry = function (logId) { return __awaiter(_this, void 0, void 0, function () {
        var fetchedLogs, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, retryDelivery(logId)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, getDeliveryLogs(webhookConfigId)];
                case 2:
                    fetchedLogs = _a.sent();
                    setLogs(fetchedLogs);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Failed to retry delivery:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Fetch logs when component mounts or webhookConfigId changes
    React.useEffect(function () {
        var fetchLogs = function () { return __awaiter(_this, void 0, void 0, function () {
            var fetchedLogs, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, getDeliveryLogs(webhookConfigId)];
                    case 1:
                        fetchedLogs = _a.sent();
                        setLogs(fetchedLogs);
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Failed to fetch delivery logs:', error_2);
                        // Fallback to empty array if fetch fails
                        setLogs([]);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        fetchLogs();
    }, [getDeliveryLogs, webhookConfigId]);
    // Fallback mock data if logs array is empty
    React.useEffect(function () {
        if (logs.length === 0) {
            setLogs([
                {
                    id: '1',
                    webhook_config_id: 'config-1',
                    event_id: 'event-1',
                    delivery_url: 'https://api.example.com/webhooks',
                    http_status: 200,
                    status: DeliveryStatus.DELIVERED,
                    attempt_number: 1,
                    response_time_ms: 245,
                    request_headers: { 'Content-Type': 'application/json' },
                    request_body: { event: 'payment.completed', amount: 1000 },
                    response_headers: { 'Status': '200 OK' },
                    response_body: { received: true },
                    created_at: new Date().toISOString(),
                    source: IntegrationSource.STRIPE,
                    event_type: 'payment.completed',
                },
                // Add more mock logs if needed
            ]);
        }
    }, [logs.length]);
    var filteredLogs = useMemo(function () {
        var filtered = logs;
        if (webhookConfigId) {
            filtered = filtered.filter(function (log) { return log.webhook_config_id === webhookConfigId; });
        }
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(function (log) { return log.status === selectedStatus; });
        }
        if (selectedSource !== 'all') {
            filtered = filtered.filter(function (log) { return log.source === selectedSource; });
        }
        return filtered.sort(function (a, b) { return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); });
    }, [logs, webhookConfigId, searchTerm, selectedStatus, selectedSource]);
    // handleRetry is already defined inside the useMemo callback
    var handleExportLogs = function () {
        var dataStr = JSON.stringify(filteredLogs, null, 2);
        var dataBlob = new Blob([dataStr], { type: 'application/json' });
        var url = URL.createObjectURL(dataBlob);
        var link = document.createElement('a');
        link.href = url;
        link.download = "webhook-delivery-logs-".concat(new Date().toISOString().split('T')[0], ".json");
        link.click();
        URL.revokeObjectURL(url);
    };
    var formatDate = function (dateString) {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
        });
    };
    var getHttpStatusColor = function (status) {
        if (status >= 200 && status < 300)
            return 'text-green-600';
        if (status >= 300 && status < 400)
            return 'text-blue-600';
        if (status >= 400 && status < 500)
            return 'text-orange-600';
        if (status >= 500)
            return 'text-red-600';
        return 'text-gray-600';
    };
    return (_jsxs("div", { className: "space-y-6 ".concat(className), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Delivery Logs" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: function () { return window.location.reload(); }, children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-1" }), "Refresh"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleExportLogs, disabled: filteredLogs.length === 0, children: [_jsx(Download, { className: "w-4 h-4 mr-1" }), "Export"] })] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { placeholder: "Search logs...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "pl-10" })] }), _jsxs(Select, { value: selectedStatus, onValueChange: function (value) { return setSelectedStatus(value); }, children: [_jsx("option", { value: "all", children: "All Statuses" }), Object.values(DeliveryStatus).map(function (status) { return (_jsx("option", { value: status, children: getStatusText(status) }, status)); })] }), _jsxs(Select, { value: selectedSource, onValueChange: function (value) { return setSelectedSource(value); }, children: [_jsx("option", { value: "all", children: "All Sources" }), Object.values(IntegrationSource).map(function (source) { return (_jsx("option", { value: source, children: source }, source)); })] }), _jsxs("div", { className: "flex items-center text-sm text-muted-foreground", children: [_jsx(Filter, { className: "w-4 h-4 mr-1" }), filteredLogs.length, " logs"] })] }) }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Delivery History" }) }), _jsx(CardContent, { className: "p-0", children: filteredLogs.length === 0 ? (_jsxs("div", { className: "p-8 text-center text-muted-foreground", children: [_jsx(Clock, { className: "w-8 h-8 mx-auto mb-2" }), _jsx("p", { children: "No delivery logs found" }), _jsx("p", { className: "text-sm", children: "Logs will appear here as webhooks are delivered" })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 border-b", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Event" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Response" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Timing" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Attempts" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredLogs.map(function (log) { return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: log.event_type }), _jsx("div", { className: "text-sm text-gray-500", children: log.source })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs(Badge, { className: STATUS_COLORS[log.status], children: [STATUS_ICONS[log.status], _jsx("span", { className: "ml-1", children: getStatusText(log.status) })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium ".concat(getHttpStatusColor(log.http_status)), children: log.http_status }), log.error_message && (_jsx("div", { className: "text-sm text-red-600 truncate max-w-xs", children: log.error_message }))] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { children: [_jsxs("div", { className: "text-sm text-gray-900", children: [log.response_time_ms, "ms"] }), _jsx("div", { className: "text-sm text-gray-500", children: formatDate(log.created_at) })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "text-sm text-gray-900", children: [log.attempt_number, log.next_retry_at && (_jsxs("div", { className: "text-xs text-gray-500", children: ["Next: ", formatDate(log.next_retry_at)] }))] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: function () {
                                                                    setSelectedLog(log);
                                                                    setShowDetails(true);
                                                                }, children: _jsx(Eye, { className: "w-4 h-4" }) }), log.status === DeliveryStatus.FAILED && (_jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return handleRetry(log.id); }, disabled: loading, children: _jsx(RotateCcw, { className: "w-4 h-4" }) })), _jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return window.open(log.delivery_url, '_blank'); }, children: _jsx(ExternalLink, { className: "w-4 h-4" }) })] }) })] }, log.id)); }) })] }) })) })] }), showDetails && selectedLog && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsx("div", { className: "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto", children: _jsxs(Card, { className: "border-0", children: [_jsx(CardHeader, { className: "border-b", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "Delivery Log Details" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return setShowDetails(false); }, children: "\u2715" })] }) }), _jsxs(CardContent, { className: "p-6 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium mb-2", children: "Event Information" }), _jsxs("div", { className: "space-y-1 text-sm", children: [_jsxs("div", { children: ["Event Type: ", _jsx("span", { className: "font-medium", children: selectedLog.event_type })] }), _jsxs("div", { children: ["Source: ", _jsx("span", { className: "font-medium", children: selectedLog.source })] }), _jsxs("div", { children: ["Event ID: ", _jsx("span", { className: "font-mono text-xs", children: selectedLog.event_id })] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium mb-2", children: "Delivery Information" }), _jsxs("div", { className: "space-y-1 text-sm", children: [_jsxs("div", { children: ["Status: ", _jsx(Badge, { className: STATUS_COLORS[selectedLog.status], children: getStatusText(selectedLog.status) })] }), _jsxs("div", { children: ["HTTP Status: ", _jsx("span", { className: "font-medium ".concat(getHttpStatusColor(selectedLog.http_status)), children: selectedLog.http_status })] }), _jsxs("div", { children: ["Response Time: ", _jsxs("span", { className: "font-medium", children: [selectedLog.response_time_ms, "ms"] })] }), _jsxs("div", { children: ["Attempt: ", _jsx("span", { className: "font-medium", children: selectedLog.attempt_number })] })] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium mb-2", children: "Request" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: "URL:" }), _jsx("div", { className: "text-sm font-mono bg-gray-100 p-2 rounded", children: selectedLog.delivery_url })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: "Headers:" }), _jsx("pre", { className: "text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto", children: JSON.stringify(selectedLog.request_headers, null, 2) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: "Body:" }), _jsx("pre", { className: "text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto max-h-32", children: JSON.stringify(selectedLog.request_body, null, 2) })] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium mb-2", children: "Response" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: "Headers:" }), _jsx("pre", { className: "text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto", children: JSON.stringify(selectedLog.response_headers, null, 2) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: "Body:" }), _jsx("pre", { className: "text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto max-h-32", children: JSON.stringify(selectedLog.response_body, null, 2) })] })] })] }), selectedLog.error_message && (_jsxs("div", { children: [_jsx("h4", { className: "font-medium mb-2 text-red-600", children: "Error" }), _jsx("div", { className: "text-sm bg-red-50 border border-red-200 rounded p-3", children: selectedLog.error_message })] }))] })] }) }) }))] }));
}
