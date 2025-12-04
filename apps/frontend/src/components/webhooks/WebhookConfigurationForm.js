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
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@the-new-fuse/ui-consolidated';
import { Button } from '@the-new-fuse/ui-consolidated';
import { Input } from '@the-new-fuse/ui-consolidated';
import { Select } from '@the-new-fuse/ui-consolidated';
import { Textarea } from '@the-new-fuse/ui-consolidated';
import { Alert } from '@the-new-fuse/ui-consolidated';
import { Badge } from '@the-new-fuse/ui-consolidated';
import { Save, X, TestTube, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, } from 'lucide-react';
import { IntegrationSource } from '@the-new-fuse/types';
import { useWebhookManagement } from './hooks/useWebhookManagement';
var INTEGRATION_SOURCES = [
    { value: IntegrationSource.STRIPE, label: 'Stripe', description: 'Payment processing' },
    { value: IntegrationSource.PAYPAL, label: 'PayPal', description: 'Payment processing' },
    { value: IntegrationSource.SALESFORCE, label: 'Salesforce', description: 'CRM and sales' },
    { value: IntegrationSource.HUBSPOT, label: 'HubSpot', description: 'CRM and marketing' },
    { value: IntegrationSource.PIPEDRIVE, label: 'Pipedrive', description: 'Sales CRM' },
    { value: IntegrationSource.SQUARE, label: 'Square', description: 'Point of sale' },
    { value: IntegrationSource.NETSUITE, label: 'NetSuite', description: 'ERP system' },
    { value: IntegrationSource.SAP, label: 'SAP', description: 'Enterprise software' },
    { value: IntegrationSource.QUICKBOOKS, label: 'QuickBooks', description: 'Accounting' },
    { value: IntegrationSource.ZAPIER, label: 'Zapier', description: 'Automation platform' },
    { value: IntegrationSource.WORKATO, label: 'Workato', description: 'Integration platform' },
    { value: IntegrationSource.POWER_AUTOMATE, label: 'Power Automate', description: 'Microsoft automation' },
];
export function WebhookConfigurationForm(_a) {
    var _this = this;
    var onSuccess = _a.onSuccess, onCancel = _a.onCancel, editingWebhook = _a.editingWebhook, className = _a.className;
    var _b = useWebhookManagement(), registerWebhook = _b.registerWebhook, updateWebhook = _b.updateWebhook, testWebhook = _b.testWebhook, loading = _b.loading;
    var _c = useState({
        source: (editingWebhook === null || editingWebhook === void 0 ? void 0 : editingWebhook.source) || IntegrationSource.STRIPE,
        endpoint_url: (editingWebhook === null || editingWebhook === void 0 ? void 0 : editingWebhook.endpoint_url) || '',
        secret_key: (editingWebhook === null || editingWebhook === void 0 ? void 0 : editingWebhook.secret_key) || '',
        configuration: (editingWebhook === null || editingWebhook === void 0 ? void 0 : editingWebhook.configuration) || {},
    }), formData = _c[0], setFormData = _c[1];
    var _d = useState(false), showSecret = _d[0], setShowSecret = _d[1];
    var _e = useState(JSON.stringify((editingWebhook === null || editingWebhook === void 0 ? void 0 : editingWebhook.configuration) || {}, null, 2)), configJson = _e[0], setConfigJson = _e[1];
    var _f = useState(null), testResult = _f[0], setTestResult = _f[1];
    var _g = useState({}), errors = _g[0], setErrors = _g[1];
    var selectedSource = INTEGRATION_SOURCES.find(function (s) { return s.value === formData.source; });
    var validateForm = function () {
        var newErrors = {};
        if (!formData.endpoint_url.trim()) {
            newErrors.endpoint_url = 'Endpoint URL is required';
        }
        else if (!formData.endpoint_url.startsWith('https://')) {
            newErrors.endpoint_url = 'Endpoint URL must use HTTPS';
        }
        if (!formData.secret_key.trim()) {
            newErrors.secret_key = 'Secret key is required';
        }
        else if (formData.secret_key.length < 8) {
            newErrors.secret_key = 'Secret key must be at least 8 characters';
        }
        try {
            var config = JSON.parse(configJson);
            if (typeof config !== 'object' || config === null) {
                newErrors.configuration = 'Configuration must be a valid JSON object';
            }
        }
        catch (error) {
            console.error('JSON parsing error:', error);
            newErrors.configuration = 'Configuration must be valid JSON';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var configuration, requestData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!validateForm()) {
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    configuration = JSON.parse(configJson);
                    requestData = {
                        source: formData.source,
                        endpoint_url: formData.endpoint_url,
                        secret_key: formData.secret_key,
                        configuration: configuration,
                    };
                    if (!editingWebhook) return [3 /*break*/, 3];
                    return [4 /*yield*/, updateWebhook(editingWebhook.id, requestData)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, registerWebhook(requestData)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess();
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error('Failed to save webhook:', error_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var handleTest = function () { return __awaiter(_this, void 0, void 0, function () {
        var result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!editingWebhook) {
                        setTestResult({
                            success: false,
                            message: 'Save the webhook first to test it',
                        });
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, testWebhook(editingWebhook.id, {
                            test: true,
                            timestamp: new Date().toISOString(),
                        })];
                case 2:
                    result = _a.sent();
                    setTestResult({
                        success: result.success,
                        message: result.success
                            ? 'Webhook test successful!'
                            : result.error || 'Test failed',
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Test webhook error:', error_2);
                    setTestResult({
                        success: false,
                        message: 'Failed to test webhook',
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var generateWebhookUrl = function () {
        var baseUrl = process.env.REACT_APP_API_URL || 'https://api.example.com';
        return "".concat(baseUrl, "/webhooks/incoming/").concat(formData.source);
    };
    return (_jsxs(Card, { className: className, children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsxs("span", { children: [editingWebhook ? 'Edit' : 'Add', " Webhook Integration"] }), _jsxs("div", { className: "flex items-center space-x-2", children: [editingWebhook && (_jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: handleTest, disabled: loading, children: [_jsx(TestTube, { className: "w-4 h-4 mr-2" }), "Test"] })), _jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: onCancel, children: _jsx(X, { className: "w-4 h-4" }) })] })] }) }), _jsx(CardContent, { className: "space-y-6", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Integration Source" }), _jsx(Select, { value: formData.source, onValueChange: function (value) {
                                        return setFormData(__assign(__assign({}, formData), { source: value }));
                                    }, children: INTEGRATION_SOURCES.map(function (source) { return (_jsxs("option", { value: source.value, children: [source.label, " - ", source.description] }, source.value)); }) }), selectedSource && (_jsxs("p", { className: "text-xs text-muted-foreground", children: ["Configure webhooks for ", selectedSource.label, " integration"] }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Webhook URL" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { value: generateWebhookUrl(), readOnly: true, className: "bg-gray-50 pr-16" }), _jsx(Badge, { className: "absolute right-2 top-2 text-xs", children: "Auto-generated" })] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Use this URL in your ", selectedSource === null || selectedSource === void 0 ? void 0 : selectedSource.label, " webhook configuration"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Your Endpoint URL" }), _jsx(Input, { placeholder: "https://your-app.com/webhook-handler", value: formData.endpoint_url, onChange: function (e) {
                                        return setFormData(__assign(__assign({}, formData), { endpoint_url: e.target.value }));
                                    }, className: errors.endpoint_url ? 'border-red-500' : '' }), errors.endpoint_url && (_jsx("p", { className: "text-xs text-red-600", children: errors.endpoint_url })), _jsx("p", { className: "text-xs text-muted-foreground", children: "Where we'll forward the webhook events" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Secret Key" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { type: showSecret ? 'text' : 'password', placeholder: "Enter a secure secret key", value: formData.secret_key, onChange: function (e) {
                                                return setFormData(__assign(__assign({}, formData), { secret_key: e.target.value }));
                                            }, className: errors.secret_key ? 'border-red-500' : '' }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "absolute right-2 top-1 h-8 w-8 p-0", onClick: function () { return setShowSecret(!showSecret); }, children: showSecret ? (_jsx(EyeOff, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4" })) })] }), errors.secret_key && (_jsx("p", { className: "text-xs text-red-600", children: errors.secret_key })), _jsx("p", { className: "text-xs text-muted-foreground", children: "Used to verify webhook authenticity" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Configuration (JSON)" }), _jsx(Textarea, { placeholder: '{"timeout": 30, "retries": 3}', value: configJson, onChange: function (e) { return setConfigJson(e.target.value); }, rows: 6, className: "font-mono text-sm ".concat(errors.configuration ? 'border-red-500' : '') }), errors.configuration && (_jsx("p", { className: "text-xs text-red-600", children: errors.configuration })), _jsx("p", { className: "text-xs text-muted-foreground", children: "Additional configuration options (optional)" })] }), testResult && (_jsx(Alert, { className: testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50', children: _jsxs("div", { className: "flex items-center", children: [testResult.success ? (_jsx(CheckCircle, { className: "h-4 w-4 text-green-600 mr-2" })) : (_jsx(AlertCircle, { className: "h-4 w-4 text-red-600 mr-2" })), _jsx("span", { className: testResult.success ? 'text-green-800' : 'text-red-800', children: testResult.message })] }) })), _jsxs("div", { className: "flex items-center justify-end space-x-3 pt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onCancel, disabled: loading, children: "Cancel" }), _jsxs(Button, { type: "submit", disabled: loading, className: "bg-blue-600 hover:bg-blue-700", children: [loading ? (_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" })) : (_jsx(Save, { className: "w-4 h-4 mr-2" })), editingWebhook ? 'Update' : 'Create', " Webhook"] })] })] }) })] }));
}
