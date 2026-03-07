/**
 * Empty module stub for Node.js-only modules in browser builds
 *
 * This file is used to replace Node.js modules like ioredis that
 * should not be included in the browser bundle.
 */

export default {};
export const createClient = () => ({
  connect: async () => {},
  disconnect: async () => {},
  get: async () => null,
  set: async () => 'OK',
  del: async () => 0,
  on: () => {},
  off: () => {},
  subscribe: async () => {},
  publish: async () => 0,
  quit: async () => 'OK',
});
