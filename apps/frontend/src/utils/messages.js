var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.MessageBuilder = exports.MessageThread = exports.ContentType = exports.MessageRole = void 0;
exports.createTool = createTool;
export var MessageRole;
(function (MessageRole) {
    MessageRole["SYSTEM"] = "system";
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
    MessageRole["TOOL"] = "tool";
})(MessageRole || (MessageRole = {}));
export var ContentType;
(function (ContentType) {
    ContentType["TEXT"] = "text";
    ContentType["JSON"] = "json";
    ContentType["CODE"] = "code";
    ContentType["TOOL_USE"] = "tool_use";
    ContentType["TOOL_RESULT"] = "tool_result";
})(ContentType || (ContentType = {}));
var MessageThread = /** @class */ (function () {
    function MessageThread() {
        this.messages = [];
    }
    MessageThread.prototype.addMessage = function (message) {
        this.messages.push(message);
    };
    MessageThread.prototype.getMessages = function () {
        return __spreadArray([], this.messages, true);
    };
    MessageThread.prototype.clear = function () {
        this.messages = [];
    };
    return MessageThread;
}());
exports.MessageThread = MessageThread;
var MessageBuilder = /** @class */ (function () {
    function MessageBuilder() {
    }
    MessageBuilder.createMessage = function (role, content, metadata, tool_uses) {
        return {
            id: crypto.randomUUID(),
            role: role,
            content: content,
            content_type: typeof content === 'string' ? ContentType.TEXT : ContentType.JSON,
            metadata: metadata,
            tool_uses: tool_uses,
            timestamp: new Date().toISOString()
        };
    };
    return MessageBuilder;
}());
exports.MessageBuilder = MessageBuilder;
function createTool(name, description, properties) {
    return {
        name: name,
        description: description,
        properties: properties
    };
}
