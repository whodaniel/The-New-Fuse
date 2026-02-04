// Jest setup file for The New Fuse monorepo
const { TextEncoder, TextDecoder } = require('util');

// Set up global TextEncoder/TextDecoder for Node.js compatibility
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Simple UUID v4 generator that doesn't depend on the uuid module
function simpleUUIDv4() {
  let uuid = '';
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-';
    }
    const random = (Math.random() * 16) | 0;
    if (i === 12) {
      uuid += '4'; // UUID version 4
    } else if (i === 16) {
      uuid += ((random & 3) | 8).toString(16); // UUID variant
    } else {
      uuid += random.toString(16);
    }
  }
  return uuid;
}

// Create a mock UUID module that works with both ESM and CJS
global.uuid = {
  v1: () =>
    'xxxxxxxx-xxxx-1xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    }),
  v3: (_name, _namespace) => '00000000-0000-3000-8000-000000000000',
  v4: simpleUUIDv4,
  v5: (_name, _namespace) => '00000000-0000-5000-8000-000000000000',
  validate: (uuid) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
  },
  version: (uuid) => {
    if (!global.uuid.validate(uuid)) return null;
    return parseInt(uuid.charAt(14), 16);
  },
  NIL: '00000000-0000-0000-0000-000000000000',
  parse: (uuid) => {
    if (!global.uuid.validate(uuid)) return null;
    const hex = uuid.replace(/-/g, '');
    const buffer = Buffer.alloc(16);
    for (let i = 0; i < 16; i++) {
      buffer[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return buffer;
  },
  stringify: (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length !== 16) return null;
    let hex = buffer.toString('hex');
    return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`;
  },
};

// Mock uuid module globally
jest.mock('uuid', () => global.uuid);

// Set up test environment for jsdom if needed
if (process.env.JEST_ENVIRONMENT === 'jsdom') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
