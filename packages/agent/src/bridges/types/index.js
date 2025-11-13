"use strict";
/**
 * Type definitions for bridge communications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BridgeEvent = void 0;
var BridgeEvent;
(function (BridgeEvent) {
    BridgeEvent["CONNECT"] = "connect";
    BridgeEvent["DISCONNECT"] = "disconnect";
    BridgeEvent["MESSAGE"] = "message";
    BridgeEvent["ERROR"] = "error";
    BridgeEvent["RECONNECT"] = "reconnect";
})(BridgeEvent || (exports.BridgeEvent = BridgeEvent = {}));
//# sourceMappingURL=index.js.map