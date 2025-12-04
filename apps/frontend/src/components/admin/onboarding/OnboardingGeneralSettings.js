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
import { OnboardingAdminService } from '../../../services/onboarding-admin.service';
var CustomSwitch = function (_a) {
    var id = _a.id, isChecked = _a.isChecked, onChange = _a.onChange, label = _a.label;
    return (_jsxs("label", { htmlFor: id, className: "flex items-center cursor-pointer", children: [_jsxs("div", { className: "relative", children: [_jsx("input", { id: id, type: "checkbox", className: "sr-only", checked: isChecked, onChange: onChange }), _jsx("div", { className: "block w-14 h-8 rounded-full ".concat(isChecked ? 'bg-blue-500' : 'bg-gray-300') }), _jsx("div", { className: "dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ".concat(isChecked ? 'transform translate-x-6' : '') })] }), _jsx("div", { className: "ml-3 text-gray-700 font-medium", children: label })] }));
};
export var OnboardingGeneralSettings = function (_a) {
    var onSave = _a.onSave, onChange = _a.onChange, hasUnsavedChanges = _a.hasUnsavedChanges;
    var _b = useState(true), isLoading = _b[0], setIsLoading = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    var _d = useState(null), notification = _d[0], setNotification = _d[1];
    var _e = useState({
        // General settings
        onboardingEnabled: true,
        skipForReturningUsers: true,
        allowSkipping: false,
        requireEmailVerification: true,
        // Appearance
        logoUrl: '/assets/images/logo.png',
        primaryColor: '#3182CE',
        secondaryColor: '#4FD1C5',
        backgroundImage: '',
        // Content
        welcomeTitle: 'Welcome to The New Fuse',
        welcomeMessage: 'The New Fuse is an AI agent coordination platform that enables intelligent interaction between different AI systems.',
        // Behavior
        timeoutMinutes: 30,
        saveProgressAutomatically: true,
        redirectAfterCompletion: '/dashboard',
        // Analytics
        trackOnboardingAnalytics: true,
        collectFeedback: true
    }), settings = _e[0], setSettings = _e[1];
    // Show notification helper
    var showNotification = function (type, title, description) {
        setNotification({ type: type, title: title, description: description });
        setTimeout(function () { return setNotification(null); }, 5000);
    };
    // Fetch general settings from API
    useEffect(function () {
        var fetchGeneralSettings = function () { return __awaiter(void 0, void 0, void 0, function () {
            var data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        setIsLoading(true);
                        setError(null);
                        return [4 /*yield*/, OnboardingAdminService.getGeneralSettings()];
                    case 1:
                        data = _a.sent();
                        setSettings(data);
                        return [3 /*break*/, 4];
                    case 2:
                        err_1 = _a.sent();
                        console.error('Error fetching general settings:', err_1);
                        setError('Failed to load general settings. Please try again.');
                        return [3 /*break*/, 4];
                    case 3:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        fetchGeneralSettings();
    }, []);
    // Handle input change
    var handleChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value, type = _a.type;
        if (type === 'checkbox') {
            var checked_1 = e.target.checked;
            setSettings(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = checked_1, _a)));
            });
        }
        else {
            setSettings(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
            });
        }
        onChange();
    };
    // Handle switch change
    var handleSwitchChange = function (name) { return function (e) {
        setSettings(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = e.target.checked, _a)));
        });
        onChange();
    }; };
    // Handle number input change
    var handleNumberChange = function (name, value) {
        var num = parseInt(value, 10);
        setSettings(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = isNaN(num) ? 0 : num, _a)));
        });
        onChange();
    };
    // Handle save
    var handleSave = function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, OnboardingAdminService.updateGeneralSettings(settings)];
                case 1:
                    _a.sent();
                    onSave(); // This will trigger the notification in the parent component
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    console.error('Error saving general settings:', err_2);
                    showNotification('error', 'Error saving settings', 'There was an error saving your settings. Please try again.');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { children: [notification && (_jsxs("div", { className: "mb-4 p-4 rounded-md border ".concat(notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'), children: [_jsx("h3", { className: "font-bold", children: notification.title }), _jsx("p", { children: notification.description })] })), isLoading && (_jsxs("div", { className: "text-center py-10", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" }), _jsx("p", { children: "Loading general settings..." })] })), error && !isLoading && (_jsxs("div", { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4", role: "alert", children: [_jsx("strong", { className: "font-bold", children: "Error Loading Settings. " }), _jsx("span", { className: "block sm:inline", children: error }), _jsx("button", { className: "absolute top-0 bottom-0 right-0 px-4 py-3", onClick: function () { return window.location.reload(); }, children: "Retry" })] })), !isLoading && !error && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white shadow rounded-lg", children: [_jsx("div", { className: "px-4 py-5 sm:px-6 border-b border-gray-200", children: _jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: "General Settings" }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "space-y-4", children: [_jsx(CustomSwitch, { id: "onboarding-enabled", isChecked: settings.onboardingEnabled, onChange: handleSwitchChange('onboardingEnabled'), label: "Enable onboarding for new users" }), _jsx(CustomSwitch, { id: "skip-returning", isChecked: settings.skipForReturningUsers, onChange: handleSwitchChange('skipForReturningUsers'), label: "Skip onboarding for returning users" }), _jsx(CustomSwitch, { id: "allow-skipping", isChecked: settings.allowSkipping, onChange: handleSwitchChange('allowSkipping'), label: "Allow users to skip onboarding" }), _jsx(CustomSwitch, { id: "require-email", isChecked: settings.requireEmailVerification, onChange: handleSwitchChange('requireEmailVerification'), label: "Require email verification" })] }) })] }), _jsxs("div", { className: "bg-white shadow rounded-lg", children: [_jsx("div", { className: "px-4 py-5 sm:px-6 border-b border-gray-200", children: _jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: "Appearance" }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "logoUrl", className: "block text-sm font-medium text-gray-700", children: "Logo URL" }), _jsx("input", { type: "text", name: "logoUrl", id: "logoUrl", value: settings.logoUrl, onChange: handleChange, placeholder: "URL to your logo", className: "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "primaryColor", className: "block text-sm font-medium text-gray-700", children: "Primary Color" }), _jsxs("div", { className: "flex items-center space-x-2 mt-1", children: [_jsx("input", { type: "text", name: "primaryColor", id: "primaryColor", value: settings.primaryColor, onChange: handleChange, placeholder: "#3182CE", className: "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" }), _jsx("div", { className: "w-9 h-9 rounded-md border border-gray-200", style: { backgroundColor: settings.primaryColor } })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "secondaryColor", className: "block text-sm font-medium text-gray-700", children: "Secondary Color" }), _jsxs("div", { className: "flex items-center space-x-2 mt-1", children: [_jsx("input", { type: "text", name: "secondaryColor", id: "secondaryColor", value: settings.secondaryColor, onChange: handleChange, placeholder: "#4FD1C5", className: "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" }), _jsx("div", { className: "w-9 h-9 rounded-md border border-gray-200", style: { backgroundColor: settings.secondaryColor } })] })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "backgroundImage", className: "block text-sm font-medium text-gray-700", children: "Background Image URL (optional)" }), _jsx("input", { type: "text", name: "backgroundImage", id: "backgroundImage", value: settings.backgroundImage, onChange: handleChange, placeholder: "URL to background image", className: "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] })] }) })] })] }), _jsxs("div", { className: "bg-white shadow rounded-lg", children: [_jsx("div", { className: "px-4 py-5 sm:px-6 border-b border-gray-200", children: _jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: "Content" }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "welcomeTitle", className: "block text-sm font-medium text-gray-700", children: "Welcome Title" }), _jsx("input", { type: "text", name: "welcomeTitle", id: "welcomeTitle", value: settings.welcomeTitle, onChange: handleChange, placeholder: "Welcome to The New Fuse", className: "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "welcomeMessage", className: "block text-sm font-medium text-gray-700", children: "Welcome Message" }), _jsx("textarea", { name: "welcomeMessage", id: "welcomeMessage", value: settings.welcomeMessage, onChange: handleChange, placeholder: "Enter welcome message", rows: 3, className: "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white shadow rounded-lg", children: [_jsx("div", { className: "px-4 py-5 sm:px-6 border-b border-gray-200", children: _jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: "Behavior" }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "timeoutMinutes", className: "block text-sm font-medium text-gray-700", children: "Session Timeout (minutes)" }), _jsx("input", { type: "number", name: "timeoutMinutes", id: "timeoutMinutes", min: "5", max: "120", value: settings.timeoutMinutes, onChange: function (e) { return handleNumberChange('timeoutMinutes', e.target.value); }, className: "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] }), _jsx(CustomSwitch, { id: "save-automatically", isChecked: settings.saveProgressAutomatically, onChange: handleSwitchChange('saveProgressAutomatically'), label: "Save progress automatically" }), _jsxs("div", { children: [_jsx("label", { htmlFor: "redirectAfterCompletion", className: "block text-sm font-medium text-gray-700", children: "Redirect After Completion" }), _jsx("input", { type: "text", name: "redirectAfterCompletion", id: "redirectAfterCompletion", value: settings.redirectAfterCompletion, onChange: handleChange, placeholder: "/dashboard", className: "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border--blue-500 sm:text-sm" })] })] }) })] }), _jsxs("div", { className: "bg-white shadow rounded-lg", children: [_jsx("div", { className: "px-4 py-5 sm:px-6 border-b border-gray-200", children: _jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: "Analytics" }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "space-y-4", children: [_jsx(CustomSwitch, { id: "track-analytics", isChecked: settings.trackOnboardingAnalytics, onChange: handleSwitchChange('trackOnboardingAnalytics'), label: "Track onboarding analytics" }), _jsx(CustomSwitch, { id: "collect-feedback", isChecked: settings.collectFeedback, onChange: handleSwitchChange('collectFeedback'), label: "Collect user feedback" })] }) })] })] }), _jsx("hr", {}), _jsx("div", { className: "flex justify-end", children: _jsx("button", { type: "button", onClick: handleSave, disabled: !hasUnsavedChanges, className: "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed", children: "Save Changes" }) })] }))] }));
};
