import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card } from '@/shared/ui/core/Card';
import { Switch } from '@/shared/ui/core/Switch';
import { Input } from '@/shared/ui/core/Input';
export function Settings(_a) {
    var onSettingChange = _a.onSettingChange;
    var _b = React.useState({
        enableLogging: true,
        debugMode: false,
        maxAgents: 10,
        apiKey: '',
        webhookUrl: '',
    }), settings = _b[0], setSettings = _b[1];
    var handleSettingChange = function (setting, value) {
        var _a;
        var newSettings = Object.assign(Object.assign({}, settings), (_a = {}, _a[setting] = value, _a));
        setSettings(newSettings);
        onSettingChange === null || onSettingChange === void 0 ? void 0 : onSettingChange(setting, value);
    };
    return (_jsx("div", { className: "space-y-6 p-6", children: _jsxs(Card, { className: "p-6", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "System Settings" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: "Enable Logging" }), _jsx("p", { className: "text-sm text-gray-500", children: "Record detailed system logs" })] }), _jsx(Switch, { checked: settings.enableLogging, onCheckedChange: function (checked) { return handleSettingChange('enableLogging', checked); } })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: "Debug Mode" }), _jsx("p", { className: "text-sm text-gray-500", children: "Enable detailed debugging information" })] }), _jsx(Switch, { checked: settings.debugMode, onCheckedChange: function (checked) { return handleSettingChange('debugMode', checked); } })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "font-medium", children: "Max Concurrent Agents" }), _jsx("p", { className: "text-sm text-gray-500", children: "Maximum number of agents that can run simultaneously" }), _jsx(Input, { type: "number", value: settings.maxAgents.toString(), onChange: function (e) { return handleSettingChange('maxAgents', parseInt(e.target.value, 10)); }, className: "w-32" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "font-medium", children: "API Key" }), _jsx("p", { className: "text-sm text-gray-500", children: "Your API key for external services" }), _jsx(Input, { type: "password", value: settings.apiKey, onChange: function (e) { return handleSettingChange('apiKey', e.target.value); }, placeholder: "Enter your API key" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "font-medium", children: "Webhook URL" }), _jsx("p", { className: "text-sm text-gray-500", children: "URL for webhook notifications" }), _jsx(Input, { type: "url", value: settings.webhookUrl, onChange: function (e) { return handleSettingChange('webhookUrl', e.target.value); }, placeholder: "https://your-webhook-url.com" })] })] })] }) }));
}
