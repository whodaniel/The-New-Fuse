"use strict";
// packages/agent-protocol-bridge/src/adapters/PydanticToA2AAdapter.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PydanticToA2AAdapter = void 0;
class PydanticToA2AAdapter {
    adapt(pydanticMessage, fromAgentId, toAgentId) {
        if (!pydanticMessage.messages || pydanticMessage.messages.length === 0) {
            throw new Error('Invalid Pydantic message: messages array is empty or missing.');
        }
        const lastMessage = pydanticMessage.messages[pydanticMessage.messages.length - 1];
        // Basic chat message
        let payloadType = 'chat';
        let payloadData = {
            content: lastMessage.content,
        };
        // Handle tool calls
        if (pydanticMessage.tools && pydanticMessage.tools.length > 0) {
            payloadType = 'tool_call';
            payloadData = {
                tools: pydanticMessage.tools.map((tool) => ({
                    name: tool.function.name,
                    description: tool.function.description,
                    parameters: tool.function.parameters,
                })),
                // Include the original message content as context for the tool call
                context: lastMessage.content,
            };
        }
        // Handle response model
        if (pydanticMessage.response_model) {
            payloadType = 'structured_response_request';
            payloadData = {
                ...payloadData,
                response_schema: pydanticMessage.response_model.schema(),
            };
        }
        return {
            protocol: 'a2a',
            version: '2.0',
            from: fromAgentId,
            to: toAgentId,
            payload: {
                type: payloadType,
                data: payloadData,
            },
        };
    }
}
exports.PydanticToA2AAdapter = PydanticToA2AAdapter;
//# sourceMappingURL=PydanticToA2AAdapter.js.map