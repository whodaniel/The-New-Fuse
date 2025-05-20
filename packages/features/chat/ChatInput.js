"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2)
        for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar)
                    ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatInput = void 0;
var react_1 = require("react");
var Button_1 = require("../../core/components/ui/Button");
var ChatInput = function (_a) {
    var onSend = _a.onSend, _b = _a.disabled, disabled = _b === void 0 ? false : _b, _c = _a.placeholder, placeholder = _c === void 0 ? 'Type a message...' : _c;
    var _d = (0, react_1.useState)(''), message = _d[0], setMessage = _d[1];
    var _e = (0, react_1.useState)([]), attachments = _e[0], setAttachments = _e[1];
    var fileInputRef = (0, react_1.useRef)(null);
    var handleSubmit = function (e) {
        e.preventDefault();
        if (message.trim() || attachments.length > 0) {
            onSend(message.trim(), attachments);
            setMessage('');
            setAttachments([]);
        }
    };
    var handleKeyPress = function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };
    var handleFileChange = function (e) {
        var files = Array.from(e.target.files || []);
        setAttachments(function (prev) { return __spreadArray(__spreadArray([], prev, true), files, true); });
    };
    var removeAttachment = function (index) {
        setAttachments(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
    };
    return className = "border-t border-gray-200 bg-white p-4" >
        { attachments, : .length > 0 && className, "mb-2 flex flex-wrap gap-2":  >
                { attachments, : .map(function (file, index) {
                        return key = { index };
                        className = "flex items-center bg-gray-100 rounded-full px-3 py-1" >
                            className;
                        "text-sm truncate max-w-xs" > { file, : .name } < /span>
                            < button;
                        onClick = { function() { return removeAttachment(index); } };
                        className = "ml-2 text-gray-500 hover:text-gray-700" >
                        ;
                    }) } };
};
/button>
    < /div>;
;
/div>;
onSubmit;
{
    handleSubmit;
}
className = "flex items-end space-x-2" >
    className;
"flex-1" >
    value;
{
    message;
}
onChange = { function(e) { return setMessage(e.target.value); } };
onKeyPress = { handleKeyPress };
placeholder = { placeholder };
disabled = { disabled };
className = "w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500";
rows = { 1:  };
style = {};
{
    minHeight: '2.5rem',
        maxHeight;
    '10rem',
    ;
}
/>
    < /div>
    < input;
type = "file";
ref = { fileInputRef };
onChange = { handleFileChange };
multiple;
className = "hidden" /  >
    type;
"button";
variant = "outline";
onClick = { function() { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); } };
disabled = { disabled } >
    className;
"w-5 h-5";
fill = "none";
stroke = "currentColor";
viewBox = "0 0 24 24" >
    strokeLinecap;
"round";
strokeLinejoin = "round";
strokeWidth = { 2:  };
d = "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /  >
    /svg>
    < /Button_1.Button>
    < Button_1.Button;
type = "submit";
disabled = { disabled } || (!message.trim() && attachments.length === 0);
 >
    Send
    < /Button_1.Button>
    < /form>
    < /div>;
;
;
exports.ChatInput = ChatInput;
//# sourceMappingURL=ChatInput.js.map