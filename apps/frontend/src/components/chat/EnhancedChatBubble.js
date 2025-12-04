import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedChatBubble = EnhancedChatBubble;
import message_utils_1 from '../../utils/message-utils';
import ui_1 from '../ui';
function EnhancedChatBubble(_a) {
    var message = _a.message, agents = _a.agents, workspace = _a.workspace;
    var isUser = message.sender.type === 'user';
    var agent = message.metadata.agentId
        ? agents.find(function (a) { return a.id === message.metadata.agentId; })
        : null;
    return (_jsx("div", { className: "flex justify-center items-end w-full bg-theme-bg-secondary", children: _jsx("div", { className: "py-4 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col ".concat(isUser ? 'items-end' : 'items-start'), children: _jsxs("div", { className: "flex gap-x-5 ".concat(isUser ? 'flex-row-reverse' : 'flex-row'), children: [_jsx(ui_1.UserIcon, { user: message.sender, role: message.sender.type }), _jsxs("div", { className: "flex flex-col ".concat(isUser ? 'items-end' : 'items-start'), children: [_jsx("div", { className: "rounded-lg p-3 ".concat(isUser
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-neutral-100 dark:bg-neutral-800'), children: _jsx("span", { className: "whitespace-pre-line font-normal text-sm", children: message.content }) }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx("span", { className: "text-xs text-neutral-500", children: (0, message_utils_1.formatTimestamp)(message.timestamp) }), agent && (_jsxs("span", { className: "text-xs text-neutral-500", children: ["via ", agent.name] }))] })] })] }) }) }));
}
