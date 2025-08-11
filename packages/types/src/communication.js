export var MessageType;
(function (MessageType) {
    MessageType["COMMAND"] = "COMMAND";
    MessageType["RESPONSE"] = "RESPONSE";
    MessageType["ERROR"] = "ERROR";
    MessageType["EVENT"] = "EVENT";
    MessageType["NOTIFICATION"] = "NOTIFICATION";
    MessageType["REQUEST"] = "REQUEST";
    MessageType["STATUS"] = "STATUS";
    MessageType["LOG"] = "LOG";
    MessageType["METRIC"] = "METRIC";
    MessageType["ALERT"] = "ALERT";
    MessageType["HEARTBEAT"] = "HEARTBEAT";
})(MessageType || (MessageType = {}));
export class WebSocketError extends Error {
    code;
    timestamp;
    constructor(message, code) {
        super(message);
        this.name = 'WebSocketError';
        this.code = code;
        this.timestamp = new Date();
    }
}
//# sourceMappingURL=communication.js.map