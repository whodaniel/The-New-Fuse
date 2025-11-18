import { Logger } from '@nestjs/common';
import * as pako from 'pako';
import { CompressionAlgorithm, MessageType } from '../types';

export class CompressionUtil {
  private static readonly logger = new Logger(CompressionUtil.name);
  private static readonly compressionThreshold = 1024; // 1KB

  /**
   * Compress data using specified algorithm
   */
  public static compress(data: any, algorithm: CompressionAlgorithm = CompressionAlgorithm.GZIP): Buffer {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const buffer = Buffer.from(jsonString, 'utf-8');

    try {
      switch (algorithm) {
        case CompressionAlgorithm.GZIP:
          return Buffer.from(pako.gzip(buffer));
        case CompressionAlgorithm.DEFLATE:
          return Buffer.from(pako.deflate(buffer));
        default:
          throw new Error(`Unsupported compression algorithm: ${algorithm}`);
      }
    } catch (error) {
      this.logger.error(`Compression failed: ${error}`);
      throw error;
    }
  }

  /**
   * Decompress data using specified algorithm
   */
  public static decompress(data: Buffer, algorithm: CompressionAlgorithm = CompressionAlgorithm.GZIP): any {
    try {
      let decompressed: Uint8Array;

      switch (algorithm) {
        case CompressionAlgorithm.GZIP:
          decompressed = pako.ungzip(data);
          break;
        case CompressionAlgorithm.DEFLATE:
          decompressed = pako.inflate(data);
          break;
        default:
          throw new Error(`Unsupported compression algorithm: ${algorithm}`);
      }

      const jsonString = Buffer.from(decompressed).toString('utf-8');
      return JSON.parse(jsonString);
    } catch (error) {
      this.logger.error(`Decompression failed: ${error}`);
      throw error;
    }
  }

  /**
   * Check if data should be compressed
   */
  public static shouldCompress(data: any, threshold?: number): boolean {
    const size = this.getDataSize(data);
    return size >= (threshold ?? this.compressionThreshold);
  }

  /**
   * Get data size in bytes
   */
  public static getDataSize(data: any): number {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    return Buffer.from(jsonString, 'utf-8').length;
  }

  /**
   * Calculate compression ratio
   */
  public static getCompressionRatio(original: any, compressed: Buffer): number {
    const originalSize = this.getDataSize(original);
    const compressedSize = compressed.length;
    return (1 - compressedSize / originalSize) * 100;
  }

  /**
   * Compress message if beneficial
   */
  public static compressIfBeneficial(
    data: any,
    algorithm: CompressionAlgorithm = CompressionAlgorithm.GZIP,
    threshold?: number
  ): { compressed: boolean; data: any; algorithm?: CompressionAlgorithm; ratio?: number } {
    if (!this.shouldCompress(data, threshold)) {
      return { compressed: false, data };
    }

    try {
      const compressed = this.compress(data, algorithm);
      const ratio = this.getCompressionRatio(data, compressed);

      // Only use compression if we save at least 10%
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
    } catch (error) {
      this.logger.error(`Compression failed, sending uncompressed: ${error}`);
      return { compressed: false, data };
    }
  }
}

/**
 * Middleware for automatic compression
 */
export class CompressionMiddleware {
  private static readonly logger = new Logger(CompressionMiddleware.name);

  constructor(
    private readonly threshold: number = 1024,
    private readonly algorithm: CompressionAlgorithm = CompressionAlgorithm.GZIP
  ) {}

  /**
   * Process outgoing message
   */
  public processOutgoing(data: any): {
    data: any;
    compressed: boolean;
    algorithm?: CompressionAlgorithm;
  } {
    const result = CompressionUtil.compressIfBeneficial(data, this.algorithm, this.threshold);

    if (result.compressed) {
      CompressionMiddleware.logger.debug(
        `Message compressed (Ratio: ${result.ratio?.toFixed(2)}%)`
      );
    }

    return {
      data: result.data,
      compressed: result.compressed,
      algorithm: result.algorithm,
    };
  }

  /**
   * Process incoming message
   */
  public processIncoming(data: any, compressed: boolean, algorithm?: CompressionAlgorithm): any {
    if (!compressed || !algorithm) {
      return data;
    }

    try {
      return CompressionUtil.decompress(data, algorithm);
    } catch (error) {
      CompressionMiddleware.logger.error(`Failed to decompress message: ${error}`);
      throw error;
    }
  }
}
