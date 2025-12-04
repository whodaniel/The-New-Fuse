import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Table, Thead, Tbody, Tr, Th, Td, IconButton } from '@chakra-ui/react';
import { useServices } from '../../hooks/useServices';
export var ServiceMonitor = function () {
    var _a = useServices(), services = _a.services, restartService = _a.restartService;
    return (_jsx(Box, { overflowX: "auto", children: _jsxs(Table, { variant: "simple", children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Th, { children: "Service" }), _jsx(Th, { children: "Status" }), _jsx(Th, { children: "Uptime" }), _jsx(Th, { children: "Last Error" }), _jsx(Th, { children: "Actions" })] }) }), _jsx(Tbody, { children: services.map(function (service) { return (_jsxs(Tr, { children: [_jsx(Td, { children: service.name }), _jsx(Td, { children: _jsx(ServiceStatus, { status: service.status }) }), _jsx(Td, { children: service.uptime }), _jsx(Td, { children: service.lastError || '-' }), _jsx(Td, { children: _jsx(IconButton, { "aria-label": "Restart service", onClick: function () { return restartService(service.id); } }) })] }, service.id)); }) })] }) }));
};
