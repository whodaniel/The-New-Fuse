"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useA2AConversations = useA2AConversations;
const a2a_core_1 = require("@the-new-fuse/a2a-core");
const react_1 = require("react");
const A2AProvider_js_1 = require("../A2AProvider.js");
function useA2AConversations() {
    const { sendMessage } = (0, A2AProvider_js_1.useA2AContext)();
    const [conversations, setConversations] = (0, react_1.useState)([]);
    const joinConversation = (0, react_1.useCallback)(async (conversationId) => {
        if (sendMessage) {
            await sendMessage({
                type: a2a_core_1.A2AMessageType.REQUEST,
                payload: { action: 'join_conversation', conversationId },
            });
        }
    }, [sendMessage]);
    const leaveConversation = (0, react_1.useCallback)(async (conversationId) => {
        if (sendMessage) {
            await sendMessage({
                type: a2a_core_1.A2AMessageType.REQUEST,
                payload: { action: 'leave_conversation', conversationId },
            });
        }
    }, [sendMessage]);
    return {
        conversations,
        joinConversation,
        leaveConversation,
    };
}
//# sourceMappingURL=useA2AConversations.js.map