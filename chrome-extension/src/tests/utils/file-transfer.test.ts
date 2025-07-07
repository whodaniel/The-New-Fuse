/**
 * Tests for FileTransferManager
 */
import { FileTransferManager } from '../../utils/file-transfer.js';
import { WebSocketManager } from '../../utils/websocket-manager.js';

// Mock WebSocketManager
jest.mock('../../utils/websocket-manager');

describe('FileTransferManager', () => {
  let fileTransferManager: FileTransferManager;
  let mockWsManager: jest.Mocked<WebSocketManager>;
  
  beforeEach(() => {
    // Create a mock WebSocketManager
    mockWsManager = new WebSocketManager('ws://localhost:3712') as jest.Mocked<WebSocketManager>;
    mockWsManager.isConnected = jest.fn().mockReturnValue(true);
    mockWsManager.send = jest.fn().mockReturnValue(true);
    mockWsManager.addListener = jest.fn();
    
    // Create FileTransferManager with mock WebSocketManager
    fileTransferManager = new FileTransferManager(mockWsManager, {
      chunkSize: 1024,
      maxRetries: 3,
      retryDelay: 100
    });
  });
  
  test('should create a FileTransferManager instance', () => {
    expect(fileTransferManager).toBeInstanceOf(FileTransferManager);
  });
  
  test('should upload a file', () => {
    // Create a mock file
    const mockFile = new File(['test file content'], 'test.txt', { type: 'text/plain' });
    
    // Mock FileReader
    const originalFileReader = global.FileReader;
    const mockFileReaderInstance = {
      onload: null as any,
      onerror: null as any,
      readAsArrayBuffer: jest.fn(function(this: any) {
        setTimeout(() => {
          this.result = new ArrayBuffer(mockFile.size);
          this.onload?.();
        }, 0);
      }),
    };
    const MockFileReader = jest.fn(() => mockFileReaderInstance) as any;
    global.FileReader = MockFileReader;
    
    // Upload file
    const fileId = fileTransferManager.uploadFile(mockFile);
    
    // Verify file ID format
    expect(fileId).toMatch(/^file_\d+_[a-z0-9]+$/);
    
    // Verify FileReader was used
    expect(MockFileReader).toHaveBeenCalled();
    expect(mockFileReaderInstance.readAsArrayBuffer).toHaveBeenCalledWith(mockFile);
    
    // Restore original FileReader
    global.FileReader = originalFileReader;
  });
  
  test('should handle file transfer messages', () => {
    // Mock message handler
    const messageHandler = mockWsManager.addListener.mock.calls.find(
      call => call[0] === 'message'
    )?.[1];
    
    expect(messageHandler).toBeDefined();
    
    // Test FILE_CHUNK_ACK message
    if (messageHandler) {
      // Create a mock transfer
      const mockTransfer = {
        fileId: 'test-file-id',
        direction: 'upload',
        chunks: [{ acknowledged: false }, { acknowledged: false }],
        nextChunkIndex: 2,
        progress: 0,
        onProgress: jest.fn()
      };
      
      // @ts-ignore - Access private property for testing
      fileTransferManager.transfers.set('test-file-id', mockTransfer);
      
      // Send FILE_CHUNK_ACK message
      messageHandler({
        type: 'FILE_CHUNK_ACK',
        fileId: 'test-file-id',
        chunkIndex: 0
      });
      
      // Verify chunk was acknowledged
      expect(mockTransfer.chunks[0].acknowledged).toBe(true);
      expect(mockTransfer.progress).toBeGreaterThan(0);
      expect(mockTransfer.onProgress).toHaveBeenCalled();
    }
  });
  
  test('should cancel a transfer', () => {
    // Create a mock transfer
    const mockTransfer = {
      fileId: 'test-file-id',
      direction: 'upload',
      chunks: [{ acknowledged: false }],
      nextChunkIndex: 1
    };
    
    // @ts-ignore - Access private property for testing
    fileTransferManager.transfers.set('test-file-id', mockTransfer);
    
    // Cancel transfer
    const result = fileTransferManager.cancelTransfer('test-file-id');
    
    // Verify result
    expect(result).toBe(true);
    expect(mockWsManager.send).toHaveBeenCalledWith({
      type: 'FILE_TRANSFER_CANCEL',
      fileId: 'test-file-id',
      timestamp: expect.any(Number)
    });
    
    // Verify transfer was removed
    // @ts-ignore - Access private property for testing
    expect(fileTransferManager.transfers.has('test-file-id')).toBe(false);
  });
  
  test('should get active transfers', () => {
    // Create mock transfers
    const mockTransfer1 = { fileId: 'file-1', progress: 50 };
    const mockTransfer2 = { fileId: 'file-2', progress: 75 };
    
    // @ts-ignore - Access private property for testing
    fileTransferManager.transfers.set('file-1', mockTransfer1);
    // @ts-ignore - Access private property for testing
    fileTransferManager.transfers.set('file-2', mockTransfer2);
    
    // Get active transfers
    const activeTransfers = fileTransferManager.getActiveTransfers();
    
    // Verify result
    expect(activeTransfers).toHaveLength(2);
    expect(activeTransfers).toContainEqual(mockTransfer1);
    expect(activeTransfers).toContainEqual(mockTransfer2);
  });
});
