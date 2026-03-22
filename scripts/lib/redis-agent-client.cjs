const Redis = require('ioredis');
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
