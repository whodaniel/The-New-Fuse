/**
 * Jest compatibility layer for Bun
 * Provides Jest-like API for tests running under Bun
 */

// Mock function implementation for Bun
function createMockFunction(impl) {
  const mockFn = function(...args) {
    mockFn.mock.calls.push(args);
    mockFn.mock.callCount++;
    if (mockFn.mock.implementation) {
      return mockFn.mock.implementation(...args);
    }
    if (impl) {
      return impl(...args);
    }
  };

  mockFn.mock = {
    calls: [],
    callCount: 0,
    implementation: impl,
    returnValue: undefined,
    returnValues: [],
  };

  mockFn.mockImplementation = function(fn) {
    mockFn.mock.implementation = fn;
    return mockFn;
  };

  mockFn.mockReturnValue = function(value) {
    mockFn.mock.returnValue = value;
    mockFn.mock.implementation = () => value;
    return mockFn;
  };

  mockFn.mockReturnValueOnce = function(value) {
    mockFn.mock.returnValues.push(value);
    return mockFn;
  };

  mockFn.mockResolvedValue = function(value) {
    mockFn.mock.implementation = () => Promise.resolve(value);
    return mockFn;
  };

  mockFn.mockRejectedValue = function(value) {
    mockFn.mock.implementation = () => Promise.reject(value);
    return mockFn;
  };

  mockFn.mockClear = function() {
    mockFn.mock.calls = [];
    mockFn.mock.callCount = 0;
    return mockFn;
  };

  mockFn.mockReset = function() {
    mockFn.mockClear();
    mockFn.mock.implementation = undefined;
    mockFn.mock.returnValue = undefined;
    mockFn.mock.returnValues = [];
    return mockFn;
  };

  return mockFn;
}

// Create jest global if it doesn't exist (for Bun compatibility)
if (typeof global.jest === 'undefined') {
  global.jest = {
    fn: createMockFunction,
    mock: (moduleName, factory) => {
      // Basic mock implementation
      return factory ? factory() : {};
    },
    setTimeout: (timeout) => {
      if (typeof global.testTimeout !== 'undefined') {
        global.testTimeout = timeout;
      }
    },
    clearAllMocks: () => {
      // Implementation for clearing all mocks
    },
    resetAllMocks: () => {
      // Implementation for resetting all mocks
    },
    restoreAllMocks: () => {
      // Implementation for restoring all mocks
    }
  };
}

// Make jest available globally
if (typeof window !== 'undefined') {
  window.jest = global.jest;
}

export default global.jest;
