"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const index_1 = require("../index");
const ChatComponent = () => {
    const { agents } = (0, index_1.useA2AAgents)();
    const { messages, sendMessage } = (0, index_1.useA2AMessages)();
    const handleSendMessage = () => {
        sendMessage({
            type: A2AMessageType.REQUEST,
            fromAgent: 'user',
            toAgent: 'assistant',
            payload: { text: 'Hello, how can you help me?' },
        });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "Available Agents" }), (0, jsx_runtime_1.jsx)("ul", { children: agents.map((agent) => ((0, jsx_runtime_1.jsxs)("li", { children: [agent.name, " - ", agent.isOnline ? 'Online' : 'Offline'] }, agent.agentId))) }), (0, jsx_runtime_1.jsx)("h2", { children: "Messages" }), (0, jsx_runtime_1.jsx)("div", { children: messages.map((message) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("strong", { children: [message.fromAgent, " \u2192 ", message.toAgent, ":"] }), (0, jsx_runtime_1.jsx)("pre", { children: JSON.stringify(message.payload, null, 2) })] }, message.id))) }), (0, jsx_runtime_1.jsx)("button", { onClick: handleSendMessage, children: "Send Test Message" })] }));
};
const ChatExample = () => {
    const config = { url: 'ws://localhost:8080', agentId: 'user' };
    return ((0, jsx_runtime_1.jsx)(index_1.A2AProvider, { config: config, children: (0, jsx_runtime_1.jsx)(ChatComponent, {}) }));
};
exports.default = ChatExample;
//# sourceMappingURL=ChatExample.js.map