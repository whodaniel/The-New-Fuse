export {}
exports.transformApiMessage = void 0;
const transformApiMessage = (message): any => ({
    id: message.id.toString(),
    sender: message.sender,
    content: message.content,
    timestamp: new Date(message.timestamp),
    agentId: message.agentId,
});
exports.transformApiMessage = transformApiMessage;
export {};
//# sourceMappingURL=types.js.map