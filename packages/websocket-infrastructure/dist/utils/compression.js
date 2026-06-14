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
exports.CompressionMiddleware = exports.CompressionUtil = void 0;
const common_1 = require("@nestjs/common");
const pako = __importStar(require("pako"));
const index_js_1 = require("../types/index.js");
class CompressionUtil {
    static logger = new common_1.Logger(CompressionUtil.name);
    static compressionThreshold = 1024;
    static compress(data, algorithm = index_js_1.CompressionAlgorithm.GZIP) {
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
        const buffer = Buffer.from(jsonString, 'utf-8');
        try {
            switch (algorithm) {
                case index_js_1.CompressionAlgorithm.GZIP:
                    return Buffer.from(pako.gzip(buffer));
                case index_js_1.CompressionAlgorithm.DEFLATE:
                    return Buffer.from(pako.deflate(buffer));
                default:
                    throw new Error(`Unsupported compression algorithm: ${algorithm}`);
            }
        }
        catch (error) {
            this.logger.error(`Compression failed: ${error}`);
            throw error;
        }
    }
    static decompress(data, algorithm = index_js_1.CompressionAlgorithm.GZIP) {
        try {
            let decompressed;
            switch (algorithm) {
                case index_js_1.CompressionAlgorithm.GZIP:
                    decompressed = pako.ungzip(data);
                    break;
                case index_js_1.CompressionAlgorithm.DEFLATE:
                    decompressed = pako.inflate(data);
                    break;
                default:
                    throw new Error(`Unsupported compression algorithm: ${algorithm}`);
            }
            const jsonString = Buffer.from(decompressed).toString('utf-8');
            return JSON.parse(jsonString);
        }
        catch (error) {
            this.logger.error(`Decompression failed: ${error}`);
            throw error;
        }
    }
    static shouldCompress(data, threshold) {
        const size = this.getDataSize(data);
        return size >= (threshold ?? this.compressionThreshold);
    }
    static getDataSize(data) {
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
        return Buffer.from(jsonString, 'utf-8').length;
    }
    static getCompressionRatio(original, compressed) {
        const originalSize = this.getDataSize(original);
        const compressedSize = compressed.length;
        return (1 - compressedSize / originalSize) * 100;
    }
    static compressIfBeneficial(data, algorithm = index_js_1.CompressionAlgorithm.GZIP, threshold) {
        if (!this.shouldCompress(data, threshold)) {
            return { compressed: false, data };
        }
        try {
            const compressed = this.compress(data, algorithm);
            const ratio = this.getCompressionRatio(data, compressed);
            if (ratio >= 10) {
                this.logger.debug(`Compression ratio: ${ratio.toFixed(2)}%`);
                return {
                    compressed: true,
                    data: compressed,
                    algorithm,
                    ratio,
                };
            }
            return { compressed: false, data };
        }
        catch (error) {
            this.logger.error(`Compression failed, sending uncompressed: ${error}`);
            return { compressed: false, data };
        }
    }
}
exports.CompressionUtil = CompressionUtil;
class CompressionMiddleware {
    threshold;
    algorithm;
    static logger = new common_1.Logger(CompressionMiddleware.name);
    constructor(threshold = 1024, algorithm = index_js_1.CompressionAlgorithm.GZIP) {
        this.threshold = threshold;
        this.algorithm = algorithm;
    }
    processOutgoing(data) {
        const result = CompressionUtil.compressIfBeneficial(data, this.algorithm, this.threshold);
        if (result.compressed) {
            CompressionMiddleware.logger.debug(`Message compressed (Ratio: ${result.ratio?.toFixed(2)}%)`);
        }
        return {
            data: result.data,
            compressed: result.compressed,
            algorithm: result.algorithm,
        };
    }
    processIncoming(data, compressed, algorithm) {
        if (!compressed || !algorithm) {
            return data;
        }
        try {
            return CompressionUtil.decompress(data, algorithm);
        }
        catch (error) {
            CompressionMiddleware.logger.error(`Failed to decompress message: ${error}`);
            throw error;
        }
    }
}
exports.CompressionMiddleware = CompressionMiddleware;
