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
let RedisService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RedisService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
            this.client = new Redis(redisUrl);
            this.pubClient = new Redis(redisUrl);
            this.subClient = new Redis(redisUrl);
        }
        async get(key) {
            return this.client.get(key);
        }
        async set(key, value) {
            return this.client.set(key, value);
        }
        async setex(key, ttl, value) {
            return this.client.setex(key, ttl, value);
        }
        async del(key) {
            return this.client.del(key);
        }
        async exists(key) {
            return this.client.exists(key);
        }
        async flushall() {
            return this.client.flushall();
        }
        async publish(channel, message) {
            return this.pubClient.publish(channel, message);
        }
        async subscribe(channel) {
            await this.subClient.subscribe(channel);
        }
        async onModuleInit() {
            // Subscribe to agent communication channels
            await this.subClient.subscribe('agent:composer', 'agent:roo-coder');
            this.subClient.on('message', (channel, message) => {
                this.handleAgentMessage(channel, message);
            });
        }
        async onModuleDestroy() {
            await this.client.quit();
            await this.pubClient.quit();
            await this.subClient.quit();
        }
        async handleAgentMessage(channel, message) {
            try {
                const data = JSON.parse(message);
                switch (channel) {
                    case 'agent:composer':
                        await this.handleComposerMessage(data);
                        break;
                    case 'agent:roo-coder':
                        await this.handleRooCoderMessage(data);
                        break;
                }
            }
            catch (error) {
                console.error('Error handling agent message:', error);
            }
        }
        async handleComposerMessage(data) {
            // Handle messages from Composer agent
        }
        async handleRooCoderMessage(data) {
            // Handle messages from Roo Coder agent
        }
        async sendToComposer(message) {
            await this.pubClient.publish('agent:composer', JSON.stringify(message));
        }
        async sendToRooCoder(message) {
            await this.pubClient.publish('agent:roo-coder', JSON.stringify(message));
        }
        // Helper methods for agent communication
        async getAgentState(agentId) {
            const state = await this.client.get(`agent:state:${agentId}`);
            return state ? JSON.parse(state) : null;
        }
        async setAgentState(agentId, state) {
            await this.client.set(`agent:state:${agentId}`, JSON.stringify(state));
        }
        async clearAgentState(agentId) {
            await this.client.del(`agent:state:${agentId}`);
        }
        async getTasks() {
            // Implementation...
        }
        async cleanup() {
            // Implementation...
        }
    };
    __setFunctionName(_classThis, "RedisService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RedisService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RedisService = _classThis;
})();
export { RedisService };
