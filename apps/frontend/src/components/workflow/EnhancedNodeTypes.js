import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Handle, Position } from 'reactflow';
import { Box, VStack, HStack, Text, Badge, Icon, Card, CardBody, Avatar, Progress, Tooltip } from '@chakra-ui/react';
import { FiUser, FiCpu, FiGitBranch, FiGrid, FiCheckCircle, FiPlay, FiPause, FiAlertCircle, FiClock, FiUsers } from 'react-icons/fi';
// Agent Task Node
export var AgentTaskNode = function (_a) {
    var data = _a.data, selected = _a.selected;
    var getStatusColor = function () {
        switch (data.status) {
            case 'running':
                return 'blue';
            case 'completed':
                return 'green';
            case 'error':
                return 'red';
            case 'waiting':
                return 'yellow';
            default:
                return 'gray';
        }
    };
    var getStatusIcon = function () {
        switch (data.status) {
            case 'running':
                return FiPlay;
            case 'completed':
                return FiCheckCircle;
            case 'error':
                return FiAlertCircle;
            case 'waiting':
                return FiPause;
            default:
                return FiCpu;
        }
    };
    return (_jsxs(Card, { bg: "purple.50", borderColor: selected ? 'purple.500' : 'purple.200', borderWidth: selected ? 3 : 2, boxShadow: selected ? 'lg' : 'md', minW: "200px", maxW: "300px", children: [_jsx(Handle, { type: "target", position: Position.Top, style: { background: '#805AD5' } }), _jsx(CardBody, { p: 3, children: _jsxs(VStack, { spacing: 2, align: "stretch", children: [_jsxs(HStack, { children: [_jsx(Avatar, { size: "xs", bg: "purple.500", icon: _jsx(Icon, { as: FiCpu }) }), _jsxs(VStack, { align: "start", spacing: 0, flex: 1, children: [_jsx(Text, { fontSize: "sm", fontWeight: "bold", color: "purple.900", children: data.label }), data.agentName && (_jsxs(Text, { fontSize: "xs", color: "purple.600", children: ["Agent: ", data.agentName] }))] }), data.status && (_jsx(Tooltip, { label: data.status, children: _jsx(Icon, { as: getStatusIcon(), color: "".concat(getStatusColor(), ".500") }) }))] }), data.description && (_jsx(Text, { fontSize: "xs", color: "gray.600", noOfLines: 2, children: data.description })), data.status === 'running' && data.progress !== undefined && (_jsxs(Box, { children: [_jsxs(HStack, { justify: "space-between", mb: 1, children: [_jsx(Text, { fontSize: "xs", color: "gray.600", children: "Progress" }), _jsxs(Text, { fontSize: "xs", color: "gray.600", children: [data.progress, "%"] })] }), _jsx(Progress, { value: data.progress, size: "xs", colorScheme: getStatusColor(), borderRadius: "full" })] })), data.estimatedTime && (_jsxs(HStack, { children: [_jsx(Icon, { as: FiClock, color: "gray.500", boxSize: 3 }), _jsxs(Text, { fontSize: "xs", color: "gray.600", children: ["~", data.estimatedTime, "min"] })] }))] }) }), _jsx(Handle, { type: "source", position: Position.Bottom, style: { background: '#805AD5' } })] }));
};
// Conditional Logic Node
export var ConditionalNode = function (_a) {
    var data = _a.data, selected = _a.selected;
    return (_jsxs(Card, { bg: "orange.50", borderColor: selected ? 'orange.500' : 'orange.200', borderWidth: selected ? 3 : 2, boxShadow: selected ? 'lg' : 'md', minW: "180px", style: { position: 'relative' }, children: [_jsx(Handle, { type: "target", position: Position.Top, style: { background: '#DD6B20' } }), _jsx(CardBody, { p: 3, children: _jsxs(VStack, { spacing: 2, children: [_jsx(Icon, { as: FiGitBranch, color: "orange.600", boxSize: 5 }), _jsx(Text, { fontSize: "sm", fontWeight: "bold", color: "orange.900", textAlign: "center", children: data.label }), data.condition && (_jsx(Badge, { colorScheme: "orange", fontSize: "xs", textAlign: "center", children: data.condition })), data.description && (_jsx(Text, { fontSize: "xs", color: "gray.600", textAlign: "center", noOfLines: 2, children: data.description }))] }) }), _jsx(Handle, { type: "source", position: Position.Right, id: "true", style: { background: '#48BB78', top: '30%' } }), _jsx(Text, { fontSize: "xs", position: "absolute", right: "-35px", top: "25%", color: "green.600", fontWeight: "bold", children: "True" }), _jsx(Handle, { type: "source", position: Position.Right, id: "false", style: { background: '#F56565', top: '70%' } }), _jsx(Text, { fontSize: "xs", position: "absolute", right: "-38px", top: "65%", color: "red.600", fontWeight: "bold", children: "False" })] }));
};
// Parallel Execution Node
export var ParallelNode = function (_a) {
    var data = _a.data, selected = _a.selected;
    return (_jsxs(Card, { bg: "cyan.50", borderColor: selected ? 'cyan.500' : 'cyan.200', borderWidth: selected ? 3 : 2, boxShadow: selected ? 'lg' : 'md', minW: "200px", children: [_jsx(Handle, { type: "target", position: Position.Top, style: { background: '#0BC5EA' } }), _jsx(CardBody, { p: 3, children: _jsxs(VStack, { spacing: 2, children: [_jsx(Icon, { as: FiGrid, color: "cyan.600", boxSize: 5 }), _jsx(Text, { fontSize: "sm", fontWeight: "bold", color: "cyan.900", textAlign: "center", children: data.label }), data.parallelTasks && (_jsxs(Badge, { colorScheme: "cyan", children: [data.parallelTasks, " parallel tasks"] })), data.description && (_jsx(Text, { fontSize: "xs", color: "gray.600", textAlign: "center", noOfLines: 2, children: data.description })), data.status === 'running' && (_jsxs(HStack, { spacing: 1, children: [_jsx(Box, { w: "8px", h: "8px", borderRadius: "full", bg: "cyan.500" }), _jsx(Text, { fontSize: "xs", color: "cyan.600", children: "Executing in parallel" })] }))] }) }), _jsx(Handle, { type: "source", position: Position.Bottom, id: "output-1", style: { background: '#0BC5EA', left: '25%' } }), _jsx(Handle, { type: "source", position: Position.Bottom, id: "output-2", style: { background: '#0BC5EA', left: '50%' } }), _jsx(Handle, { type: "source", position: Position.Bottom, id: "output-3", style: { background: '#0BC5EA', left: '75%' } })] }));
};
// Human Approval Node
export var HumanApprovalNode = function (_a) {
    var data = _a.data, selected = _a.selected;
    return (_jsxs(Card, { bg: "pink.50", borderColor: selected ? 'pink.500' : 'pink.200', borderWidth: selected ? 3 : 2, boxShadow: selected ? 'lg' : 'md', minW: "200px", children: [_jsx(Handle, { type: "target", position: Position.Top, style: { background: '#D53F8C' } }), _jsx(CardBody, { p: 3, children: _jsxs(VStack, { spacing: 2, children: [_jsx(Icon, { as: FiUser, color: "pink.600", boxSize: 5 }), _jsx(Text, { fontSize: "sm", fontWeight: "bold", color: "pink.900", textAlign: "center", children: data.label }), data.approvers && (_jsxs(HStack, { children: [_jsx(Icon, { as: FiUsers, color: "pink.500", boxSize: 3 }), _jsxs(Text, { fontSize: "xs", color: "pink.600", children: [data.approvers, " approver(s)"] })] })), data.status === 'waiting' && (_jsx(Badge, { colorScheme: "yellow", fontSize: "xs", children: "Waiting for approval" })), data.status === 'completed' && (_jsx(Badge, { colorScheme: "green", fontSize: "xs", children: "\u2713 Approved" })), data.description && (_jsx(Text, { fontSize: "xs", color: "gray.600", textAlign: "center", noOfLines: 2, children: data.description }))] }) }), _jsx(Handle, { type: "source", position: Position.Bottom, style: { background: '#D53F8C' } })] }));
};
// Multi-Agent Coordination Node
export var MultiAgentNode = function (_a) {
    var data = _a.data, selected = _a.selected;
    return (_jsxs(Card, { bg: "teal.50", borderColor: selected ? 'teal.500' : 'teal.200', borderWidth: selected ? 3 : 2, boxShadow: selected ? 'lg' : 'md', minW: "220px", children: [_jsx(Handle, { type: "target", position: Position.Top, style: { background: '#319795' } }), _jsx(CardBody, { p: 3, children: _jsxs(VStack, { spacing: 2, children: [_jsx(Icon, { as: FiUsers, color: "teal.600", boxSize: 5 }), _jsx(Text, { fontSize: "sm", fontWeight: "bold", color: "teal.900", textAlign: "center", children: data.label }), data.agents && (_jsxs(HStack, { spacing: 1, flexWrap: "wrap", children: [data.agents.slice(0, 3).map(function (agent, idx) { return (_jsx(Badge, { colorScheme: "teal", fontSize: "xs", children: agent }, idx)); }), data.agents.length > 3 && (_jsxs(Badge, { colorScheme: "teal", fontSize: "xs", children: ["+", data.agents.length - 3] }))] })), data.description && (_jsx(Text, { fontSize: "xs", color: "gray.600", textAlign: "center", noOfLines: 2, children: data.description })), data.status === 'running' && data.activeAgent && (_jsxs(Text, { fontSize: "xs", color: "teal.600", children: ["Active: ", data.activeAgent] }))] }) }), _jsx(Handle, { type: "source", position: Position.Bottom, style: { background: '#319795' } })] }));
};
// Export all node types
export var enhancedNodeTypes = {
    agentTask: AgentTaskNode,
    conditional: ConditionalNode,
    parallel: ParallelNode,
    humanApproval: HumanApprovalNode,
    multiAgent: MultiAgentNode,
};
