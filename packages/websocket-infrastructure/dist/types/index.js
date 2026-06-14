"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompressionAlgorithm = exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["BINARY"] = "binary";
    MessageType["JSON"] = "json";
    MessageType["COMPRESSED"] = "compressed";
})(MessageType || (exports.MessageType = MessageType = {}));
var CompressionAlgorithm;
(function (CompressionAlgorithm) {
    CompressionAlgorithm["GZIP"] = "gzip";
    CompressionAlgorithm["DEFLATE"] = "deflate";
    CompressionAlgorithm["BROTLI"] = "brotli";
})(CompressionAlgorithm || (exports.CompressionAlgorithm = CompressionAlgorithm = {}));
