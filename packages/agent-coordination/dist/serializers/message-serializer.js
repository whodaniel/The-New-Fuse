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
exports.MessageSerializer = void 0;
const msgpack = __importStar(require("msgpack-lite"));
const coordination_types_1 = require("../types/coordination.types");
/**
 * Message serializer for efficient data transmission
 */
class MessageSerializer {
    constructor(format = coordination_types_1.SerializationFormat.JSON) {
        this.format = format;
    }
    /**
     * Serialize data to string or buffer
     */
    serialize(data) {
        switch (this.format) {
            case coordination_types_1.SerializationFormat.MSGPACK:
                const buffer = msgpack.encode(data);
                return buffer.toString('base64');
            case coordination_types_1.SerializationFormat.JSON:
            default:
                return JSON.stringify(data);
        }
    }
    /**
     * Deserialize string or buffer to data
     */
    deserialize(serialized) {
        switch (this.format) {
            case coordination_types_1.SerializationFormat.MSGPACK:
                try {
                    const buffer = Buffer.from(serialized, 'base64');
                    return msgpack.decode(buffer);
                }
                catch (error) {
                    throw new Error(`Failed to deserialize MessagePack data: ${error}`);
                }
            case coordination_types_1.SerializationFormat.JSON:
            default:
                try {
                    return JSON.parse(serialized);
                }
                catch (error) {
                    throw new Error(`Failed to deserialize JSON data: ${error}`);
                }
        }
    }
    /**
     * Get serialization format
     */
    getFormat() {
        return this.format;
    }
    /**
     * Set serialization format
     */
    setFormat(format) {
        this.format = format;
    }
    /**
     * Calculate size of serialized data
     */
    size(data) {
        const serialized = this.serialize(data);
        return Buffer.byteLength(serialized, 'utf8');
    }
    /**
     * Check if data exceeds size limit
     */
    exceedsLimit(data, limitBytes) {
        return this.size(data) > limitBytes;
    }
}
exports.MessageSerializer = MessageSerializer;
//# sourceMappingURL=message-serializer.js.map