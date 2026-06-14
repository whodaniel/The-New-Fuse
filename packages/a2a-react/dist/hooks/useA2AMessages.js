"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useA2AMessages = useA2AMessages;
const a2a_core_1 = require("@the-new-fuse/a2a-core");
const react_1 = require("react");
const A2AProvider_js_1 = require("../A2AProvider.js");
function useA2AMessages() {
    const { messages, sendMessage: contextSendMessage } = (0, A2AProvider_js_1.useA2AContext)();
    const sendMessage = (0, react_1.useCallback)(async (message) => {
        return contextSendMessage(message);
    }, [contextSendMessage]);
    const sendRequest = (0, react_1.useCallback)(async (request) => {
        return contextSendMessage({
            type: a2a_core_1.A2AMessageType.REQUEST,
            payload: request,
            timestamp: Date.now(),
            priority: a2a_core_1.A2APriority.MEDIUM,
        });
    }, [contextSendMessage]);
    const broadcast = (0, react_1.useCallback)(async (payload, options) => {
        return contextSendMessage({
            type: a2a_core_1.A2AMessageType.NOTIFICATION,
            payload,
            priority: a2a_core_1.A2APriority.MEDIUM,
            timestamp: Date.now(),
            ...options,
        });
    }, [contextSendMessage]);
    return {
        messages,
        sendMessage,
        sendRequest,
        broadcast,
    };
}
//# sourceMappingURL=useA2AMessages.js.map