import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
exports.AgentConfig = AgentConfig;
import react_1 from 'react';
import { SimpleGrid, GridItem } from '@chakra-ui/react';
import agent_types_1 from '../../domain/core/wizards/types/agent_types';
import WizardProvider_1 from './WizardProvider';
function AgentConfig(_a) {
    var onUpdate = _a.onUpdate;
    var state = (0, WizardProvider_1.useWizard)().state;
    var _b = (0, react_1.useState)(new Map()), agents = _b[0], setAgents = _b[1];
    var _c = (0, react_1.useState)(''), newAgentName = _c[0], setNewAgentName = _c[1];
    var _d = (0, react_1.useState)(''), newAgentType = _d[0], setNewAgentType = _d[1];
    (0, react_1.useEffect)(function () {
        if (state.session) {
            setAgents(state.session.active_agents);
        }
    }, [state.session]);
    var handleAddAgent = function () {
        if (!newAgentName || !newAgentType)
            return;
        var newAgent = {
            id: "agent_".concat(Date.now()),
            name: newAgentName,
            type: newAgentType,
            state: agent_types_1.AgentState.IDLE,
            tasks: [],
            performance: {
                cpu_usage: 0,
                memory_usage: 0,
                task_completion_rate: 0
            }
        };
        var updatedAgents = new Map(agents);
        updatedAgents.set(newAgent.id, newAgent);
        setAgents(updatedAgents);
        onUpdate(updatedAgents);
        setNewAgentName('');
        setNewAgentType('');
    };
    var handleRemoveAgent = function (agentId) {
        var updatedAgents = new Map(agents);
        updatedAgents.delete(agentId);
        setAgents(updatedAgents);
        onUpdate(updatedAgents);
    };
    var handleToggleAgent = function (agentId) {
        var updatedAgents = new Map(agents);
        var agent = updatedAgents.get(agentId);
        if (agent) {
            agent.state = agent.state === agent_types_1.AgentState.ACTIVE ? agent_types_1.AgentState.IDLE : agent_types_1.AgentState.ACTIVE;
            updatedAgents.set(agentId, agent);
            setAgents(updatedAgents);
            onUpdate(updatedAgents);
        }
    };
    var getStateColor = function (state) {
        switch (state) {
            case agent_types_1.AgentState.ACTIVE:
                return 'success';
            case agent_types_1.AgentState.IDLE:
                return 'default';
            case agent_types_1.AgentState.ERROR:
                return 'error';
            default:
                return 'default';
        }
    };
    return (_jsxs(material_1.Box, { children: [_jsxs(material_1.Box, { mb: 4, children: [_jsx(material_1.Typography, { variant: "h6", gutterBottom: true, children: "Add New Agent" }), _jsxs(SimpleGrid, { columns: 2, alignItems: "flex-end", children: [_jsx(GridItem, { colSpan: 4, children: _jsx(material_1.TextField, { fullWidth: true, label: "Agent Name", value: newAgentName, onChange: function (e) { return setNewAgentName(e.target.value); } }) }), _jsx(GridItem, { colSpan: 4, children: _jsxs(material_1.FormControl, { fullWidth: true, children: [_jsx(material_1.InputLabel, { children: "Agent Type" }), _jsxs(material_1.Select, { value: newAgentType, onChange: function (e) { return setNewAgentType(e.target.value); }, label: "Agent Type", children: [_jsx(material_1.MenuItem, { value: "task_executor", children: "Task Executor" }), _jsx(material_1.MenuItem, { value: "knowledge_worker", children: "Knowledge Worker" }), _jsx(material_1.MenuItem, { value: "optimization_agent", children: "Optimization Agent" }), _jsx(material_1.MenuItem, { value: "integration_agent", children: "Integration Agent" })] })] }) }), _jsx(GridItem, { colSpan: 4, children: _jsx(material_1.Button, { variant: "contained", startIcon: _jsx(icons_material_1.Add, {}), onClick: handleAddAgent, disabled: !newAgentName || !newAgentType, children: "Add Agent" }) })] })] }), _jsx(material_1.Typography, { variant: "h6", gutterBottom: true, children: "Active Agents" }), _jsx(SimpleGrid, { columns: 2, children: Array.from(agents.values()).map(function (agent) { return (_jsx(GridItem, { colSpan: 12, md: 6, children: _jsx(material_1.Card, { children: _jsxs(material_1.CardContent, { children: [_jsxs(material_1.Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(material_1.Typography, { variant: "h6", children: agent.name }), _jsxs(material_1.Box, { children: [_jsx(material_1.Chip, { label: agent.state, color: getStateColor(agent.state), size: "small", sx: { mr: 1 } }), _jsx(material_1.Tooltip, { title: agent.state === agent_types_1.AgentState.ACTIVE ? 'Stop Agent' : 'Start Agent', children: _jsx(material_1.IconButton, { size: "small", onClick: function () { return handleToggleAgent(agent.id); }, color: agent.state === agent_types_1.AgentState.ACTIVE ? 'error' : 'success', children: agent.state === agent_types_1.AgentState.ACTIVE ? _jsx(icons_material_1.Stop, {}) : _jsx(icons_material_1.PlayArrow, {}) }) }), _jsx(material_1.Tooltip, { title: "Remove Agent", children: _jsx(material_1.IconButton, { size: "small", onClick: function () { return handleRemoveAgent(agent.id); }, color: "error", children: _jsx(icons_material_1.Delete, {}) }) })] })] }), _jsxs(material_1.Typography, { variant: "body2", color: "text.secondary", gutterBottom: true, children: ["Type: ", agent.type] }), _jsxs(material_1.Box, { mt: 2, children: [_jsx(material_1.Typography, { variant: "subtitle2", gutterBottom: true, children: "Performance Metrics" }), _jsxs(SimpleGrid, { columns: 1, children: [_jsx(GridItem, { colSpan: 4, children: _jsxs(material_1.Typography, { variant: "body2", color: "text.secondary", children: ["CPU: ", agent.performance.cpu_usage, "%"] }) }), _jsx(GridItem, { colSpan: 4, children: _jsxs(material_1.Typography, { variant: "body2", color: "text.secondary", children: ["Memory: ", agent.performance.memory_usage, "MB"] }) }), _jsx(GridItem, { colSpan: 4, children: _jsxs(material_1.Typography, { variant: "body2", color: "text.secondary", children: ["Tasks: ", agent.tasks.length] }) })] })] })] }) }) }, agent.id)); }) })] }));
}
