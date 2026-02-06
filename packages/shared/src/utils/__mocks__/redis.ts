// Mock Redis client for testing
export const mockRedisClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),
  keys: jest.fn().mockResolvedValue([]),
  flushall: jest.fn().mockResolvedValue('OK'),
  ping: jest.fn().mockResolvedValue('PONG'),
  on: jest.fn(),
  off: jest.fn(),
  isOpen: true,
  isReady: true,
};

// Mock the createClient function
export const createClient = jest.fn(() => mockRedisClient);

// Export the mock client as default
export default mockRedisClient;
