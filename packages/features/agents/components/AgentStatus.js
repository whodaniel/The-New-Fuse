"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentStatus = void 0;
const AgentStatus = ({ agent }) => {
    const getStatusVariant = (status) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'secondary';
            case 'error':
                return 'destructive';
            default:
                return 'default';
        }
    };
    return variant = { getStatusVariant(agent) { }, : .status };
    className = "capitalize" >
        { agent, : .status }
        < /Badge>;
    ;
};
exports.AgentStatus = AgentStatus;
//# sourceMappingURL=AgentStatus.js.map
//# sourceMappingURL=AgentStatus.js.map