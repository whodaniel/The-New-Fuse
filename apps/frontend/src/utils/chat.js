// Chat utility functions and constants
var _a;
export var ABORT_STREAM_EVENT = 'abort-stream';
export var chatPrompt = {
    defaultPrompt: 'How can I help you today?',
    systemPrompt: 'You are a helpful assistant.',
    maxLength: 4000
};
export var RefusalType;
(function (RefusalType) {
    RefusalType["DEFAULT"] = "default";
    RefusalType["OFFENSIVE"] = "offensive";
    RefusalType["UNSAFE"] = "unsafe";
    RefusalType["UNAUTHORIZED"] = "unauthorized";
})(RefusalType || (RefusalType = {}));
export var chatQueryRefusalResponses = (_a = {},
    _a[RefusalType.DEFAULT] = 'I apologize, but I cannot process that request.',
    _a[RefusalType.OFFENSIVE] = 'I cannot engage with offensive content.',
    _a[RefusalType.UNSAFE] = 'I cannot perform unsafe or harmful actions.',
    _a[RefusalType.UNAUTHORIZED] = 'I cannot access unauthorized information.',
    _a);
export var formatChatMessage = function (message, type) {
    return "".concat(type === 'user' ? '👤' : '🤖', " ").concat(message);
};
export var validateChatInput = function (input) {
    return input.trim().length > 0 && input.length <= chatPrompt.maxLength;
};
