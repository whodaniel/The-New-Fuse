import { createClient } from 'redis';
import { EventEmitter } from 'node:events';
export class CloudRedisClient extends EventEmitter {
    constructor(config = {}) {
        super();
        this.connected = false;
        this.config = {
            url: process.env.CLOUD_REDIS_URL || 'redis://localhost:6379',
            ingressChannel: config.ingressChannel || 'tnf:bus:ingress',
            egressPrefix: config.egressPrefix || 'tnf:bus:egress',
        };
        this.publisher = createClient({ url: this.config.url });
        this.subscriber = createClient({ url: this.config.url });
        this.publisher.on('error', (err) => this.emit('error', `Publisher: ${err.message}`));
        this.subscriber.on('error', (err) => this.emit('error', `Subscriber: ${err.message}`));
    }
    async connect() {
        if (this.connected)
            return;
        await Promise.all([
            this.publisher.connect(),
            this.subscriber.connect()
        ]);
        this.connected = true;
        this.emit('ready');
    }
    async disconnect() {
        if (!this.connected)
            return;
        await Promise.all([
            this.publisher.quit(),
            this.subscriber.quit()
        ]);
        this.connected = false;
    }
    async publish(channel, message) {
        await this.ensureConnected();
        return await this.publisher.publish(channel, message);
    }
    async subscribe(channel, callback) {
        await this.ensureConnected();
        await this.subscriber.subscribe(channel, callback);
    }
    async hGetAll(key) {
        await this.ensureConnected();
        return await this.publisher.hGetAll(key);
    }
    async ensureConnected() {
        if (!this.connected) {
            await this.connect();
        }
    }
    getIngressChannel() {
        return this.config.ingressChannel;
    }
}
//# sourceMappingURL=RedisClient.js.map