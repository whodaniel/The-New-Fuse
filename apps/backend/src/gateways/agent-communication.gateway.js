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
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
let AgentCommunicationGateway = (() => {
    let _classDecorators = [WebSocketGateway({
            cors: {
                origin: '*',
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _server_decorators;
    let _server_initializers = [];
    let _server_extraInitializers = [];
    var AgentCommunicationGateway = _classThis = class {
        constructor(redisService) {
            this.redisService = redisService;
            this.server = __runInitializers(this, _server_initializers, void 0);
            this.logger = (__runInitializers(this, _server_extraInitializers), new Logger('AgentCommunicationGateway'));
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.subscriber = new Redis(redisUrl);
        }
        afterInit() {
            this.logger.log('WebSocket Gateway Initialized');
            this.setupRedisSubscriptions();
        }
        handleConnection(client) {
            this.logger.log(`Client connected: ${client.id}`);
        }
        handleDisconnect(client) {
            this.logger.log(`Client disconnected: ${client.id}`);
        }
        async setupRedisSubscriptions() {
            try {
                // Subscribe to Trae and Augment channels
                await this.subscriber.subscribe('agent:trae', 'agent:augment', 'agent:broadcast');
                this.subscriber.on('message', (channel, message) => {
                    try {
                        const data = JSON.parse(message);
                        // Emit the message to WebSocket clients
                        this.server.emit(channel, {
                            type: channel,
                            payload: data
                        });
                        this.logger.debug(`Forwarded message from ${channel} to WebSocket clients`);
                    }
                    catch (error) {
                        this.logger.error(`Error processing Redis message: ${error.message}`);
                    }
                });
                this.logger.log('Redis subscriptions established');
            }
            catch (error) {
                this.logger.error(`Failed to setup Redis subscriptions: ${error.message}`);
            }
        }
    };
    __setFunctionName(_classThis, "AgentCommunicationGateway");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _server_decorators = [WebSocketServer()];
        __esDecorate(null, null, _server_decorators, { kind: "field", name: "server", static: false, private: false, access: { has: obj => "server" in obj, get: obj => obj.server, set: (obj, value) => { obj.server = value; } }, metadata: _metadata }, _server_initializers, _server_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AgentCommunicationGateway = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AgentCommunicationGateway = _classThis;
})();
export { AgentCommunicationGateway };
