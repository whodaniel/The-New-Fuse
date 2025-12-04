var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a, _b;
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@the-new-fuse/ui-consolidated';
import { Button } from '@the-new-fuse/ui-consolidated';
import { Badge } from '@the-new-fuse/ui-consolidated';
import { Settings, Play, Pause, TestTube, Trash2, ExternalLink, CheckCircle, XCircle, AlertTriangle, MoreVertical, } from 'lucide-react';
import { IntegrationSource } from '@the-new-fuse/types';
import { useWebhookManagement } from './hooks/useWebhookManagement';
var INTEGRATION_ICONS = (_a = {},
    _a[IntegrationSource.STRIPE] = '💳',
    _a[IntegrationSource.PAYPAL] = '🅿️',
    _a[IntegrationSource.SALESFORCE] = '☁️',
    _a[IntegrationSource.HUBSPOT] = '🟠',
    _a[IntegrationSource.PIPEDRIVE] = '🔵',
    _a[IntegrationSource.SQUARE] = '⬜',
    _a[IntegrationSource.NETSUITE] = '🌐',
    _a[IntegrationSource.SAP] = '🔷',
    _a[IntegrationSource.QUICKBOOKS] = '📊',
    _a[IntegrationSource.ZAPIER] = '⚡',
    _a[IntegrationSource.WORKATO] = '🔧',
    _a[IntegrationSource.POWER_AUTOMATE] = '🔄',
    _a);
var INTEGRATION_LABELS = (_b = {},
    _b[IntegrationSource.STRIPE] = 'Stripe',
    _b[IntegrationSource.PAYPAL] = 'PayPal',
    _b[IntegrationSource.SALESFORCE] = 'Salesforce',
    _b[IntegrationSource.HUBSPOT] = 'HubSpot',
    _b[IntegrationSource.PIPEDRIVE] = 'Pipedrive',
    _b[IntegrationSource.SQUARE] = 'Square',
    _b[IntegrationSource.NETSUITE] = 'NetSuite',
    _b[IntegrationSource.SAP] = 'SAP',
    _b[IntegrationSource.QUICKBOOKS] = 'QuickBooks',
    _b[IntegrationSource.ZAPIER] = 'Zapier',
    _b[IntegrationSource.WORKATO] = 'Workato',
    _b[IntegrationSource.POWER_AUTOMATE] = 'Power Automate',
    _b);
