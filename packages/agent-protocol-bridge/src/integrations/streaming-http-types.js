"use strict";
/**
 * Streaming HTTP Integration Types
 *
 * Comprehensive type definitions for Streaming HTTP (e.g., long polling, server-sent events over HTTP)
 * integration with The New Fuse AI Agent framework.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingHttpConnectionStatus = void 0;
// Status of a streaming HTTP connection
var StreamingHttpConnectionStatus;
(function (StreamingHttpConnectionStatus) {
    StreamingHttpConnectionStatus["CONNECTING"] = "CONNECTING";
    StreamingHttpConnectionStatus["OPEN"] = "OPEN";
    StreamingHttpConnectionStatus["CLOSED"] = "CLOSED";
    StreamingHttpConnectionStatus["ERROR"] = "ERROR";
    StreamingHttpConnectionStatus["RECONNECTING"] = "RECONNECTING";
})(StreamingHttpConnectionStatus || (exports.StreamingHttpConnectionStatus = StreamingHttpConnectionStatus = {}));
//# sourceMappingURL=streaming-http-types.js.map