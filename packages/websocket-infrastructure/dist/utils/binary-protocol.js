"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolNegotiator = exports.MessageSerializer = exports.BinaryProtocol = void 0;
const common_1 = require("@nestjs/common");
const msgpack = __importStar(require("msgpack-lite"));
const index_js_1 = require("../types/index.js");
class BinaryProtocol {
    static logger = new common_1.Logger(BinaryProtocol.name);
    static encode(data) {
        try {
            return msgpack.encode(data);
        }
        catch (error) {
            this.logger.error(`Binary encoding failed: ${error}`);
            throw error;
        }
    }
    static decode(buffer) {
        try {
            return msgpack.decode(buffer);
        }
        catch (error) {
            this.logger.error(`Binary decoding failed: ${error}`);
            throw error;
        }
    }
    static isBinary(data) {
        return Buffer.isBuffer(data) || data instanceof ArrayBuffer || data instanceof Uint8Array;
    }
    static toBuffer(data) {
        if (Buffer.isBuffer(data)) {
            return data;
        }
        if (data instanceof ArrayBuffer) {
            return Buffer.from(data);
        }
        if (data instanceof Uint8Array) {
            return Buffer.from(data);
        }
        throw new Error('Data is not binary');
    }
    static getSize(data) {
        if (this.isBinary(data)) {
            return this.toBuffer(data).length;
        }
        return Buffer.from(JSON.stringify(data)).length;
    }
    static compareWithJSON(data) {
        const binarySize = this.encode(data).length;
        const jsonSize = Buffer.from(JSON.stringify(data)).length;
        const ratio = (1 - binarySize / jsonSize) * 100;
        return {
            binarySize,
            jsonSize,
            ratio,
            recommendation: binarySize < jsonSize ? 'binary' : 'json',
        };
    }
}
exports.BinaryProtocol = BinaryProtocol;
class MessageSerializer {
    static logger = new common_1.Logger(MessageSerializer.name);
    static serialize(data, preferBinary = false) {
        if (BinaryProtocol.isBinary(data)) {
            return {
                data: BinaryProtocol.toBuffer(data),
                type: index_js_1.MessageType.BINARY,
            };
        }
        if (typeof data === 'object' && data !== null) {
            if (preferBinary) {
                try {
                    const binary = BinaryProtocol.encode(data);
                    const json = JSON.stringify(data);
                    if (binary.length < json.length * 0.9) {
                        this.logger.debug(`Using binary format (${binary.length} bytes vs ${json.length} bytes)`);
                        return {
                            data: binary,
                            type: index_js_1.MessageType.BINARY,
                        };
                    }
                }
                catch (error) {
                    this.logger.warn(`Binary encoding failed, falling back to JSON: ${error}`);
                }
            }
            return {
                data: JSON.stringify(data),
                type: index_js_1.MessageType.JSON,
            };
        }
        return {
            data: String(data),
            type: index_js_1.MessageType.TEXT,
        };
    }
    static deserialize(data, type) {
        try {
            switch (type) {
                case index_js_1.MessageType.BINARY:
                    return BinaryProtocol.decode(typeof data === 'string' ? Buffer.from(data) : data);
                case index_js_1.MessageType.JSON:
                    return JSON.parse(typeof data === 'string' ? data : data.toString());
                case index_js_1.MessageType.TEXT:
                    return typeof data === 'string' ? data : data.toString();
                default:
                    throw new Error(`Unsupported message type: ${type}`);
            }
        }
        catch (error) {
            this.logger.error(`Deserialization failed: ${error}`);
            throw error;
        }
    }
}
exports.MessageSerializer = MessageSerializer;
class ProtocolNegotiator {
    static logger = new common_1.Logger(ProtocolNegotiator.name);
    supportedProtocols = new Set(['json', 'binary', 'msgpack']);
    negotiate(clientProtocols) {
        const priorities = ['msgpack', 'binary', 'json'];
        for (const protocol of priorities) {
            if (clientProtocols.includes(protocol) && this.supportedProtocols.has(protocol)) {
                ProtocolNegotiator.logger.log(`Negotiated protocol: ${protocol}`);
                return protocol;
            }
        }
        ProtocolNegotiator.logger.log('No common protocol found, defaulting to JSON');
        return 'json';
    }
    addProtocol(protocol) {
        this.supportedProtocols.add(protocol);
    }
    removeProtocol(protocol) {
        this.supportedProtocols.delete(protocol);
    }
    isSupported(protocol) {
        return this.supportedProtocols.has(protocol);
    }
}
exports.ProtocolNegotiator = ProtocolNegotiator;
