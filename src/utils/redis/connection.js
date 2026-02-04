"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisConnection = void 0;
const ioredis_1 = require("ioredis");
class RedisConnection {
    client;
    constructor(config) {
        this.client = new ioredis_1.Redis({
            host: config.host,
            port: config.port,
            password: config.password,
        });
    }
    async initialize() {
        await this.client.connect();
    }
}
exports.RedisConnection = RedisConnection;
//# sourceMappingURL=connection.js.map