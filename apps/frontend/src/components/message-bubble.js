import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBubble = MessageBubble;
import message_utils_1 from '../utils/message-utils';
function MessageBubble(_a) {
    var message = _a.message, agents = _a.agents;
    var isUserMessage = message.sender === 'User';
    return (_jsxs("div", { className: "flex flex-col ".concat(isUserMessage ? 'items-end' : 'items-start'), children: [_jsx("div", { className: "max-w-[80%] rounded-lg p-3 ".concat(isUserMessage
                    ? 'bg-blue-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800'), children: _jsx("p", { className: "break-words", children: message.content }) }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx("span", { className: "text-xs text-neutral-500", children: (0, message_utils_1.formatTimestamp)(message.timestamp) }), message.agentId && (_jsxs("span", { className: "text-xs text-neutral-500", children: ["via ", (0, message_utils_1.getAgentNameById)(agents, message.agentId)] }))] })] }));
}
