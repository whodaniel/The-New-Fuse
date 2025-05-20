export class MessageFactory {
    static createTextMessage(content, metadata) {
        return {
            id: crypto.randomUUID(),
            type: MessageType.TEXT,
            content,
            timestamp: Date.now(),
            metadata
        };
    }
    static createCodeMessage(content, language, fileName, metadata) {
        return {
            id: crypto.randomUUID(),
            type: MessageType.CODE,
            content,
            language,
            fileName,
            timestamp: Date.now(),
            metadata
        };
    }
    static createImageMessage(url, alt, dimensions, metadata) {
        return {
            id: crypto.randomUUID(),
            type: MessageType.IMAGE,
            url,
            alt,
            dimensions,
            timestamp: Date.now(),
            metadata
        };
    }
    static createFileMessage(url, name, size, mimeType, metadata) {
        return {
            id: crypto.randomUUID(),
            type: MessageType.FILE,
            url,
            name,
            size,
            mimeType,
            timestamp: Date.now(),
            metadata
        };
    }
    static createSystemMessage(content, level = 'info', metadata) {
        return {
            id: crypto.randomUUID(),
            type: MessageType.SYSTEM,
            content,
            level,
            timestamp: Date.now(),
            metadata
        };
    }
}
//# sourceMappingURL=messageTypes.js.map