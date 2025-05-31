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
import { WebSocketGateway as NestWebSocketGateway, WebSocketServer, SubscribeMessage, } from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
let WebSocketGateway = (() => {
    let _classDecorators = [Injectable(), NestWebSocketGateway({
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
    let _handleJoinRoom_decorators;
    let _handleLeaveRoom_decorators;
    var WebSocketGateway = _classThis = class {
        constructor() {
            this.server = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _server_initializers, void 0));
            this.logger = (__runInitializers(this, _server_extraInitializers), new Logger('WebSocketGateway'));
        }
        async handleConnection(client) {
            try {
                const userId = client.handshake.query.userId;
                if (!userId) {
                    client.disconnect();
                    return;
                }
                this.logger.log(`Client connected: ${client.id}`);
            }
            catch (error) {
                this.logger.error('Connection error:', error);
                client.disconnect();
            }
        }
        async handleDisconnect(client) {
            try {
                this.logger.log(`Client disconnected: ${client.id}`);
            }
            catch (error) {
                this.logger.error('Disconnection error:', error);
            }
        }
        async handleJoinRoom(client, roomId) {
            client.join(roomId);
            this.logger.log(`Client ${client.id} joined room ${roomId}`);
        }
        async handleLeaveRoom(client, roomId) {
            client.leave(roomId);
            this.logger.log(`Client ${client.id} left room ${roomId}`);
        }
        emitMessage(roomId, message) {
            this.server.to(roomId).emit('message', message);
        }
    };
    __setFunctionName(_classThis, "WebSocketGateway");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _server_decorators = [WebSocketServer()];
        _handleJoinRoom_decorators = [SubscribeMessage('joinRoom')];
        _handleLeaveRoom_decorators = [SubscribeMessage('leaveRoom')];
        __esDecorate(_classThis, null, _handleJoinRoom_decorators, { kind: "method", name: "handleJoinRoom", static: false, private: false, access: { has: obj => "handleJoinRoom" in obj, get: obj => obj.handleJoinRoom }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleLeaveRoom_decorators, { kind: "method", name: "handleLeaveRoom", static: false, private: false, access: { has: obj => "handleLeaveRoom" in obj, get: obj => obj.handleLeaveRoom }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _server_decorators, { kind: "field", name: "server", static: false, private: false, access: { has: obj => "server" in obj, get: obj => obj.server, set: (obj, value) => { obj.server = value; } }, metadata: _metadata }, _server_initializers, _server_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WebSocketGateway = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WebSocketGateway = _classThis;
})();
export { WebSocketGateway };
