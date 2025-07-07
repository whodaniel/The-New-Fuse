/**
 * WebSocket compression utilities
 */
import * as pako from 'pako';

/**
 * Compression utilities interface
 */
export interface CompressionUtils {
  /**
   * Compress a message
   * @param message - Message to compress
   * @returns Compressed message or null if compression failed
   */
  compressMessage(message: string | object): string | null;

  /**
   * Decompress a message
   * @param compressed - Compressed message
   * @returns Decompressed message or null if decompression failed
   */
  decompressMessage(compressed: string): string | object | null;
}

// Helper functions used by WebSocketManager
export const compressString = (message: string | object): Uint8Array => {
  try {
    let msgString: string;
    if (typeof message === 'string') {
      msgString = message;
    } else {
      msgString = JSON.stringify(message);
    }
    return pako.deflate(msgString);
  } catch (error) {
    console.warn('[CompressionUtils] Compression failed:', error instanceof Error ? error.message : error);
    throw error;
  }
};

export const decompressArrayBufferToString = (data: ArrayBuffer): string => {
  try {
    const inflated = pako.inflate(new Uint8Array(data), { to: 'string' });
    return inflated;
  } catch (error) {
    console.warn('[CompressionUtils] Decompression failed:', error instanceof Error ? error.message : error);
    throw error;
  }
};

export const compressionUtils: CompressionUtils = {
  /**
   * Compress a message using pako
   * @param message - Message to compress
   * @returns Compressed message or null if compression failed
   */
  compressMessage(message: string | object): string | null {
    try {
      let msgString: string;
      if (typeof message === 'string') {
        msgString = message;
      } else {
        // Ensure JSON.stringify doesn't throw for complex non-serializable objects,
        // though pako itself might also struggle with non-string input.
        // For typical message objects, this should be fine.
        msgString = JSON.stringify(message);
      }
      const compressedData = pako.deflate(msgString);
      // Convert Uint8Array to binary string for btoa
      let binaryString = '';
      for (let i = 0; i < compressedData.length; i++) {
        binaryString += String.fromCharCode(compressedData[i]);
      }
      return btoa(binaryString);
    } catch (error) {
      console.warn('[CompressionUtils] Compression failed:', error instanceof Error ? error.message : error);
      // Fallback to original stringified message if possible, or null if stringification also fails
      try {
        return typeof message === 'string' ? message : JSON.stringify(message);
      } catch (stringifyError) {
        console.warn('[CompressionUtils] Fallback stringification failed:', stringifyError);
        return null;
      }
    }
  },

  /**
   * Decompress a message using pako
   * @param compressed - Compressed message
   * @returns Decompressed message or null if decompression failed
   */
  decompressMessage(compressed: string): string | object | null {
    try {
      const binary = atob(compressed);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const decompressed = pako.inflate(bytes, { to: 'string' });
      // Attempt to parse if it was originally an object
      try {
        return JSON.parse(decompressed);
      } catch (jsonParseError) {
        // If JSON.parse fails, it means the original message was a string
        return decompressed;
      }
    } catch (decompressionError) {
      // If decompression fails, it might be an uncompressed JSON string or just a plain string
      console.warn('[CompressionUtils] Decompression failed, attempting to parse as JSON or return as string:', decompressionError instanceof Error ? decompressionError.message : decompressionError);
      try {
        return JSON.parse(compressed); // Assumes it might be an uncompressed JSON
      } catch (jsonError) {
        // If it's not JSON either, and not decompressible, it might be a plain uncompressed string or malformed
        console.warn('[CompressionUtils] Could not decompress or parse as JSON. Returning raw (if string) or null.:', jsonError);
        return null;
      }
    }
  }
};
