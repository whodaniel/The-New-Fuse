export class RedisService {
    client;
    constructor() {
        this.client = null;
    }
    async executeTransaction(commands) {
        if (!this.client) {
            throw new Error("Redis client not initialized");
        }
        const multi = this.client.multi();
        for (const command of commands) {
            multi[command.cmd].apply(multi, command.args);
        }
        return await multi.exec();
    }
    async exec() {
        if (!this.client) {
            throw new Error("Redis client not initialized");
        }
        const multi = this.client.multi();
        return await multi.exec();
    }
}
//# sourceMappingURL=ioredis.js.map