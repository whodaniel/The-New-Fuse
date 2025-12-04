"use strict";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Dashboard;
import react_1 from 'react';
import route_context_1 from '../contexts/route-context';
import card_1 from '../components/ui/card';
import components_1 from '../components';
function Dashboard() {
    var setPageTitle = (0, route_context_1.useRoute)().setPageTitle;
    (0, react_1.useEffect)(function () {
        setPageTitle('Dashboard');
    }, [setPageTitle]);
    return (_jsxs("div", { className: "grid gap-6", children: [_jsx(card_1.Card, { className: "p-6", children: _jsx(components_1.AgentCollaborationDashboard, {}) }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsx(card_1.Card, { className: "p-6", children: _jsx(components_1.SystemMetrics, {}) }), _jsx(card_1.Card, { className: "p-6", children: _jsx(components_1.PerformanceMetrics, {}) })] }), _jsxs("div", { className: "grid gap-6 md:grid-cols-3", children: [_jsx(card_1.Card, { className: "p-6 md:col-span-2", children: _jsx(components_1.TaskBoard, {}) }), _jsx(card_1.Card, { className: "p-6", children: _jsx(components_1.AgentNetwork, {}) })] })] }));
}
