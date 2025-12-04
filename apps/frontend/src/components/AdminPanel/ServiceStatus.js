import { jsx as _jsx } from "react/jsx-runtime";
import { Badge } from '@chakra-ui/react';
export var ServiceStatus = function (_a) {
    var status = _a.status;
    var colorScheme = {
        ACTIVE: 'green',
        INACTIVE: 'gray',
        MAINTENANCE: 'yellow',
        ERROR: 'red',
        PENDING: 'blue',
        PAUSED: 'orange'
    }[status] || 'gray';
    return (_jsx(Badge, { colorScheme: colorScheme, children: status.toLowerCase() }));
};
