"use strict";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import react_router_dom_1 from 'react-router-dom';
import BaseLayout_1 from '@/components/layout/BaseLayout';
import core_1 from '@/components/core';
// Lazy load settings components
var General = react_1.default.lazy(function () { return Promise.resolve().then(function () { return require('./General'); }); });
var Appearance = react_1.default.lazy(function () { return Promise.resolve().then(function () { return require('./Appearance'); }); });
var API = react_1.default.lazy(function () { return Promise.resolve().then(function () { return require('./API'); }); });
var Security = react_1.default.lazy(function () { return Promise.resolve().then(function () { return require('./Security'); }); });
var Notifications = react_1.default.lazy(function () { return Promise.resolve().then(function () { return require('./Notifications'); }); });
var settingsSections = [
    { path: 'general', title: 'General', description: 'Manage your general settings and preferences' },
    { path: 'appearance', title: 'Appearance', description: 'Customize the look and feel of your workspace' },
    { path: 'api', title: 'API Keys', description: 'Manage your API keys and integrations' },
    { path: 'security', title: 'Security', description: 'Configure security settings and permissions' },
    { path: 'notifications', title: 'Notifications', description: 'Control your notification preferences' },
];
var SettingsHome = function () {
    var location = (0, react_router_dom_1.useLocation)();
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold tracking-tight", children: "Settings" }), _jsx("p", { className: "text-muted-foreground", children: "Manage your account settings and preferences." })] }), _jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: settingsSections.map(function (section) { return (_jsx(react_router_dom_1.Link, { to: section.path, children: _jsxs(core_1.Card, { hover: true, clickable: true, className: "h-full", children: [_jsx(core_1.CardHeader, { children: _jsx(core_1.CardTitle, { children: section.title }) }), _jsx(core_1.CardContent, { children: _jsx("p", { className: "text-muted-foreground", children: section.description }) })] }) }, section.path)); }) })] }));
};
var Settings = function () {
    return (_jsx(BaseLayout_1.BaseLayout, { children: _jsxs(react_router_dom_1.Routes, { children: [_jsx(react_router_dom_1.Route, { index: true, element: _jsx(SettingsHome, {}) }), _jsx(react_router_dom_1.Route, { path: "general", element: _jsx(General, {}) }), _jsx(react_router_dom_1.Route, { path: "appearance", element: _jsx(Appearance, {}) }), _jsx(react_router_dom_1.Route, { path: "api", element: _jsx(API, {}) }), _jsx(react_router_dom_1.Route, { path: "security", element: _jsx(Security, {}) }), _jsx(react_router_dom_1.Route, { path: "notifications", element: _jsx(Notifications, {}) })] }) }));
};
exports.default = Settings;
