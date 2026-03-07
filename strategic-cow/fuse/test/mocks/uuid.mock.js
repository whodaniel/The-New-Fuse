// Mock UUID module for Jest
// Simple implementation that mimics uuid functionality

const crypto = require('crypto');

// Simple UUID v4 generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = crypto.randomBytes(1)[0] % 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Simple UUID v1 generator (timestamp-based)
function uuidv1() {
  const now = Date.now();
  const random = crypto.randomBytes(10).toString('hex');
  return `${now.toString(16)}-${random.slice(0, 4)}-1${random.slice(4, 7)}-${random.slice(7, 10)}-${random.slice(10)}`;
}

// Mock UUID module
const mockUUID = {
  v1: uuidv1,
  v3: (name, namespace) => '00000000-0000-3000-8000-000000000000', // Simplified
  v4: uuidv4,
  v5: (name, namespace) => '00000000-0000-5000-8000-000000000000', // Simplified
  validate: (uuid) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
  },
  version: (uuid) => {
    if (!mockUUID.validate(uuid)) {
      return null;
    }
    return parseInt(uuid.charAt(14), 16);
  },
  NIL: '00000000-0000-0000-0000-000000000000',
  parse: (uuid) => {
    if (!mockUUID.validate(uuid)) {
      return null;
    }
    return Buffer.from(uuid.replace(/-/g, ''), 'hex');
  },
  stringify: (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length !== 16) {
      return null;
    }
    return buffer
      .toString('hex')
      .match(/(.{8})(.{4})(.{4})(.{4})(.{12})/)
      .slice(1)
      .join('-');
  },
};

// Export as CommonJS for Jest compatibility
module.exports = mockUUID;
