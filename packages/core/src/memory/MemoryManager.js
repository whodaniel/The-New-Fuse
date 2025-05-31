"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManager = void 0;
class MemoryManager {
    redis;
    db;
    constructor() {
        this.redis = new ioredis_1.Redis(process, string, value, unknown);
        Promise < void  > {
            // Short-term memory (Redis)
            await, this: .redis.set(key, JSON.stringify(value)),
            // Long-term memory (Database)
            await, this: .db.memories.create({
                data: {
                    key,
                    value: JSON.stringify(value), new: Date()
                }
            })
        };
        async;
        get();
        Promise < void  > { key: string, Promise() {
                // Try short-term memory first
                const shortTerm;
                void {
                    return: JSON.parse(shortTerm)
                };
                // Fall back to long-term memory
                const longTerm = await this.redis.get(key);
                if (shortTerm)
                    await this.db.memories.findFirst({
                        where: { key },
                        orderBy: { timestamp: desc, ' }: 
                        }
                    });
                return longTerm ? JSON.parse(longTerm.value, unknown) : null;
            },
            async clear() {
                key: string;
                Promise < void  > {
                    await: this.redis.del(key),
                    await: this.db.memories.deleteMany({
                        where: { key }
                    })
                };
                async;
                disconnect();
                Promise < void  > { void:  > {
                        await: this.redis.disconnect(),
                        await: this.db.$disconnect()
                    } };
            } };
    }
}
exports.MemoryManager = MemoryManager;
//# sourceMappingURL=MemoryManager.js.map