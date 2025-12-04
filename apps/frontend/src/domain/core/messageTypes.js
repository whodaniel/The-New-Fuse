var MessageFactory = /** @class */ (function () {
    function MessageFactory() {
    }
    MessageFactory.createTextMessage = function (content, metadata) {
        return {
            id: crypto.randomUUID(),
            type: MessageType.TEXT,
            content: content,
            timestamp: Date.now(),
            metadata: metadata
        };
    };
    MessageFactory.createCodeMessage = function (content, language, fileName, metadata) {
        return {
            id: crypto.randomUUID(),
            type: MessageType.CODE,
            content: content,
            language: language,
            fileName: fileName,
            timestamp: Date.now(),
            metadata: metadata
        };
    };
    MessageFactory.createImageMessage = function (url, alt, dimensions, metadata) {
        return {
            id: crypto.randomUUID(),
            type: MessageType.IMAGE,
            url: url,
            alt: alt,
            dimensions: dimensions,
            timestamp: Date.now(),
            metadata: metadata
        };
    };
    MessageFactory.createFileMessage = function (url, name, size, mimeType, metadata) {
        return {
            id: crypto.randomUUID(),
            type: MessageType.FILE,
            url: url,
            name: name,
            size: size,
            mimeType: mimeType,
            timestamp: Date.now(),
            metadata: metadata
        };
    };
    MessageFactory.createSystemMessage = function (content, level, metadata) {
        if (level === void 0) { level = 'info'; }
        return {
            id: crypto.randomUUID(),
            type: MessageType.SYSTEM,
            content: content,
            level: level,
            timestamp: Date.now(),
            metadata: metadata
        };
    };
    return MessageFactory;
}());
export { MessageFactory };
