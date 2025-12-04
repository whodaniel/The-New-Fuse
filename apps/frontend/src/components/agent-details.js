import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { VStack, HStack, Text, Box, } from '@chakra-ui/layout';
import { Avatar } from '@chakra-ui/avatar';
import { Progress } from '@chakra-ui/progress';
var AgentDetails = function (_a) {
    var name = _a.name, status = _a.status, avatar = _a.avatar, performance = _a.performance, capabilities = _a.capabilities, model = _a.model;
    var getStatusColor = function (status) {
        switch (status.toLowerCase()) {
            case 'active':
                return 'green.500';
            case 'idle':
                return 'yellow.500';
            case 'offline':
                return 'gray.500';
            default:
                return 'gray.500';
        }
    };
    var getPerformanceColor = function (performance) {
        if (performance >= 80)
            return 'green';
        if (performance >= 60)
            return 'yellow';
        return 'red';
    };
    return (_jsxs(VStack, { gap: 4, alignItems: "stretch", children: [_jsxs(HStack, { gap: 4, children: [_jsx(Avatar, { size: "lg", name: name, src: avatar }), _jsxs(VStack, { alignItems: "flex-start", gap: 1, children: [_jsx(Text, { fontWeight: "bold", fontSize: "lg", children: name }), _jsx(Text, { color: getStatusColor(status), fontSize: "sm", children: status })] })] }), _jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", mb: 1, children: "Performance" }), _jsx(Progress, { value: performance, colorScheme: getPerformanceColor(performance), size: "sm", borderRadius: "full" })] }), _jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", mb: 2, children: "Capabilities" }), _jsx(HStack, { flexWrap: "wrap", gap: 2, children: capabilities.map(function (capability) { return (_jsx(Text, { fontSize: "xs", bg: "gray.100", px: 2, py: 1, borderRadius: "full", children: capability }, capability)); }) })] }), _jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", mb: 1, children: "Model" }), _jsx(Text, { fontSize: "xs", color: "gray.600", children: model })] })] }));
};
export default AgentDetails;
