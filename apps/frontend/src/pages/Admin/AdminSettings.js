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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Save, RefreshCw, Shield, Database, Server } from 'lucide-react';
var AdminSettings = function () {
    var _a = useState({
        system: {
            maintenanceMode: false,
            debugMode: false,
            logLevel: 'info',
            maxConcurrentUsers: 1000,
            sessionTimeout: 30,
            backupFrequency: 'daily',
        },
        security: {
            enforceSSL: true,
            requireMFA: false,
            passwordPolicy: {
                minLength: 8,
                requireSpecialChars: true,
                requireNumbers: true,
                requireUppercase: true,
            },
            sessionSecurity: {
                maxSessions: 5,
                ipWhitelist: [],
            },
        },
        database: {
            connectionPoolSize: 20,
            queryTimeout: 30,
            enableQueryLogging: false,
            autoBackup: true,
            retentionDays: 30,
        },
        notifications: {
            emailNotifications: true,
            slackIntegration: false,
            webhookUrl: '',
            alertThresholds: {
                cpuUsage: 80,
                memoryUsage: 85,
                diskUsage: 90,
            },
        },
    }), settings = _a[0], setSettings = _a[1];
    var _b = useState(false), loading = _b[0], setLoading = _b[1];
    var _c = useState(false), saved = _c[0], setSaved = _c[1];
    useEffect(function () {
        fetchSettings();
    }, []);
    var fetchSettings = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, 5, 6]);
                    setLoading(true);
                    return [4 /*yield*/, fetch('/api/admin/settings')];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setSettings(data);
                    _a.label = 3;
                case 3: return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    console.error('Failed to fetch admin settings:', error_1);
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var saveSettings = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    return [4 /*yield*/, fetch('/api/admin/settings', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(settings),
                        })];
                case 1:
                    response = _a.sent();
                    if (response.ok) {
                        setSaved(true);
                        setTimeout(function () { return setSaved(false); }, 3000);
                    }
                    return [3 /*break*/, 4];
                case 2:
                    error_2 = _a.sent();
                    console.error('Failed to save admin settings:', error_2);
                    return [3 /*break*/, 4];
                case 3:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var updateSystemSettings = function (key, value) {
        setSettings(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), { system: __assign(__assign({}, prev.system), (_a = {}, _a[key] = value, _a)) }));
        });
    };
    var updateSecuritySettings = function (key, value) {
        setSettings(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), { security: __assign(__assign({}, prev.security), (_a = {}, _a[key] = value, _a)) }));
        });
    };
    var updatePasswordPolicy = function (key, value) {
        setSettings(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), { security: __assign(__assign({}, prev.security), { passwordPolicy: __assign(__assign({}, prev.security.passwordPolicy), (_a = {}, _a[key] = value, _a)) }) }));
        });
    };
    var updateDatabaseSettings = function (key, value) {
        setSettings(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), { database: __assign(__assign({}, prev.database), (_a = {}, _a[key] = value, _a)) }));
        });
    };
    var updateNotificationSettings = function (key, value) {
        setSettings(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), { notifications: __assign(__assign({}, prev.notifications), (_a = {}, _a[key] = value, _a)) }));
        });
    };
    var updateAlertThresholds = function (key, value) {
        setSettings(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), { notifications: __assign(__assign({}, prev.notifications), { alertThresholds: __assign(__assign({}, prev.notifications.alertThresholds), (_a = {}, _a[key] = value, _a)) }) }));
        });
    };
    return (_jsxs("div", { className: "p-6 max-w-6xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Admin Settings" }), _jsx("p", { className: "text-gray-600 mt-2", children: "Manage system-wide configuration and security settings" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: fetchSettings, disabled: loading, children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2 ".concat(loading ? 'animate-spin' : '') }), "Refresh"] }), _jsxs(Button, { onClick: saveSettings, disabled: loading, className: saved ? 'bg-green-600 hover:bg-green-700' : '', children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), saved ? 'Saved!' : 'Save Changes'] })] })] }), _jsxs(Tabs, { defaultValue: "system", className: "space-y-6", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsxs(TabsTrigger, { value: "system", className: "flex items-center gap-2", children: [_jsx(Server, { className: "w-4 h-4" }), "System"] }), _jsxs(TabsTrigger, { value: "security", className: "flex items-center gap-2", children: [_jsx(Shield, { className: "w-4 h-4" }), "Security"] }), _jsxs(TabsTrigger, { value: "database", className: "flex items-center gap-2", children: [_jsx(Database, { className: "w-4 h-4" }), "Database"] }), _jsxs(TabsTrigger, { value: "notifications", className: "flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), "Notifications"] })] }), _jsx(TabsContent, { value: "system", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "System Configuration" }) }), _jsx(CardContent, { className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "maintenance-mode", children: "Maintenance Mode" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { id: "maintenance-mode", checked: settings.system.maintenanceMode, onCheckedChange: function (checked) { return updateSystemSettings('maintenanceMode', checked); } }), _jsx("span", { className: "text-sm text-gray-600", children: settings.system.maintenanceMode ? 'Enabled' : 'Disabled' })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "debug-mode", children: "Debug Mode" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { id: "debug-mode", checked: settings.system.debugMode, onCheckedChange: function (checked) { return updateSystemSettings('debugMode', checked); } }), _jsx("span", { className: "text-sm text-gray-600", children: settings.system.debugMode ? 'Enabled' : 'Disabled' })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "log-level", children: "Log Level" }), _jsxs(Select, { value: settings.system.logLevel, onValueChange: function (value) { return updateSystemSettings('logLevel', value); }, children: [_jsx(SelectTrigger, { id: "log-level", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "error", children: "Error" }), _jsx(SelectItem, { value: "warn", children: "Warning" }), _jsx(SelectItem, { value: "info", children: "Info" }), _jsx(SelectItem, { value: "debug", children: "Debug" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "backup-frequency", children: "Backup Frequency" }), _jsxs(Select, { value: settings.system.backupFrequency, onValueChange: function (value) { return updateSystemSettings('backupFrequency', value); }, children: [_jsx(SelectTrigger, { id: "backup-frequency", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "hourly", children: "Hourly" }), _jsx(SelectItem, { value: "daily", children: "Daily" }), _jsx(SelectItem, { value: "weekly", children: "Weekly" }), _jsx(SelectItem, { value: "monthly", children: "Monthly" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "max-users", children: "Max Concurrent Users" }), _jsx(Input, { id: "max-users", type: "number", value: settings.system.maxConcurrentUsers, onChange: function (e) { return updateSystemSettings('maxConcurrentUsers', parseInt(e.target.value)); } })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "session-timeout", children: "Session Timeout (minutes)" }), _jsx(Input, { id: "session-timeout", type: "number", value: settings.system.sessionTimeout, onChange: function (e) { return updateSystemSettings('sessionTimeout', parseInt(e.target.value)); } })] })] }) })] }) }), _jsx(TabsContent, { value: "security", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Security Settings" }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "enforce-ssl", children: "Enforce SSL" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { id: "enforce-ssl", checked: settings.security.enforceSSL, onCheckedChange: function (checked) { return updateSecuritySettings('enforceSSL', checked); } }), _jsx(Badge, { variant: settings.security.enforceSSL ? 'default' : 'secondary', children: settings.security.enforceSSL ? 'Enabled' : 'Disabled' })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "require-mfa", children: "Require MFA" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { id: "require-mfa", checked: settings.security.requireMFA, onCheckedChange: function (checked) { return updateSecuritySettings('requireMFA', checked); } }), _jsx(Badge, { variant: settings.security.requireMFA ? 'default' : 'secondary', children: settings.security.requireMFA ? 'Required' : 'Optional' })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Password Policy" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "min-length", children: "Minimum Length" }), _jsx(Input, { id: "min-length", type: "number", value: settings.security.passwordPolicy.minLength, onChange: function (e) { return updatePasswordPolicy('minLength', parseInt(e.target.value)); } })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "require-special", children: "Require Special Characters" }), _jsx(Switch, { id: "require-special", checked: settings.security.passwordPolicy.requireSpecialChars, onCheckedChange: function (checked) { return updatePasswordPolicy('requireSpecialChars', checked); } })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "require-numbers", children: "Require Numbers" }), _jsx(Switch, { id: "require-numbers", checked: settings.security.passwordPolicy.requireNumbers, onCheckedChange: function (checked) { return updatePasswordPolicy('requireNumbers', checked); } })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "require-uppercase", children: "Require Uppercase" }), _jsx(Switch, { id: "require-uppercase", checked: settings.security.passwordPolicy.requireUppercase, onCheckedChange: function (checked) { return updatePasswordPolicy('requireUppercase', checked); } })] })] })] })] })] }) }), _jsx(TabsContent, { value: "database", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Database Configuration" }) }), _jsx(CardContent, { className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "pool-size", children: "Connection Pool Size" }), _jsx(Input, { id: "pool-size", type: "number", value: settings.database.connectionPoolSize, onChange: function (e) { return updateDatabaseSettings('connectionPoolSize', parseInt(e.target.value)); } })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "query-timeout", children: "Query Timeout (seconds)" }), _jsx(Input, { id: "query-timeout", type: "number", value: settings.database.queryTimeout, onChange: function (e) { return updateDatabaseSettings('queryTimeout', parseInt(e.target.value)); } })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "query-logging", children: "Enable Query Logging" }), _jsx(Switch, { id: "query-logging", checked: settings.database.enableQueryLogging, onCheckedChange: function (checked) { return updateDatabaseSettings('enableQueryLogging', checked); } })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "auto-backup", children: "Auto Backup" }), _jsx(Switch, { id: "auto-backup", checked: settings.database.autoBackup, onCheckedChange: function (checked) { return updateDatabaseSettings('autoBackup', checked); } })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "retention-days", children: "Retention Days" }), _jsx(Input, { id: "retention-days", type: "number", value: settings.database.retentionDays, onChange: function (e) { return updateDatabaseSettings('retentionDays', parseInt(e.target.value)); } })] })] }) })] }) }), _jsx(TabsContent, { value: "notifications", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Notification Settings" }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email-notifications", children: "Email Notifications" }), _jsx(Switch, { id: "email-notifications", checked: settings.notifications.emailNotifications, onCheckedChange: function (checked) { return updateNotificationSettings('emailNotifications', checked); } })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "slack-integration", children: "Slack Integration" }), _jsx(Switch, { id: "slack-integration", checked: settings.notifications.slackIntegration, onCheckedChange: function (checked) { return updateNotificationSettings('slackIntegration', checked); } })] }), _jsxs("div", { className: "space-y-2 col-span-2", children: [_jsx(Label, { htmlFor: "webhook-url", children: "Webhook URL" }), _jsx(Input, { id: "webhook-url", type: "url", placeholder: "https://hooks.slack.com/...", value: settings.notifications.webhookUrl, onChange: function (e) { return updateNotificationSettings('webhookUrl', e.target.value); } })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Alert Thresholds (%)" }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "cpu-threshold", children: "CPU Usage" }), _jsx(Input, { id: "cpu-threshold", type: "number", min: "0", max: "100", value: settings.notifications.alertThresholds.cpuUsage, onChange: function (e) { return updateAlertThresholds('cpuUsage', parseInt(e.target.value)); } })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "memory-threshold", children: "Memory Usage" }), _jsx(Input, { id: "memory-threshold", type: "number", min: "0", max: "100", value: settings.notifications.alertThresholds.memoryUsage, onChange: function (e) { return updateAlertThresholds('memoryUsage', parseInt(e.target.value)); } })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "disk-threshold", children: "Disk Usage" }), _jsx(Input, { id: "disk-threshold", type: "number", min: "0", max: "100", value: settings.notifications.alertThresholds.diskUsage, onChange: function (e) { return updateAlertThresholds('diskUsage', parseInt(e.target.value)); } })] })] })] })] })] }) })] })] }));
};
export default AdminSettings;
