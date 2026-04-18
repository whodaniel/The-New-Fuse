import { nativeMessaging } from '../NativeMessaging.js';

describe('NativeMessaging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore
    global.chrome = {
      runtime: {
        sendNativeMessage: jest.fn(),
        connectNative: jest.fn(),
        lastError: null,
      },
    };
  });

  describe('isAvailable', () => {
    it('should return true when chrome.runtime.connectNative is defined', () => {
      expect(nativeMessaging.isAvailable()).toBe(true);
    });

    it('should return false when chrome is undefined', () => {
      // @ts-ignore
      global.chrome = undefined;
      expect(nativeMessaging.isAvailable()).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('should resolve with response on success', async () => {
      const mockResponse = { action: 'test_response' };
      (chrome.runtime.sendNativeMessage as jest.Mock).mockImplementation((name, msg, cb) => {
        cb(mockResponse);
      });

      const response = await nativeMessaging.sendMessage({ action: 'test' });
      expect(response).toEqual(mockResponse);
      expect(chrome.runtime.sendNativeMessage).toHaveBeenCalledWith(
        'com.thenewfuse.native_host',
        { action: 'test' },
        expect.any(Function)
      );
    });

    it('should resolve with error message when chrome.runtime.lastError is set', async () => {
      (chrome.runtime.sendNativeMessage as jest.Mock).mockImplementation((name, msg, cb) => {
        // @ts-ignore
        chrome.runtime.lastError = { message: 'Native host not found' };
        cb(null);
      });

      const response = await nativeMessaging.sendMessage({ action: 'test' });
      expect(response).toEqual({
        action: 'error',
        message: 'Native host not found',
      });
    });
  });

  describe('ping', () => {
    it('should return true when response action is pong', async () => {
      (chrome.runtime.sendNativeMessage as jest.Mock).mockImplementation((name, msg, cb) => {
        cb({ action: 'pong' });
      });

      const result = await nativeMessaging.ping();
      expect(result).toBe(true);
    });

    it('should return false when response action is not pong', async () => {
      (chrome.runtime.sendNativeMessage as jest.Mock).mockImplementation((name, msg, cb) => {
        cb({ action: 'error' });
      });

      const result = await nativeMessaging.ping();
      expect(result).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return services when action is status_response', async () => {
      const mockServices = {
        relay: { name: 'relay', running: true, port: 3000, pid: 123 },
      };
      (chrome.runtime.sendNativeMessage as jest.Mock).mockImplementation((name, msg, cb) => {
        cb({ action: 'status_response', services: mockServices });
      });

      const result = await nativeMessaging.getStatus();
      expect(result).toEqual(mockServices);
    });

    it('should return null when action is not status_response', async () => {
      (chrome.runtime.sendNativeMessage as jest.Mock).mockImplementation((name, msg, cb) => {
        cb({ action: 'error' });
      });

      const result = await nativeMessaging.getStatus();
      expect(result).toBeNull();
    });
  });
});
