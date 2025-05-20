export {}
exports.MessageBuilder = exports.MessageThread = exports.ContentType = exports.MessageRole = void 0;
exports.createTool = createTool;
var MessageRole;
(function (MessageRole): any {
    MessageRole["SYSTEM"] = "system";
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
    MessageRole["TOOL"] = "tool";
})(MessageRole || (exports.MessageRole = MessageRole = {}));
var ContentType;
(function (ContentType): any {
    ContentType["TEXT"] = "text";
    ContentType["JSON"] = "json";
    ContentType["CODE"] = "code";
    ContentType["TOOL_USE"] = "tool_use";
    ContentType["TOOL_RESULT"] = "tool_result";
})(ContentType || (exports.ContentType = ContentType = {}));
class MessageThread {
    constructor() {
        this.messages = [];
    }
    addMessage(message) {
        this.messages.push(message);
    }
    getMessages() {
        return [...this.messages];
    }
    clear() {
        this.messages = [];
    }
}
exports.MessageThread = MessageThread;
class MessageBuilder {
    static createMessage(role, content, metadata, tool_uses) {
        return {
            id: crypto.randomUUID(),
            role,
            content,
            content_type: typeof content === 'string' ? ContentType.TEXT : ContentType.JSON,
            metadata,
            tool_uses,
            timestamp: new Date().toISOString()
        };
    }
}
exports.MessageBuilder = MessageBuilder;
function createTool(name, description, properties): any {
    return {
        name,
        description,
        properties
    };
}
export {};
//# sourceMappingURL=messages.js.map