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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Table, Thead, Tbody, Tr, Th, Td, Select, Input, HStack } from '@chakra-ui/react';
import { useAuditLogs } from '../../hooks/useAuditLogs';
export var AuditLogs = function () {
    var _a = useAuditLogs(), logs = _a.logs, filters = _a.filters, setFilters = _a.setFilters, loading = _a.loading;
    return (_jsxs(Box, { children: [_jsxs(HStack, { mb: 4, children: [_jsxs(Select, { value: filters.type, onChange: function (e) { return setFilters(__assign(__assign({}, filters), { type: e.target.value })); }, children: [_jsx("option", { value: "", children: "All Types" }), _jsx("option", { value: "user", children: "User" }), _jsx("option", { value: "system", children: "System" }), _jsx("option", { value: "security", children: "Security" })] }), _jsx(Input, { placeholder: "Search logs...", value: filters.search, onChange: function (e) { return setFilters(__assign(__assign({}, filters), { search: e.target.value })); } })] }), _jsxs(Table, { children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Th, { children: "Timestamp" }), _jsx(Th, { children: "Type" }), _jsx(Th, { children: "User" }), _jsx(Th, { children: "Action" }), _jsx(Th, { children: "Details" })] }) }), _jsx(Tbody, { children: logs.map(function (log) { return (_jsxs(Tr, { children: [_jsx(Td, { children: log.timestamp }), _jsx(Td, { children: log.type }), _jsx(Td, { children: log.user }), _jsx(Td, { children: log.action }), _jsx(Td, { children: log.details })] }, log.id)); }) })] })] }));
};
