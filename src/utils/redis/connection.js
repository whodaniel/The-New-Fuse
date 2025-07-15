import { Redis } from "ioredis";
export class RedisConnection {
    client;
    constructor(config) {
        this.client = new Redis({
            host: config.host,
            port: config.port,
            password: config.password,
        });
    }
    async initialize() {
        await this.client.connect();
    }
}
