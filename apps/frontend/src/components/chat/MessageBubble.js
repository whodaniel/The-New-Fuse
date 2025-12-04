import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
export var MessageBubble = function (_a) {
    var _b, _c, _d;
    var message = _a.message, className = _a.className;
    var isAgent = message.sender === 'agent';
    var renderContent = function () {
        switch (message.type) {
            case 'code':
                return (_jsx("pre", { className: "bg-gray-100 p-3 rounded-md overflow-x-auto", children: _jsx("code", { children: message.content }) }));
            case 'image':
                return (_jsx("img", { src: message.content, alt: "Message attachment", className: "max-w-sm rounded-md" }));
            default:
                return _jsx("p", { className: "text-sm", children: message.content });
        }
    };
    return (_jsxs("div", { className: cn('flex gap-3', isAgent ? 'flex-row' : 'flex-row-reverse', className), children: [_jsxs(Avatar, { className: "h-8 w-8", children: [_jsx(AvatarImage, { src: (_b = message.metadata) === null || _b === void 0 ? void 0 : _b.avatar }), _jsx(AvatarFallback, { children: ((_d = (_c = message.metadata) === null || _c === void 0 ? void 0 : _c.name) === null || _d === void 0 ? void 0 : _d[0]) || (isAgent ? 'A' : 'U') })] }), _jsxs("div", { className: cn('max-w-md rounded-lg p-4', isAgent
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-blue-600 text-white ml-auto'), children: [renderContent(), _jsx("time", { className: "text-xs opacity-50 mt-1 block", children: new Date(message.timestamp).toLocaleTimeString() })] })] }));
};
