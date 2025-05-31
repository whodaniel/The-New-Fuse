var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';
let CacheService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CacheService = _classThis = class {
        constructor(redisUrl = process.env.REDIS_URL || 'redis://localhost:6379') {
            this.defaultTTL = 3600; // 1 hour
            this.redis = new Redis(redisUrl);
            this.logger = new Logger(CacheService.name);
            this.redis.on('error', (error) => {
                this.logger.error(`Redis cache error: ${error.message}`);
            });
        }
        getKey(key, namespace) {
            return namespace ? `${namespace}:${key}` : key;
        }
        async set(key, value, options = {}) {
            try {
                const finalKey = this.getKey(key, options.namespace);
                const serializedValue = JSON.stringify(value);
                const ttl = options.ttl || this.defaultTTL;
                await this.redis.setex(finalKey, ttl, serializedValue);
            }
            catch (error) {
                this.logger.error(`Cache set error: ${error.message}`);
                throw error;
            }
        }
        async get(key, namespace) {
            try {
                const finalKey = this.getKey(key, namespace);
                const value = await this.redis.get(finalKey);
                return value ? JSON.parse(value) : null;
            }
            catch (error) {
                this.logger.error(`Cache get error: ${error.message}`);
                throw error;
            }
        }
        async delete(key, namespace) {
            try {
                const finalKey = this.getKey(key, namespace);
                await this.redis.del(finalKey);
            }
            catch (error) {
                this.logger.error(`Cache delete error: ${error.message}`);
                throw error;
            }
        }
        async has(key, namespace) {
            try {
                const finalKey = this.getKey(key, namespace);
                return await this.redis.exists(finalKey) === 1;
            }
            catch (error) {
                this.logger.error(`Cache has error: ${error.message}`);
                throw error;
            }
        }
        async clear(namespace) {
            try {
                if (namespace) {
                    const keys = await this.redis.keys(`${namespace}:*`);
                    if (keys.length > 0) {
                        await this.redis.del(...keys);
                    }
                }
                else {
                    await this.redis.flushdb();
                }
            }
            catch (error) {
                this.logger.error(`Cache clear error: ${error.message}`);
                throw error;
            }
        }
        async getMultiple(keys, namespace) {
            try {
                const finalKeys = keys.map(key => this.getKey(key, namespace));
                const values = await this.redis.mget(...finalKeys);
                return values.map(value => (value ? JSON.parse(value) : null));
            }
            catch (error) {
                this.logger.error(`Cache getMultiple error: ${error.message}`);
                throw error;
            }
        }
        async setMultiple(entries, options = {}) {
            try {
                const pipeline = this.redis.pipeline();
                const ttl = options.ttl || this.defaultTTL;
                entries.forEach(({ key, value }) => {
                    const finalKey = this.getKey(key, options.namespace);
                    const serializedValue = JSON.stringify(value);
                    pipeline.setex(finalKey, ttl, serializedValue);
                });
                await pipeline.exec();
            }
            catch (error) {
                this.logger.error(`Cache setMultiple error: ${error.message}`);
                throw error;
            }
        }
        async close() {
            await this.redis.quit();
        }
    };
    __setFunctionName(_classThis, "CacheService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CacheService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CacheService = _classThis;
})();
export { CacheService };
