import { CompressionAlgorithm } from '../types/index.js';
export declare class CompressionUtil {
    private static readonly logger;
    private static readonly compressionThreshold;
    static compress(data: any, algorithm?: CompressionAlgorithm): Buffer;
    static decompress(data: Buffer, algorithm?: CompressionAlgorithm): any;
    static shouldCompress(data: any, threshold?: number): boolean;
    static getDataSize(data: any): number;
    static getCompressionRatio(original: any, compressed: Buffer): number;
    static compressIfBeneficial(data: any, algorithm?: CompressionAlgorithm, threshold?: number): {
        compressed: boolean;
        data: any;
        algorithm?: CompressionAlgorithm;
        ratio?: number;
    };
}
export declare class CompressionMiddleware {
    private readonly threshold;
    private readonly algorithm;
    private static readonly logger;
    constructor(threshold?: number, algorithm?: CompressionAlgorithm);
    processOutgoing(data: any): {
        data: any;
        compressed: boolean;
        algorithm?: CompressionAlgorithm;
    };
    processIncoming(data: any, compressed: boolean, algorithm?: CompressionAlgorithm): any;
}
//# sourceMappingURL=compression.d.ts.map