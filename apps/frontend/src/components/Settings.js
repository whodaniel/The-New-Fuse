"use strict";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import components_1 from '../components';
import { Box, SimpleGrid, GridItem } from '@chakra-ui/react';
var Settings = function () {
    var _a = react_1.default.useState({
        enableLogging: true,
        debugMode: false,
        maxAgents: 10,
        apiKey: '',
        webhookUrl: '',
    }), settings = _a[0], setSettings = _a[1];
    var handleSettingChange = function (setting) { return function (event) {
        var _a;
        setSettings(Object.assign(Object.assign({}, settings), (_a = {}, _a[setting] = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value, _a)));
    }; };
    return (_jsx("div", { className: "p-6", children: _jsxs(SimpleGrid, { columns: 3, children: [_jsx(GridItem, { colSpan: 12, md: 6, children: _jsxs(Box, { className: "p-4", children: [_jsxs("h2", { className: "text-xl font-bold mb-4 flex items-center", children: [_jsx(icons_material_1.Settings, { className: "mr-2" }), "System Settings"] }), _jsxs(material_1.List, { children: [_jsxs(material_1.ListItem, { children: [_jsx(material_1.ListItemIcon, { children: _jsx(icons_material_1.Storage, {}) }), _jsx(material_1.ListItemText, { primary: "Enable Logging", secondary: "Record detailed system logs" }), _jsx(material_1.Switch, { edge: "end", checked: settings.enableLogging, onChange: handleSettingChange('enableLogging') })] }), _jsxs(material_1.ListItem, { children: [_jsx(material_1.ListItemIcon, { children: _jsx(icons_material_1.Memory, {}) }), _jsx(material_1.ListItemText, { primary: "Debug Mode", secondary: "Enable detailed debugging information" }), _jsx(material_1.Switch, { edge: "end", checked: settings.debugMode, onChange: handleSettingChange('debugMode') })] }), _jsxs(material_1.ListItem, { children: [_jsx(material_1.ListItemIcon, { children: _jsx(icons_material_1.Api, {}) }), _jsx(material_1.ListItemText, { primary: "Max Concurrent Agents", secondary: "Maximum number of agents that can run simultaneously" }), _jsx(material_1.TextField, { type: "number", value: settings.maxAgents, onChange: handleSettingChange('maxAgents'), size: "small", style: { width: 100 } })] })] })] }) }), _jsx(GridItem, { colSpan: 12, md: 6, children: _jsxs(Box, { className: "p-4", children: [_jsxs("h2", { className: "text-xl font-bold mb-4 flex items-center", children: [_jsx(icons_material_1.Security, { className: "mr-2" }), "API Configuration"] }), _jsxs("div", { className: "space-y-4", children: [_jsx(material_1.TextField, { fullWidth: true, label: "API Key", type: "password", value: settings.apiKey, onChange: handleSettingChange('apiKey') }), _jsx(material_1.TextField, { fullWidth: true, label: "Webhook URL", value: settings.webhookUrl, onChange: handleSettingChange('webhookUrl') }), _jsx(material_1.Button, { variant: "contained", color: "primary", children: "Verify Configuration" })] })] }) }), _jsx(GridItem, { colSpan: 12, md: 6, children: _jsxs(Box, { className: "p-4", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "LLM Configuration" }), _jsx(components_1.LLMSelector, {})] }) }), _jsx(GridItem, { colSpan: 12, md: 6, children: _jsxs(Box, { className: "p-4", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "GPU Management" }), _jsx(components_1.GPUManager, {})] }) }), _jsx(GridItem, { colSpan: 12, children: _jsxs(Box, { className: "p-4", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Webhook Management" }), _jsx(components_1.WebhookManager, {})] }) })] }) }));
};
exports.default = Settings;
