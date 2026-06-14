import { SerializationFormat } from '../types/coordination.types';
/**
 * Message serializer for efficient data transmission
 */
export declare class MessageSerializer {
    private format;
    constructor(format?: SerializationFormat);
    /**
     * Serialize data to string or buffer
     */
    serialize<T>(data: T): string;
    /**
     * Deserialize string or buffer to data
     */
    deserialize<T>(serialized: string): T;
    /**
     * Get serialization format
     */
    getFormat(): SerializationFormat;
    /**
     * Set serialization format
     */
    setFormat(format: SerializationFormat): void;
    /**
     * Calculate size of serialized data
     */
    size<T>(data: T): number;
    /**
     * Check if data exceeds size limit
     */
    exceedsLimit<T>(data: T, limitBytes: number): boolean;
}
//# sourceMappingURL=message-serializer.d.ts.map