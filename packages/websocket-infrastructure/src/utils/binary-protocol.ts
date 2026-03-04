import { Logger } from '@nestjs/common';
import * as msgpack from 'msgpack-lite';
import { MessageType } from '../types';

/**
 * Binary protocol handler for WebSocket messages
 * Supports MessagePack for efficient binary serialization
 */
export class BinaryProtocol {
  private static readonly logger = new Logger(BinaryProtocol.name);

  /**
   * Encode data to binary format using MessagePack
   */
  public static encode(data: any): Buffer {
    try {
      return msgpack.encode(data);
    } catch (error) {
      this.logger.error(`Binary encoding failed: ${error}`);
      throw error;
    }
  }

  /**
   * Decode binary data from MessagePack
   */
  public static decode(buffer: Buffer): any {
    try {
      return msgpack.decode(buffer);
    } catch (error) {
      this.logger.error(`Binary decoding failed: ${error}`);
      throw error;
    }
  }

  /**
   * Check if data is binary
   */
  public static isBinary(data: any): boolean {
    return Buffer.isBuffer(data) || data instanceof ArrayBuffer || data instanceof Uint8Array;
  }

  /**
   * Convert to buffer
   */
  public static toBuffer(data: any): Buffer {
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

  /**
   * Get data size in bytes
   */
  public static getSize(data: any): number {
    if (this.isBinary(data)) {
      return this.toBuffer(data).length;
    }
    return Buffer.from(JSON.stringify(data)).length;
  }

  /**
   * Compare binary vs JSON size
   */
  public static compareWithJSON(data: any): {
    binarySize: number;
    jsonSize: number;
    ratio: number;
    recommendation: 'binary' | 'json';
  } {
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

/**
 * Message serializer that automatically chooses the best format
 */
export class MessageSerializer {
  private static readonly logger = new Logger(MessageSerializer.name);

  /**
   * Serialize message
   */
  public static serialize(
    data: any,
    preferBinary: boolean = false
  ): {
    data: Buffer | string;
    type: MessageType;
  } {
    // If already binary, keep it as is
    if (BinaryProtocol.isBinary(data)) {
      return {
        data: BinaryProtocol.toBuffer(data),
        type: MessageType.BINARY,
      };
    }

    // For complex objects, decide based on size efficiency
    if (typeof data === 'object' && data !== null) {
      if (preferBinary) {
        try {
          const binary = BinaryProtocol.encode(data);
          const json = JSON.stringify(data);

          // Use binary if it's at least 10% smaller
          if (binary.length < json.length * 0.9) {
            this.logger.debug(
              `Using binary format (${binary.length} bytes vs ${json.length} bytes)`
            );
            return {
              data: binary,
              type: MessageType.BINARY,
            };
          }
        } catch (error) {
          this.logger.warn(`Binary encoding failed, falling back to JSON: ${error}`);
        }
      }

      return {
        data: JSON.stringify(data),
        type: MessageType.JSON,
      };
    }

    // For simple types, use text
    return {
      data: String(data),
      type: MessageType.TEXT,
    };
  }

  /**
   * Deserialize message
   */
  public static deserialize(data: Buffer | string, type: MessageType): any {
    try {
      switch (type) {
        case MessageType.BINARY:
          return BinaryProtocol.decode(typeof data === 'string' ? Buffer.from(data) : data);

        case MessageType.JSON:
          return JSON.parse(typeof data === 'string' ? data : data.toString());

        case MessageType.TEXT:
          return typeof data === 'string' ? data : data.toString();

        default:
          throw new Error(`Unsupported message type: ${type}`);
      }
    } catch (error) {
      this.logger.error(`Deserialization failed: ${error}`);
      throw error;
    }
  }
}

/**
 * Protocol negotiation for client-server communication
 */
export class ProtocolNegotiator {
  private static readonly logger = new Logger(ProtocolNegotiator.name);
  private supportedProtocols: Set<string> = new Set(['json', 'binary', 'msgpack']);

  /**
   * Negotiate protocol with client
   */
  public negotiate(clientProtocols: string[]): string {
    // Priority order
    const priorities = ['msgpack', 'binary', 'json'];

    for (const protocol of priorities) {
      if (clientProtocols.includes(protocol) && this.supportedProtocols.has(protocol)) {
        ProtocolNegotiator.logger.log(`Negotiated protocol: ${protocol}`);
        return protocol;
      }
    }

    // Default to JSON
    ProtocolNegotiator.logger.log('No common protocol found, defaulting to JSON');
    return 'json';
  }

  /**
   * Add supported protocol
   */
  public addProtocol(protocol: string): void {
    this.supportedProtocols.add(protocol);
  }

  /**
   * Remove supported protocol
   */
  public removeProtocol(protocol: string): void {
    this.supportedProtocols.delete(protocol);
  }

  /**
   * Check if protocol is supported
   */
  public isSupported(protocol: string): boolean {
    return this.supportedProtocols.has(protocol);
  }
}
