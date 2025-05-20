export {}
exports.createSocketPayload = exports.formatTimestamp = exports.validateMessage = exports.getAgentStatusColor = exports.getAgentNameById = exports.createUserMessage = exports.mapMessageResponseToMessage = void 0;
const mapMessageResponseToMessage = (msg): any => ({
    id: msg.id.toString(),
    sender: msg.is_bot ? 'Bot' : 'User',
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    agentId: msg.agentId
});
exports.mapMessageResponseToMessage = mapMessageResponseToMessage;
const createUserMessage = (content, agentId): any => ({
    id: Math.random().toString(36).substr(2, 9),
    sender: 'User',
    content: content.trim(),
    timestamp: new Date(),
    agentId
});
exports.createUserMessage = createUserMessage;
const getAgentNameById = (agents, agentId): any => {
    var _a;
    return ((_a = agents.find(a => a.id === agentId)) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown Agent';
};
exports.getAgentNameById = getAgentNameById;
const getAgentStatusColor = (status): any => {
    switch (status) {
        case 'active':
            return 'bg-green-500';
        case 'busy':
            return 'bg-yellow-500';
        default:
            return 'bg-red-500';
    }
};
exports.getAgentStatusColor = getAgentStatusColor;
const validateMessage = (content): any => {
    return content.trim().length > 0;
};
exports.validateMessage = validateMessage;
const formatTimestamp = (date): any => {
    return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};
exports.formatTimestamp = formatTimestamp;
const createSocketPayload = (message, conversationId): any => (Object.assign(Object.assign({}, message), { conversationId }));
exports.createSocketPayload = createSocketPayload;
export {};
//# sourceMappingURL=message-utils.js.map