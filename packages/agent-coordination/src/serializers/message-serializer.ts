import * as msgpack from 'msgpack-lite';
import { SerializationFormat } from '../types/coordination.types';

/**
 * Message serializer for efficient data transmission
 */
export class MessageSerializer {
  private format: SerializationFormat;

  constructor(format: SerializationFormat = SerializationFormat.JSON) {
    this.format = format;
  }

  /**
   * Serialize data to string or buffer
   */
  serialize<T>(data: T): string {
    switch (this.format) {
      case SerializationFormat.MSGPACK:
        const buffer = msgpack.encode(data);
        return buffer.toString('base64');
      
      case SerializationFormat.JSON:
      default:
        return JSON.stringify(data);
    }
  }

  /**
   * Deserialize string or buffer to data
   */
  deserialize<T>(serialized: string): T {
    switch (this.format) {
      case SerializationFormat.MSGPACK:
        try {
          const buffer = Buffer.from(serialized, 'base64');
          return msgpack.decode(buffer) as T;
        } catch (error) {
          throw new Error(`Failed to deserialize MessagePack data: ${error}`);
        }
      
      case SerializationFormat.JSON:
      default:
        try {
          return JSON.parse(serialized) as T;
        } catch (error) {
          throw new Error(`Failed to deserialize JSON data: ${error}`);
        }
    }
  }

  /**
   * Get serialization format
   */
  getFormat(): SerializationFormat {
    return this.format;
  }

  /**
   * Set serialization format
   */
  setFormat(format: SerializationFormat): void {
    this.format = format;
  }

  /**
   * Calculate size of serialized data
   */
  size<T>(data: T): number {
    const serialized = this.serialize(data);
    return Buffer.byteLength(serialized, 'utf8');
  }

  /**
   * Check if data exceeds size limit
   */
  exceedsLimit<T>(data: T, limitBytes: number): boolean {
    return this.size(data) > limitBytes;
  }
}
