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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Palette, Database, Clock, Users, BarChart3, Save, RefreshCw } from 'lucide-react';
var DashboardSettings = function () {
    var _a = useState({
        refreshInterval: '30',
        autoRefresh: true,
        showNotifications: true,
        darkMode: false,
        compactView: false,
        showMetrics: true,
        maxDataPoints: '100',
        retentionDays: '30',
        enableAlerts: true,
        alertThreshold: '80'
    }), settings = _a[0], setSettings = _a[1];
    var _b = useState(false), isLoading = _b[0], setIsLoading = _b[1];
    var handleSave = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    // Simulate API call
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    // Simulate API call
                    _a.sent();
                    console.log('Dashboard settings saved:', settings);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Failed to save settings:', error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleReset = function () {
        setSettings({
            refreshInterval: '30',
            autoRefresh: true,
            showNotifications: true,
            darkMode: false,
            compactView: false,
            showMetrics: true,
            maxDataPoints: '100',
            retentionDays: '30',
            enableAlerts: true,
            alertThreshold: '80'
        });
    };
    return (_jsxs("div", { className: "container mx-auto p-6 max-w-4xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold flex items-center gap-2", children: [_jsx(Settings, { className: "h-8 w-8" }), "Dashboard Settings"] }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Configure your dashboard preferences and display options" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: handleReset, children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Reset"] }), _jsxs(Button, { onClick: handleSave, disabled: isLoading, children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), isLoading ? 'Saving...' : 'Save Changes'] })] })] }), _jsxs(Tabs, { defaultValue: "display", className: "space-y-6", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsxs(TabsTrigger, { value: "display", className: "flex items-center gap-2", children: [_jsx(Palette, { className: "h-4 w-4" }), "Display"] }), _jsxs(TabsTrigger, { value: "data", className: "flex items-center gap-2", children: [_jsx(Database, { className: "h-4 w-4" }), "Data"] }), _jsxs(TabsTrigger, { value: "notifications", className: "flex items-center gap-2", children: [_jsx(Bell, { className: "h-4 w-4" }), "Notifications"] }), _jsxs(TabsTrigger, { value: "performance", className: "flex items-center gap-2", children: [_jsx(BarChart3, { className: "h-4 w-4" }), "Performance"] })] }), _jsx(TabsContent, { value: "display", className: "space-y-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Display Preferences" }), _jsx(CardDescription, { children: "Customize how your dashboard looks and feels" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { className: "text-base", children: "Dark Mode" }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Enable dark theme for the dashboard" })] }), _jsx(Switch, { checked: settings.darkMode, onCheckedChange: function (checked) {
                                                        return setSettings(function (prev) { return (__assign(__assign({}, prev), { darkMode: checked })); });
                                                    } })] }), _jsx(Separator, {}), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { className: "text-base", children: "Compact View" }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Use a more compact layout to show more information" })] }), _jsx(Switch, { checked: settings.compactView, onCheckedChange: function (checked) {
                                                        return setSettings(function (prev) { return (__assign(__assign({}, prev), { compactView: checked })); });
                                                    } })] }), _jsx(Separator, {}), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { className: "text-base", children: "Show Metrics" }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Display performance metrics and statistics" })] }), _jsx(Switch, { checked: settings.showMetrics, onCheckedChange: function (checked) {
                                                        return setSettings(function (prev) { return (__assign(__assign({}, prev), { showMetrics: checked })); });
                                                    } })] })] })] }) }), _jsx(TabsContent, { value: "data", className: "space-y-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Data Management" }), _jsx(CardDescription, { children: "Configure data retention and display limits" })] }), _jsx(CardContent, { className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "maxDataPoints", children: "Max Data Points" }), _jsxs(Select, { value: settings.maxDataPoints, onValueChange: function (value) {
                                                            return setSettings(function (prev) { return (__assign(__assign({}, prev), { maxDataPoints: value })); });
                                                        }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "50", children: "50 points" }), _jsx(SelectItem, { value: "100", children: "100 points" }), _jsx(SelectItem, { value: "200", children: "200 points" }), _jsx(SelectItem, { value: "500", children: "500 points" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "retentionDays", children: "Data Retention (Days)" }), _jsxs(Select, { value: settings.retentionDays, onValueChange: function (value) {
                                                            return setSettings(function (prev) { return (__assign(__assign({}, prev), { retentionDays: value })); });
                                                        }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "7", children: "7 days" }), _jsx(SelectItem, { value: "30", children: "30 days" }), _jsx(SelectItem, { value: "90", children: "90 days" }), _jsx(SelectItem, { value: "365", children: "1 year" })] })] })] })] }) })] }) }), _jsx(TabsContent, { value: "notifications", className: "space-y-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Notification Settings" }), _jsx(CardDescription, { children: "Manage alerts and notification preferences" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { className: "text-base", children: "Show Notifications" }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Display system notifications and alerts" })] }), _jsx(Switch, { checked: settings.showNotifications, onCheckedChange: function (checked) {
                                                        return setSettings(function (prev) { return (__assign(__assign({}, prev), { showNotifications: checked })); });
                                                    } })] }), _jsx(Separator, {}), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { className: "text-base", children: "Enable Alerts" }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Receive alerts when thresholds are exceeded" })] }), _jsx(Switch, { checked: settings.enableAlerts, onCheckedChange: function (checked) {
                                                        return setSettings(function (prev) { return (__assign(__assign({}, prev), { enableAlerts: checked })); });
                                                    } })] }), settings.enableAlerts && (_jsxs(_Fragment, { children: [_jsx(Separator, {}), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "alertThreshold", children: "Alert Threshold (%)" }), _jsx(Input, { id: "alertThreshold", type: "number", min: "0", max: "100", value: settings.alertThreshold, onChange: function (e) {
                                                                return setSettings(function (prev) { return (__assign(__assign({}, prev), { alertThreshold: e.target.value })); });
                                                            }, className: "max-w-xs" }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Trigger alerts when metrics exceed this percentage" })] })] }))] })] }) }), _jsx(TabsContent, { value: "performance", className: "space-y-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Performance Settings" }), _jsx(CardDescription, { children: "Configure refresh rates and performance options" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { className: "text-base", children: "Auto Refresh" }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Automatically refresh dashboard data" })] }), _jsx(Switch, { checked: settings.autoRefresh, onCheckedChange: function (checked) {
                                                        return setSettings(function (prev) { return (__assign(__assign({}, prev), { autoRefresh: checked })); });
                                                    } })] }), settings.autoRefresh && (_jsxs(_Fragment, { children: [_jsx(Separator, {}), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "refreshInterval", children: "Refresh Interval (seconds)" }), _jsxs(Select, { value: settings.refreshInterval, onValueChange: function (value) {
                                                                return setSettings(function (prev) { return (__assign(__assign({}, prev), { refreshInterval: value })); });
                                                            }, children: [_jsx(SelectTrigger, { className: "max-w-xs", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "10", children: "10 seconds" }), _jsx(SelectItem, { value: "30", children: "30 seconds" }), _jsx(SelectItem, { value: "60", children: "1 minute" }), _jsx(SelectItem, { value: "300", children: "5 minutes" }), _jsx(SelectItem, { value: "600", children: "10 minutes" })] })] })] })] })), _jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsx("h4", { className: "text-sm font-medium", children: "Performance Status" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-sm", children: "Load Time" })] }), _jsx(Badge, { variant: "secondary", children: "1.2s" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-sm", children: "Active Users" })] }), _jsx(Badge, { variant: "secondary", children: "24" })] })] })] })] })] }) })] })] }));
};
export default DashboardSettings;
