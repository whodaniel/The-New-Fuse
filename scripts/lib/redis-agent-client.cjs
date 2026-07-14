const Redis = (() => {
  // Self-resolve ioredis so the cron-launched node process doesn't
  // require NODE_PATH to find the repo's node_modules.
  const fs2 = require('fs');
  const path2 = require('path');
  function findUp(filename, startDir) {
    let dir = startDir;
    while (true) {
      const candidate = path2.join(dir, 'node_modules', filename);
      if (fs2.existsSync(candidate)) return candidate;
      const parent = path2.dirname(dir);
      if (parent === dir) return null;
      dir = parent;
    }
  }
  const candidates = [
    process.env.NODE_PATH && process.env.NODE_PATH.split(':').flatMap((p) => p ? [p] : []),
    // Walk up from __dirname looking for node_modules/ioredis.
    [findUp('ioredis', __dirname)],
    [findUp('ioredis', process.cwd())],
  ]
    .flat()
    .filter(Boolean);
  for (const modPath of candidates) {
    try {
      return require(modPath);
    } catch (_) {
      // try the next candidate
    }
  }
  // Last-resort: let it fail naturally so we surface a clean trace.
  return require('ioredis');
})();
const { randomUUID } = require('crypto');

class RedisAgentClient {
  constructor() {
    this.redisUrl = process.env.REDIS_PUBLIC_URL || 'redis://localhost:6379';
    this.publisher = new Redis(this.redisUrl);
    this.subscriber = new Redis(this.redisUrl);
  }

  async initialize() {
    // Basic connectivity check
    await this.publisher.ping();
  }

  async cleanup() {
    await this.publisher.quit();
    await this.subscriber.quit();
  }

  onMessage(channel, handler) {
    this.subscriber.subscribe(channel);
    this.subscriber.on('message', (chan, message) => {
      if (chan === channel) {
        try {
          handler(JSON.parse(message));
        } catch (e) {}
      }
    });
  }
}

module.exports = { RedisAgentClient };
