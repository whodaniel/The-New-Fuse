export var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["COMMAND"] = "command";
    MessageType["COMMAND_RESULT"] = "command_result";
    MessageType["TASK_RESULT"] = "task_result";
    MessageType["EVENT"] = "event";
    MessageType["ERROR"] = "error";
    MessageType["STATUS"] = "status";
    MessageType["RESPONSE"] = "response";
    MessageType["NOTIFICATION"] = "notification";
    MessageType["TASK_ASSIGNMENT"] = "task_assignment";
})(MessageType || (MessageType = {}));
//# sourceMappingURL=message.js.map