export function IntegrationStatusGrid(_a) {
    var _this = this;
    var configurations = _a.configurations, _b = _a.loading, loading = _b === void 0 ? false : _b, _c = _a.showActions, showActions = _c === void 0 ? false : _c, _d = _a.showDetails, showDetails = _d === void 0 ? false : _d, onEdit = _a.onEdit, className = _a.className;
    var _e = useWebhookManagement(), deleteWebhook = _e.deleteWebhook, updateWebhook = _e.updateWebhook, testWebhook = _e.testWebhook;
    var _f = useState({}), actionLoading = _f[0], setActionLoading = _f[1];
    var getStatusColor = function (isActive, lastDeliverySuccess) {
        if (!isActive)
            return 'bg-gray-100 text-gray-800';
        if (lastDeliverySuccess === false)
            return 'bg-red-100 text-red-800';
        if (lastDeliverySuccess === true)
            return 'bg-green-100 text-green-800';
        return 'bg-yellow-100 text-yellow-800';
    };
    var getStatusIcon = function (isActive, lastDeliverySuccess) {
        if (!isActive)
            return _jsx(Pause, { className: "w-4 h-4" });
        if (lastDeliverySuccess === false)
            return _jsx(XCircle, { className: "w-4 h-4" });
        if (lastDeliverySuccess === true)
            return _jsx(CheckCircle, { className: "w-4 h-4" });
        return _jsx(AlertTriangle, { className: "w-4 h-4" });
    };
    var getStatusText = function (isActive, lastDeliverySuccess) {
        if (!isActive)
            return 'Inactive';
        if (lastDeliverySuccess === false)
            return 'Error';
        if (lastDeliverySuccess === true)
            return 'Active';
        return 'Warning';
    };
    var handleAction = function (configId, action) { return __awaiter(_this, void 0, void 0, function () {
        var _a, config, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setActionLoading(function (prev) {
                        var _a;
                        return (__assign(__assign({}, prev), (_a = {}, _a[configId] = true, _a)));
                    });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 11, 12, 13]);
                    _a = action;
                    switch (_a) {
                        case 'toggle': return [3 /*break*/, 2];
                        case 'test': return [3 /*break*/, 5];
                        case 'delete': return [3 /*break*/, 7];
                    }
                    return [3 /*break*/, 10];
                case 2:
                    config = configurations.find(function (c) { return c.id === configId; });
                    if (!config) return [3 /*break*/, 4];
                    return [4 /*yield*/, updateWebhook(configId, { is_active: !config.is_active })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4: return [3 /*break*/, 10];
                case 5: return [4 /*yield*/, testWebhook(configId)];
                case 6:
                    _b.sent();
                    return [3 /*break*/, 10];
                case 7:
                    if (!window.confirm('Are you sure you want to delete this integration?')) return [3 /*break*/, 9];
                    return [4 /*yield*/, deleteWebhook(configId)];
                case 8:
                    _b.sent();
                    _b.label = 9;
                case 9: return [3 /*break*/, 10];
                case 10: return [3 /*break*/, 13];
                case 11:
                    error_1 = _b.sent();
                    console.error("Failed to ".concat(action, " webhook:"), error_1);
                    return [3 /*break*/, 13];
                case 12:
                    setActionLoading(function (prev) {
                        var _a;
                        return (__assign(__assign({}, prev), (_a = {}, _a[configId] = false, _a)));
                    });
                    return [7 /*endfinally*/];
                case 13: return [2 /*return*/];
            }
        });
    }); };
    var formatDate = function (dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    if (loading) {
        return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ".concat(className), children: __spreadArray([], Array(6), true).map(function (_, i) { return (_jsx(Card, { className: "animate-pulse", children: _jsxs(CardContent, { className: "p-6", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-3/4 mb-2" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-1/2 mb-4" }), _jsx("div", { className: "h-6 bg-gray-200 rounded w-1/4" })] }) }, i)); }) }));
    }
    if (configurations.length === 0) {
        return (_jsx(Card, { className: className, children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx("div", { className: "text-gray-400 text-4xl mb-4", children: "\uD83D\uDD17" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No Integrations" }), _jsx("p", { className: "text-gray-500 mb-4", children: "Get started by adding your first webhook integration" }), _jsx(Button, { children: "Add Integration" })] }) }));
    }
    return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ".concat(className), children: configurations.map(function (config) { return (_jsxs(Card, { className: "hover:shadow-md transition-shadow", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-2xl", children: INTEGRATION_ICONS[config.source] || '🔗' }), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: INTEGRATION_LABELS[config.source] || config.source }), _jsx("p", { className: "text-xs text-muted-foreground", children: config.endpoint_url ?
                                                    new URL(config.endpoint_url).hostname :
                                                    'No endpoint' })] })] }), showActions && (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", onClick: function () { return onEdit === null || onEdit === void 0 ? void 0 : onEdit(config); }, children: _jsx(Settings, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: _jsx(MoreVertical, { className: "h-4 w-4" }) })] }))] }) }), _jsx(CardContent, { className: "pt-0", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Badge, { className: getStatusColor(config.is_active, config.last_delivery_success), children: [getStatusIcon(config.is_active, config.last_delivery_success), _jsx("span", { className: "ml-1", children: getStatusText(config.is_active, config.last_delivery_success) })] }), config.endpoint_url && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0", onClick: function () { return window.open(config.endpoint_url, '_blank'); }, children: _jsx(ExternalLink, { className: "h-3 w-3" }) }))] }), showDetails && (_jsxs("div", { className: "space-y-2 text-xs text-muted-foreground", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "Events delivered:" }), _jsx("span", { className: "font-medium", children: config.events_delivered || 0 })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "Success rate:" }), _jsxs("span", { className: "font-medium ".concat((config.success_rate || 0) > 95 ? 'text-green-600' :
                                                    (config.success_rate || 0) > 80 ? 'text-yellow-600' : 'text-red-600'), children: [((config.success_rate || 0) * 100).toFixed(1), "%"] })] }), config.last_delivery_at && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "Last delivery:" }), _jsx("span", { className: "font-medium", children: formatDate(config.last_delivery_at) })] })), config.created_at && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "Created:" }), _jsx("span", { className: "font-medium", children: formatDate(config.created_at) })] }))] })), showActions && (_jsxs("div", { className: "flex items-center space-x-2 pt-2 border-t", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: function () { return handleAction(config.id, 'toggle'); }, disabled: actionLoading[config.id], className: "flex-1", children: config.is_active ? (_jsxs(_Fragment, { children: [_jsx(Pause, { className: "w-3 h-3 mr-1" }), "Pause"] })) : (_jsxs(_Fragment, { children: [_jsx(Play, { className: "w-3 h-3 mr-1" }), "Activate"] })) }), _jsx(Button, { variant: "outline", size: "sm", onClick: function () { return handleAction(config.id, 'test'); }, disabled: actionLoading[config.id] || !config.is_active, children: _jsx(TestTube, { className: "w-3 h-3" }) }), _jsx(Button, { variant: "outline", size: "sm", onClick: function () { return handleAction(config.id, 'delete'); }, disabled: actionLoading[config.id], className: "text-red-600 hover:text-red-700", children: _jsx(Trash2, { className: "w-3 h-3" }) })] }))] }) })] }, config.id)); }) }));
}
