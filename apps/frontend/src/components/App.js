"use strict";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
import react_router_dom_1 from 'react-router-dom';
import shared_1 from './components/shared';
import features_1 from './components/features';
import SocketContext_1 from './services/SocketContext';
import theme_context_1 from './contexts/theme-context';
require("./App.css");
var App = function () {
    return (_jsx(react_router_dom_1.BrowserRouter, { children: _jsx(theme_context_1.ThemeProvider, { children: _jsx(SocketContext_1.SocketProvider, { children: _jsxs("div", { className: "app", children: [_jsx(shared_1.Header, {}), _jsxs("div", { className: "main-content", children: [_jsx(shared_1.Sidebar, {}), _jsxs("div", { className: "workspace", children: [_jsx(features_1.ChatInterface, {}), _jsx(features_1.AgentCollaborationDashboard, {}), _jsxs("div", { className: "metrics-panel", children: [_jsx(features_1.SystemMetrics, {}), _jsx(features_1.PerformanceMetrics, {})] })] })] }), _jsx(shared_1.ThemeToggle, {})] }) }) }) }));
};
exports.default = App;
