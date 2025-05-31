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
import { WebSocketGateway, WebSocketServer, SubscribeMessage, } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../auth/ws-auth.guard.js'; // Changed from @/auth/ws-auth.guard
let WebsocketGateway = (() => {
    let _classDecorators = [WebSocketGateway({
            cors: {
                origin: process.env.FRONTEND_URL,
                credentials: true,
            },
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _server_decorators;
    let _server_initializers = [];
    let _server_extraInitializers = [];
    let _handleMessage_decorators;
    var WebsocketGateway = _classThis = class {
        constructor(cache, monitoring) {
            this.cache = (__runInitializers(this, _instanceExtraInitializers), cache);
            this.monitoring = monitoring;
            this.server = __runInitializers(this, _server_initializers, void 0);
            __runInitializers(this, _server_extraInitializers);
            this.cache = cache;
            this.monitoring = monitoring;
        }
        async handleConnection(client) {
            try {
                const userId = client.handshake.auth.token;
                await this.cache.set(`socket:${client.id}`, userId);
                await this.cache.sadd(`online_users`, userId);
                this.monitoring.recordMetric('websocket.connection', 1, { userId });
                this.server.emit('users:online', {
                    count: await this.cache.scard('online_users')
                });
            }
            catch (error) {
                this.monitoring.captureError(error);
                client.disconnect();
            }
        }
        async handleDisconnect(client) {
            const userId = await this.cache.get(`socket:${client.id}`);
            await this.cache.del(`socket:${client.id}`);
            await this.cache.srem('online_users', userId);
            this.monitoring.recordMetric('websocket.disconnect', 1, { userId });
            this.server.emit('users:online', {
                count: await this.cache.scard('online_users')
            });
        }
        async handleMessage(client, payload) {
            try {
                const userId = await this.cache.get(`socket:${client.id}`);
                // Process and broadcast message
                this.server.to(payload.roomId).emit('agent:message', {
                    ...payload,
                    timestamp: new Date(),
                });
                this.monitoring.recordMetric('websocket.message', 1, {
                    userId,
                    agentId: payload.agentId
                });
            }
            catch (error) {
                this.monitoring.captureError(error);
                client.emit('error', { message: 'Failed to process message' });
            }
        }
    };
    __setFunctionName(_classThis, "WebsocketGateway");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _server_decorators = [WebSocketServer()];
        _handleMessage_decorators = [UseGuards(WsAuthGuard), SubscribeMessage('agent:message')];
        __esDecorate(_classThis, null, _handleMessage_decorators, { kind: "method", name: "handleMessage", static: false, private: false, access: { has: obj => "handleMessage" in obj, get: obj => obj.handleMessage }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _server_decorators, { kind: "field", name: "server", static: false, private: false, access: { has: obj => "server" in obj, get: obj => obj.server, set: (obj, value) => { obj.server = value; } }, metadata: _metadata }, _server_initializers, _server_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WebsocketGateway = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WebsocketGateway = _classThis;
})();
export { WebsocketGateway };
