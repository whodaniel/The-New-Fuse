"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisService = exports.RedisServiceImpl = void 0;
const connection_1 = require("../utils/redis/connection");
class RedisServiceImpl {
    client;
    constructor(options) {
        this.client = (0, connection_1.createRedisClient)(options);
    }
    getClient() {
        return this.client;
    }
    // Basic key-value operations
    async get(key) {
        return await this.client.get(key);
    }
    async set(key, value, ttl) {
        if (ttl) {
            return await this.client.set(key, value, "EX", ttl);
        }
        return await this.client.set(key, value);
    }
    async del(key) {
        return await this.client.del(key);
    }
    async exists(key) {
        return await this.client.exists(key);
    }
    async incr(key) {
        return await this.client.incr(key);
    }
    async expire(key, seconds) {
        return await this.client.expire(key, seconds);
    }
    async ttl(key) {
        return await this.client.ttl(key);
    }
    async rename(source, destination) {
        return await this.client.rename(source, destination);
    }
    async type(key) {
        return await this.client.type(key);
    }
    async dbsize() {
        return await this.client.dbsize();
    }
    // Hash operations
    async hset(key, field, value) {
        return await this.client.hset(key, field, value);
    }
    async hget(key, field) {
        return await this.client.hget(key, field);
    }
    async hgetall(key) {
        return await this.client.hgetall(key);
    }
    async hdel(key, field) {
        return await this.client.hdel(key, field);
    }
    async hexists(key, field) {
        return await this.client.hexists(key, field);
    }
    // List operations
    async lpush(key, value) {
        if (Array.isArray(value)) {
            return await this.client.lpush(key, ...value);
        }
        return await this.client.lpush(key, value);
    }
    async rpush(key, value) {
        if (Array.isArray(value)) {
            return await this.client.rpush(key, ...value);
        }
        return await this.client.rpush(key, value);
    }
    async lpop(key) {
        return await this.client.lpop(key);
    }
    async rpop(key) {
        return await this.client.rpop(key);
    }
    async lrange(key, start, stop) {
        return await this.client.lrange(key, start, stop);
    }
    async llen(key) {
        return await this.client.llen(key);
    }
    // Set operations
    async sadd(key, member) {
        if (Array.isArray(member)) {
            return await this.client.sadd(key, ...member);
        }
        return await this.client.sadd(key, member);
    }
    async srem(key, member) {
        if (Array.isArray(member)) {
            return await this.client.srem(key, ...member);
        }
        return await this.client.srem(key, member);
    }
    async smembers(key) {
        return await this.client.smembers(key);
    }
    // Sorted set operations
    async zadd(key, score, member) {
        return await this.client.zadd(key, score, member);
    }
    async zrange(key, start, stop, withScores) {
        if (withScores) {
            return await this.client.zrange(key, start, stop, "WITHSCORES");
        }
        return await this.client.zrange(key, start, stop);
    }
    async zrem(key, member) {
        if (Array.isArray(member)) {
            return await this.client.zrem(key, ...member);
        }
        return await this.client.zrem(key, member);
    }
    // Stream operations
    async xadd(key, id, fields) {
        const args = [];
        for (const [field, value] of Object.entries(fields)) {
            args.push(field, value);
        }
        return await this.client.xadd(key, id, ...args);
    }
    async xdel(key, id) {
        return await this.client.xdel(key, id);
    }
    async xrange(key, start, end, count) {
        if (count !== undefined) {
            return await this.client.xrange(key, start, end, "COUNT", count);
        }
        return await this.client.xrange(key, start, end);
    }
    // Pub/Sub operations
    async publish(channel, message) {
        const messageStr = typeof message === "string" ? message : JSON.stringify(message);
        return await this.client.publish(channel, messageStr);
    }
    async subscribe(channel, callback) {
        await this.client.subscribe(channel);
        this.client.on("message", (ch, msg) => {
            if (ch === channel) {
                callback(msg);
            }
        });
    }
    async unsubscribe(channel) {
        await this.client.unsubscribe(channel);
    }
    // JSON operations (requires RedisJSON module)
    async json_get(key, path) {
        try {
            if (path) {
                return await this.client.call('JSON.GET', key, path);
            }
            return await this.client.call('JSON.GET', key);
        }
        catch (error) {
            // Handle case where RedisJSON module is not loaded
            console.error('Error in json_get:', error);
            return null;
        }
    }
    async json_set(key, path, json) {
        try {
            const jsonStr = typeof json === 'string' ? json : JSON.stringify(json);
            return await this.client.call('JSON.SET', key, path, jsonStr);
        }
        catch (error) {
            // Handle case where RedisJSON module is not loaded
            console.error('Error in json_set:', error);
            throw error;
        }
    }
    async json_del(key, path) {
        try {
            if (path) {
                return await this.client.call('JSON.DEL', key, path);
            }
            return await this.client.call('JSON.DEL', key);
        }
        catch (error) {
            // Handle case where RedisJSON module is not loaded
            console.error('Error in json_del:', error);
            return 0;
        }
    }
    // Vector operations (requires RedisSearch module)
    async set_vector_in_hash(key, field, vector) {
        try {
            const vectorStr = vector.join(',');
            return await this.hset(key, field, vectorStr);
        }
        catch (error) {
            console.error('Error in set_vector_in_hash:', error);
            throw error;
        }
    }
    async get_vector_from_hash(key, field) {
        try {
            const vectorStr = await this.hget(key, field);
            if (!vectorStr)
                return null;
            return vectorStr.split(',').map(Number);
        }
        catch (error) {
            console.error('Error in get_vector_from_hash:', error);
            return null;
        }
    }
    async vector_search_hash(indexName, query, options) {
        try {
            const args = [indexName, query];
            if (options) {
                if (options.return)
                    args.push('RETURN', options.return);
                if (options.limit)
                    args.push('LIMIT', options.limit.offset, options.limit.count);
                if (options.sortBy)
                    args.push('SORTBY', options.sortBy.field, options.sortBy.order);
                if (options.filter)
                    args.push('FILTER', options.filter);
            }
            return await this.client.call('FT.SEARCH', ...args);
        }
        catch (error) {
            console.error('Error in vector_search_hash:', error);
            return [];
        }
    }
    async create_vector_index_hash(indexName, schema) {
        try {
            const args = [indexName, 'SCHEMA'];
            for (const [field, def] of Object.entries(schema)) {
                args.push(field, def.type);
                if (def.options) {
                    for (const [option, value] of Object.entries(def.options)) {
                        args.push(option, value);
                    }
                }
            }
            return await this.client.call('FT.CREATE', ...args);
        }
        catch (error) {
            console.error('Error in create_vector_index_hash:', error);
            throw error;
        }
    }
    // Index operations
    async get_indexes() {
        try {
            return await this.client.call('FT._LIST');
        }
        catch (error) {
            console.error('Error in get_indexes:', error);
            return [];
        }
    }
    async get_index_info(indexName) {
        try {
            const info = await this.client.call('FT.INFO', indexName);
            const result = {};
            for (let i = 0; i < info.length; i += 2) {
                result[info[i]] = info[i + 1];
            }
            return result;
        }
        catch (error) {
            console.error('Error in get_index_info:', error);
            return {};
        }
    }
    async get_indexed_keys_number(indexName) {
        try {
            const info = await this.get_index_info(indexName);
            return info.num_docs || 0;
        }
        catch (error) {
            console.error('Error in get_indexed_keys_number:', error);
            return 0;
        }
    }
    // Utility operations
    async client_list() {
        return await this.client.client('LIST');
    }
    async info(section) {
        if (section) {
            return await this.client.info(section);
        }
        return await this.client.info();
    }
    // Task-specific methods
    async scheduleTask(task) {
        const taskId = String(task.id || Date.now());
        await this.set(`tasks:${taskId}`, JSON.stringify(task));
        await this.client.sadd("tasks:pending", taskId);
        return taskId;
    }
    async getRunningTaskIds() {
        const result = await this.client.smembers("tasks:running");
        if (!result) {
            return [];
        }
        return result;
    }
    async scheduleTaskOptimization(options) {
        await this.set("tasks:optimization", JSON.stringify(options));
    }
    async getTask(id) {
        const result = await this.get(`tasks:${id}`);
        if (!result) {
            return null;
        }
        return JSON.parse(result);
    }
    async cancelTask(id) {
        try {
            await this.client.srem("tasks:pending", id);
            await this.client.srem("tasks:running", id);
            await this.del(`tasks:${id}`);
            return true;
        }
        catch (error) {
            console.error('Error canceling task:', error);
            return false;
        }
    }
    async getNextPendingTasks(limit) {
        try {
            const pendingTaskIds = await this.client.smembers("tasks:pending");
            if (!pendingTaskIds || pendingTaskIds.length === 0) {
                return [];
            }
            const tasks = [];
            const idsToProcess = pendingTaskIds.slice(0, limit);
            for (const id of idsToProcess) {
                const task = await this.getTask(id);
                if (task) {
                    tasks.push(task);
                }
            }
            return tasks;
        }
        catch (error) {
            console.error('Error getting pending tasks:', error);
            return [];
        }
    }
    pipeline() {
        return this.client.pipeline();
    }
}
exports.RedisServiceImpl = RedisServiceImpl;
const createRedisService = (options) => {
    return new RedisServiceImpl(options);
};
exports.createRedisService = createRedisService;
//# sourceMappingURL=redis.service.js.map