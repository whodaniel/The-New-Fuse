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
let CacheService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CacheService = _classThis = class {
        constructor(redisService, logger) {
            this.redisService = redisService;
            this.logger = logger;
        }
        /**
         * Set a value in the cache
         * @param key The key to store the value under
         * @param value The value to store
         * @param ttl Time to live in seconds (optional)
         */
        async set(key, value, ttl) {
            try {
                const serializedValue = JSON.stringify(value);
                if (ttl) {
                    await this.redisService.getClient().set(key, serializedValue, 'EX', ttl);
                }
                else {
                    await this.redisService.getClient().set(key, serializedValue);
                }
                this.logger.debug(`Cache set: ${key}`, { ttl });
            }
            catch (error) {
                this.logger.error(`Failed to set cache for key: ${key}`, error);
                throw error;
            }
        }
        /**
         * Get a value from the cache
         * @param key The key to retrieve
         * @returns The stored value or null if not found
         */
        async get(key) {
            try {
                const value = await this.redisService.getClient().get(key);
                if (!value)
                    return null;
                return JSON.parse(value);
            }
            catch (error) {
                this.logger.error(`Failed to get cache for key: ${key}`, error);
                return null;
            }
        }
        /**
         * Delete a value from the cache
         * @param key The key to delete
         */
        async delete(key) {
            try {
                await this.redisService.getClient().del(key);
                this.logger.debug(`Cache deleted: ${key}`);
            }
            catch (error) {
                this.logger.error(`Failed to delete cache for key: ${key}`, error);
                throw error;
            }
        }
        /**
         * Check if a key exists in the cache
         * @param key The key to check
         * @returns True if the key exists, false otherwise
         */
        async exists(key) {
            try {
                const result = await this.redisService.getClient().exists(key);
                return result === 1;
            }
            catch (error) {
                this.logger.error(`Failed to check existence for key: ${key}`, error);
                return false;
            }
        }
        /**
         * Set a hash field in the cache
         * @param key The hash key
         * @param field The field to set
         * @param value The value to set
         */
        async hset(key, field, value) {
            try {
                const serializedValue = JSON.stringify(value);
                await this.redisService.getClient().hset(key, field, serializedValue);
                this.logger.debug(`Cache hset: ${key}.${field}`);
            }
            catch (error) {
                this.logger.error(`Failed to set hash cache for key: ${key}.${field}`, error);
                throw error;
            }
        }
        /**
         * Get a hash field from the cache
         * @param key The hash key
         * @param field The field to get
         * @returns The stored value or null if not found
         */
        async hget(key, field) {
            try {
                const value = await this.redisService.getClient().hget(key, field);
                if (!value)
                    return null;
                return JSON.parse(value);
            }
            catch (error) {
                this.logger.error(`Failed to get hash cache for key: ${key}.${field}`, error);
                return null;
            }
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
