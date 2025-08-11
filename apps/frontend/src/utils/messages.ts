export {}
exports.MessageBuilder = exports.MessageThread = exports.ContentType = exports.MessageRole = void 0;
exports.createTool = createTool;

export enum MessageRole {
    SYSTEM = "system",
    USER = "user",
    ASSISTANT = "assistant",
    TOOL = "tool"
}

export enum ContentType {
    TEXT = "text",
    JSON = "json",
    CODE = "code",
    TOOL_USE = "tool_use",
    TOOL_RESULT = "tool_result"
}
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
