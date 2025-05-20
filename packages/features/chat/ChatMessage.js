"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = void 0;
var react_1 = require("react");
var ChatMessage = function (_a) {
    var message = _a.message, isCurrentUser = _a.isCurrentUser;
    var renderAttachments = function () {
        var _a;
        if (!((_a = message.attachments) === null || _a === void 0 ? void 0 : _a.length))
            return null;
        return className = "mt-2 space-y-2" >
            { message, : .attachments.map(function (attachment) {
                    var isImage = attachment.type.startsWith('image/');
                    if (isImage) {
                        return key = { attachment, : .id };
                        className = "relative" >
                            src;
                        {
                            attachment.url;
                        }
                        alt = { attachment, : .name };
                        className = "max-w-xs rounded-lg" /  >
                            className;
                        "absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg" >
                            { attachment, : .name }
                            < /div>
                            < /div>;
                    }
                })
            };
        return key = { attachment, : .id };
        href = { attachment, : .url };
        target = "_blank";
        rel = "noopener noreferrer";
        className = "block p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" >
            className;
        "flex items-center space-x-2" >
            className;
        "w-4 h-4 text-gray-500";
        fill = "none";
        stroke = "currentColor";
        viewBox = "0 0 24 24" >
            strokeLinecap;
        "round";
        strokeLinejoin = "round";
        strokeWidth = { 2:  };
        d = "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /  >
            /svg>
            < span;
        className = "text-sm font-medium" > { attachment, : .name } < /span>
            < span;
        className = "text-xs text-gray-500" >
            {}(attachment.size / 1024).toFixed(1);
    }, KB;
    /span>
        < /div>
        < /a>;
    ;
};
/div>;
;
;
return className = { "flex ": .concat(isCurrentUser ? 'justify-end' : 'justify-start', " mb-4") } >
    className;
{
    "max-w-lg ".concat(isCurrentUser
        ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg'
        : 'bg-gray-100 text-gray-900 rounded-r-lg rounded-tl-lg', " px-4 py-2 shadow-sm");
}
 >
    { message, : .type === 'code' ? className = "text-sm font-mono whitespace-pre-wrap" >
            { message, : .content }
            < /pre>) : (<p className="text-sm whitespace-pre-wrap">{message.content}</p >  :  };
{
    renderAttachments();
}
className;
{
    "text-xs mt-1 ".concat(isCurrentUser ? 'text-blue-200' : 'text-gray-500');
}
 >
    { new: Date(message.timestamp).toLocaleTimeString() }
    < /div>
    < /div>
    < /div>;
;
;
exports.ChatMessage = ChatMessage;
//# sourceMappingURL=ChatMessage.js.map