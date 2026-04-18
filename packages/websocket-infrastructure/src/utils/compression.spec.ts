import { CompressionUtil, CompressionMiddleware } from './compression.js';
import { CompressionAlgorithm } from '../types/index.js';

describe('CompressionUtil', () => {
  const testData = {
    id: 1,
    name: 'Test Data',
    description: 'This is a test object for compression',
    nested: {
      array: [1, 2, 3, 4, 5],
      bool: true,
    },
    longString: 'x'.repeat(1000), // Make it large enough to compress
  };

  describe('compress', () => {
    it('should compress data using GZIP', () => {
      const compressed = CompressionUtil.compress(testData, CompressionAlgorithm.GZIP);
      expect(Buffer.isBuffer(compressed)).toBe(true);
      expect(compressed.length).toBeLessThan(CompressionUtil.getDataSize(testData));
    });

    it('should compress data using DEFLATE', () => {
      const compressed = CompressionUtil.compress(testData, CompressionAlgorithm.DEFLATE);
      expect(Buffer.isBuffer(compressed)).toBe(true);
      expect(compressed.length).toBeLessThan(CompressionUtil.getDataSize(testData));
    });

    it('should throw error for unsupported algorithm', () => {
      expect(() => {
        CompressionUtil.compress(testData, 'INVALID' as CompressionAlgorithm);
      }).toThrow();
    });
  });

  describe('decompress', () => {
    it('should decompress GZIP compressed data', () => {
      const compressed = CompressionUtil.compress(testData, CompressionAlgorithm.GZIP);
      const decompressed = CompressionUtil.decompress(compressed, CompressionAlgorithm.GZIP);
      expect(decompressed).toEqual(testData);
    });

    it('should decompress DEFLATE compressed data', () => {
      const compressed = CompressionUtil.compress(testData, CompressionAlgorithm.DEFLATE);
      const decompressed = CompressionUtil.decompress(compressed, CompressionAlgorithm.DEFLATE);
      expect(decompressed).toEqual(testData);
    });
  });

  describe('shouldCompress', () => {
    it('should return true if data size exceeds threshold', () => {
      const largeData = 'x'.repeat(2000);
      expect(CompressionUtil.shouldCompress(largeData, 1000)).toBe(true);
    });

    it('should return false if data size is below threshold', () => {
      const smallData = 'x';
      expect(CompressionUtil.shouldCompress(smallData, 1000)).toBe(false);
    });
  });

  describe('compressIfBeneficial', () => {
    it('should compress if beneficial', () => {
      const result = CompressionUtil.compressIfBeneficial(testData, CompressionAlgorithm.GZIP, 100);
      expect(result.compressed).toBe(true);
      expect(result.algorithm).toBe(CompressionAlgorithm.GZIP);
      expect(result.data).not.toEqual(testData);
    });

    it('should not compress if not beneficial (small data)', () => {
      const smallData = { a: 1 };
      const result = CompressionUtil.compressIfBeneficial(smallData, CompressionAlgorithm.GZIP, 1000);
      expect(result.compressed).toBe(false);
      expect(result.data).toEqual(smallData);
    });
  });
});

describe('CompressionMiddleware', () => {
  let middleware: CompressionMiddleware;

  beforeEach(() => {
    middleware = new CompressionMiddleware(100, CompressionAlgorithm.GZIP);
  });

  describe('processOutgoing', () => {
    it('should compress outgoing large data', () => {
      const largeData = 'x'.repeat(1000);
      const result = middleware.processOutgoing(largeData);
      expect(result.compressed).toBe(true);
      expect(result.algorithm).toBe(CompressionAlgorithm.GZIP);
      expect(Buffer.isBuffer(result.data)).toBe(true);
    });

    it('should not compress outgoing small data', () => {
      const smallData = 'x';
      const result = middleware.processOutgoing(smallData);
      expect(result.compressed).toBe(false);
      expect(result.data).toBe(smallData);
    });
  });

  describe('processIncoming', () => {
    it('should decompress incoming compressed data', () => {
      const originalData = { foo: 'bar' };
      const compressedData = CompressionUtil.compress(originalData, CompressionAlgorithm.GZIP);

      const result = middleware.processIncoming(compressedData, true, CompressionAlgorithm.GZIP);
      expect(result).toEqual(originalData);
    });

    it('should return raw data if not compressed', () => {
      const rawData = { foo: 'bar' };
      const result = middleware.processIncoming(rawData, false);
      expect(result).toEqual(rawData);
    });
  });
});
