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
export default function GeneralSettings() {
    var _this = this;
    var _a = useState({
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        notifications: {
            email: true,
            push: true,
            desktop: false,
        },
        privacy: {
            analytics: true,
            crashReports: true,
            usageData: false,
        },
        performance: {
            autoSave: true,
            autoSaveInterval: 30,
            maxConcurrentTasks: 5,
        },
    }), settings = _a[0], setSettings = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(false), saving = _c[0], setSaving = _c[1];
    useEffect(function () {
        // Fetch current settings from backend
        var fetchSettings = function () { return __awaiter(_this, void 0, void 0, function () {
            var response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, 5, 6]);
                        return [4 /*yield*/, fetch('/api/settings/general')];
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
                        console.error('Error fetching settings:', error_1);
                        return [3 /*break*/, 6];
                    case 5:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        fetchSettings();
    }, []);
    var handleSave = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetch('/api/settings/general', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(settings),
                        })];
                case 2:
                    response = _a.sent();
                    if (response.ok) {
                        // Show success message
                        console.log('Settings saved successfully');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error saving settings:', error_2);
                    return [3 /*break*/, 5];
                case 4:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var updateSetting = function (path, value) {
        setSettings(function (prev) {
            var keys = path.split('.');
            var newSettings = __assign({}, prev);
            var current = newSettings;
            for (var i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = __assign({}, current[keys[i]]);
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newSettings;
        });
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
    }
    return (_jsxs("div", { className: "space-y-6 max-w-4xl", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-3xl font-bold", children: "General Settings" }), _jsx("button", { onClick: handleSave, disabled: saving, className: "px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50", children: saving ? 'Saving...' : 'Save Changes' })] }), _jsxs("div", { className: "bg-card p-6 rounded-lg shadow-sm border", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Appearance" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Theme" }), _jsxs("select", { value: settings.theme, onChange: function (e) { return updateSetting('theme', e.target.value); }, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary", title: "Select theme preference", children: [_jsx("option", { value: "light", children: "Light" }), _jsx("option", { value: "dark", children: "Dark" }), _jsx("option", { value: "system", children: "System" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Language" }), _jsxs("select", { value: settings.language, onChange: function (e) { return updateSetting('language', e.target.value); }, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary", title: "Select language preference", children: [_jsx("option", { value: "en", children: "English" }), _jsx("option", { value: "es", children: "Spanish" }), _jsx("option", { value: "fr", children: "French" }), _jsx("option", { value: "de", children: "German" }), _jsx("option", { value: "zh", children: "Chinese" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Timezone" }), _jsxs("select", { value: settings.timezone, onChange: function (e) { return updateSetting('timezone', e.target.value); }, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary", title: "Select timezone", children: [_jsx("option", { value: "UTC", children: "UTC" }), _jsx("option", { value: "America/New_York", children: "Eastern Time" }), _jsx("option", { value: "America/Chicago", children: "Central Time" }), _jsx("option", { value: "America/Denver", children: "Mountain Time" }), _jsx("option", { value: "America/Los_Angeles", children: "Pacific Time" }), _jsx("option", { value: "Europe/London", children: "London" }), _jsx("option", { value: "Europe/Paris", children: "Paris" }), _jsx("option", { value: "Asia/Tokyo", children: "Tokyo" })] })] })] })] }), _jsxs("div", { className: "bg-card p-6 rounded-lg shadow-sm border", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Notifications" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email-notifications", className: "text-sm font-medium", children: "Email Notifications" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Receive notifications via email" })] }), _jsx("input", { id: "email-notifications", type: "checkbox", checked: settings.notifications.email, onChange: function (e) { return updateSetting('notifications.email', e.target.checked); }, className: "h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "push-notifications", className: "text-sm font-medium", children: "Push Notifications" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Receive push notifications on mobile" })] }), _jsx("input", { id: "push-notifications", type: "checkbox", checked: settings.notifications.push, onChange: function (e) { return updateSetting('notifications.push', e.target.checked); }, className: "h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "desktop-notifications", className: "text-sm font-medium", children: "Desktop Notifications" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Show desktop notifications" })] }), _jsx("input", { id: "desktop-notifications", type: "checkbox", checked: settings.notifications.desktop, onChange: function (e) { return updateSetting('notifications.desktop', e.target.checked); }, className: "h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" })] })] })] }), _jsxs("div", { className: "bg-card p-6 rounded-lg shadow-sm border", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Privacy" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "analytics-privacy", className: "text-sm font-medium", children: "Analytics" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Help improve the platform by sharing anonymous usage data" })] }), _jsx("input", { id: "analytics-privacy", type: "checkbox", checked: settings.privacy.analytics, onChange: function (e) { return updateSetting('privacy.analytics', e.target.checked); }, className: "h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "crash-reports", className: "text-sm font-medium", children: "Crash Reports" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Automatically send crash reports to help fix issues" })] }), _jsx("input", { id: "crash-reports", type: "checkbox", checked: settings.privacy.crashReports, onChange: function (e) { return updateSetting('privacy.crashReports', e.target.checked); }, className: "h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "usage-data", className: "text-sm font-medium", children: "Usage Data" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Share detailed usage patterns for product improvement" })] }), _jsx("input", { id: "usage-data", type: "checkbox", checked: settings.privacy.usageData, onChange: function (e) { return updateSetting('privacy.usageData', e.target.checked); }, className: "h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" })] })] })] }), _jsxs("div", { className: "bg-card p-6 rounded-lg shadow-sm border", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Performance" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "auto-save", className: "text-sm font-medium", children: "Auto Save" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Automatically save changes" })] }), _jsx("input", { id: "auto-save", type: "checkbox", checked: settings.performance.autoSave, onChange: function (e) { return updateSetting('performance.autoSave', e.target.checked); }, className: "h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "auto-save-interval", className: "block text-sm font-medium mb-2", children: "Auto Save Interval (seconds)" }), _jsx("input", { id: "auto-save-interval", type: "number", min: "10", max: "300", value: settings.performance.autoSaveInterval, onChange: function (e) { return updateSetting('performance.autoSaveInterval', parseInt(e.target.value)); }, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary", disabled: !settings.performance.autoSave })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "max-concurrent-tasks", className: "block text-sm font-medium mb-2", children: "Max Concurrent Tasks" }), _jsx("input", { id: "max-concurrent-tasks", type: "number", min: "1", max: "20", value: settings.performance.maxConcurrentTasks, onChange: function (e) { return updateSetting('performance.maxConcurrentTasks', parseInt(e.target.value)); }, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" })] })] })] })] }));
}
