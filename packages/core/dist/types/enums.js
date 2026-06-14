// Message related enums
export var MessageRole;
(function (MessageRole) {
    MessageRole["USER"] = "USER";
    MessageRole["SYSTEM"] = "SYSTEM";
    MessageRole["ASSISTANT"] = "ASSISTANT";
    MessageRole["TOOL"] = "TOOL";
    MessageRole["FUNCTION"] = "FUNCTION";
})(MessageRole || (MessageRole = {}));
export var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "TEXT";
    MessageType["SYSTEM"] = "SYSTEM";
    MessageType["IMAGE"] = "IMAGE";
    MessageType["VIDEO"] = "VIDEO";
    MessageType["AUDIO"] = "AUDIO";
    MessageType["FILE"] = "FILE";
    MessageType["COMMAND"] = "COMMAND";
    MessageType["STREAM"] = "STREAM";
    MessageType["CODE"] = "CODE";
    MessageType["MARKDOWN"] = "MARKDOWN";
})(MessageType || (MessageType = {}));
export var MessageStatus;
(function (MessageStatus) {
    MessageStatus["PENDING"] = "PENDING";
    MessageStatus["DELIVERED"] = "DELIVERED";
    MessageStatus["ERROR"] = "ERROR";
    MessageStatus["SENT"] = "SENT";
    MessageStatus["READ"] = "READ";
    MessageStatus["FAILED"] = "FAILED";
})(MessageStatus || (MessageStatus = {}));
// Verification levels
export var VerificationLevel;
(function (VerificationLevel) {
    VerificationLevel["NONE"] = "NONE";
    VerificationLevel["LOW"] = "LOW";
    VerificationLevel["MEDIUM"] = "MEDIUM";
    VerificationLevel["HIGH"] = "HIGH";
})(VerificationLevel || (VerificationLevel = {}));
export var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "ERROR";
    LogLevel["WARN"] = "WARN";
    LogLevel["INFO"] = "INFO";
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["TRACE"] = "TRACE";
})(LogLevel || (LogLevel = {}));
//# sourceMappingURL=enums.js.map