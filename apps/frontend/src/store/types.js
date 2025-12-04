// Store types and transformers
export var transformApiMessage = function (message) { return ({
    id: message.id.toString(),
    sender: message.sender,
    content: message.content,
    timestamp: new Date(message.timestamp),
    agentId: message.agentId,
}); };
