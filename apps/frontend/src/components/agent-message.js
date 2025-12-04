import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Card } from './ui/card';
import { cn } from '../lib/utils';
var AgentMessage = function (_a) {
    var agent = _a.agent, message = _a.message, isCurrentUser = _a.isCurrentUser;
    var messageClasses = cn('flex w-full max-w-md gap-2 p-4', isCurrentUser ? 'ml-auto flex-row-reverse' : 'mr-auto');
    var renderMessageContent = function () {
        var _a;
        switch (message.type) {
            case 'code':
                return (_jsx("pre", { className: "bg-gray-100 p-2 rounded-md overflow-x-auto", children: _jsx("code", { children: message.content }) }));
            case 'image':
                return (_jsx("img", { src: message.content, alt: ((_a = message.metadata) === null || _a === void 0 ? void 0 : _a.alt) || 'Message image', className: "max-w-full rounded-md" }));
            default:
                return _jsx("p", { className: "text-sm", children: message.content });
        }
    };
    return (_jsxs(Card, { className: messageClasses, children: [_jsx(Avatar, { className: "h-8 w-8", children: agent.avatar ? (_jsx(AvatarImage, { src: agent.avatar, alt: agent.name })) : (_jsx(AvatarFallback, { children: agent.name[0].toUpperCase() })) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "font-medium text-sm", children: agent.name }), _jsx("span", { className: "text-xs text-gray-500", children: new Date(message.timestamp).toLocaleTimeString() })] }), renderMessageContent()] })] }));
};
export default AgentMessage;
