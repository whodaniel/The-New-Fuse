var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
let AgentBridgeService = (() => {
    let _classDecorators = [WebSocketGateway({
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        }), Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _server_decorators;
    let _server_initializers = [];
    let _server_extraInitializers = [];
    let _handleJoinChannel_decorators;
    let _handleLeaveChannel_decorators;
    let _handleAgentMessage_decorators;
    var AgentBridgeService = _classThis = class {
        constructor(redisService) {
            this.redisService = (__runInitializers(this, _instanceExtraInitializers), redisService);
            this.server = __runInitializers(this, _server_initializers, void 0);
            this.logger = (__runInitializers(this, _server_extraInitializers), new Logger(AgentBridgeService.name));
            this.setupRedisSubscriptions();
        }
        async setupRedisSubscriptions() {
            // Listen for Redis messages and bridge them to WebSocket
            this.redisService.subClient.on('message', (channel, message) => {
                this.handleRedisMessage(channel, message);
            });
        }
        async handleRedisMessage(channel, message) {
            try {
                const data = JSON.parse(message);
                // Emit to appropriate WebSocket room based on channel
                this.server.to(channel).emit('agent_message', {
                    channel,
                    message: data
                });
            }
            catch (error) {
                this.logger.error(`Error handling Redis message: ${error}`);
            }
        }
        handleJoinChannel(client, channel) {
            client.join(channel);
            this.logger.log(`Client ${client.id} joined channel ${channel}`);
        }
        handleLeaveChannel(client, channel) {
            client.leave(channel);
            this.logger.log(`Client ${client.id} left channel ${channel}`);
        }
        async handleAgentMessage(client, payload) {
            const { channel, message } = payload;
            // Forward message to Redis
            if (channel === 'agent:composer') {
                await this.redisService.sendToComposer(message);
            }
            else if (channel === 'agent:roo-coder') {
                await this.redisService.sendToRooCoder(message);
            }
        }
    };
    __setFunctionName(_classThis, "AgentBridgeService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _server_decorators = [WebSocketServer()];
        _handleJoinChannel_decorators = [SubscribeMessage('join_agent_channel')];
        _handleLeaveChannel_decorators = [SubscribeMessage('leave_agent_channel')];
        _handleAgentMessage_decorators = [SubscribeMessage('agent_message')];
        __esDecorate(_classThis, null, _handleJoinChannel_decorators, { kind: "method", name: "handleJoinChannel", static: false, private: false, access: { has: obj => "handleJoinChannel" in obj, get: obj => obj.handleJoinChannel }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleLeaveChannel_decorators, { kind: "method", name: "handleLeaveChannel", static: false, private: false, access: { has: obj => "handleLeaveChannel" in obj, get: obj => obj.handleLeaveChannel }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleAgentMessage_decorators, { kind: "method", name: "handleAgentMessage", static: false, private: false, access: { has: obj => "handleAgentMessage" in obj, get: obj => obj.handleAgentMessage }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _server_decorators, { kind: "field", name: "server", static: false, private: false, access: { has: obj => "server" in obj, get: obj => obj.server, set: (obj, value) => { obj.server = value; } }, metadata: _metadata }, _server_initializers, _server_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AgentBridgeService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AgentBridgeService = _classThis;
})();
export { AgentBridgeService };
