"use strict";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import components_1 from '../components';
import { Box, SimpleGrid, GridItem, Tabs, Tab } from '@chakra-ui/react';
import store_1 from '../store';
var AgentHub = function () {
    var _a = (0, store_1.default)(), agents = _a.agents, selectedAgent = _a.selectedAgent, setSelectedAgent = _a.setSelectedAgent;
    var _b = react_1.default.useState(0), activeTab = _b[0], setActiveTab = _b[1];
    var handleTabChange = function (event, newValue) {
        setActiveTab(newValue);
    };
    return (_jsx("div", { className: "p-6", children: _jsxs(SimpleGrid, { columns: 3, children: [_jsx(GridItem, { colSpan: 12, md: 4, children: _jsxs(Box, { className: "p-4", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Available Agents" }), _jsx("div", { className: "space-y-2", children: agents.map(function (agent) { return (_jsxs("div", { className: "p-3 rounded cursor-pointer ".concat((selectedAgent === null || selectedAgent === void 0 ? void 0 : selectedAgent.id) === agent.id
                                        ? 'bg-primary-100 border-primary-500'
                                        : 'bg-gray-50 hover:bg-gray-100'), onClick: function () { return setSelectedAgent(agent); }, children: [_jsx("div", { className: "font-medium", children: agent.name }), _jsxs("div", { className: "text-sm text-gray-500", children: ["Status: ", agent.status] })] }, agent.id)); }) })] }) }), _jsx(GridItem, { colSpan: 12, md: 8, children: _jsxs(Box, { className: "p-4", children: [_jsx(Box, { style: { borderBottom: 1, borderColor: 'divider', mb: 2 }, children: _jsxs(Tabs, { value: activeTab, onChange: handleTabChange, children: [_jsx(Tab, { label: "Details" }), _jsx(Tab, { label: "Personality" }), _jsx(Tab, { label: "Skills" }), _jsx(Tab, { label: "Training" })] }) }), activeTab === 0 && selectedAgent && (_jsx(components_1.AgentDetails, { agent: selectedAgent })), activeTab === 1 && selectedAgent && (_jsx(components_1.AgentPersonalityCustomizer, { agent: selectedAgent })), activeTab === 2 && selectedAgent && (_jsx(components_1.AgentSkillMarketplace, { agent: selectedAgent })), activeTab === 3 && selectedAgent && (_jsx(components_1.AgentTrainingArena, { agent: selectedAgent })), !selectedAgent && (_jsxs("div", { className: "text-center py-8", children: [_jsx("p", { className: "text-gray-500", children: "Select an agent or create a new one to begin" }), _jsx(components_1.CreateAgent, {})] }))] }) })] }) }));
};
exports.default = AgentHub;
