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
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard.js';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
let ChatController = (() => {
    let _classDecorators = [ApiTags('chat'), Controller('chat'), UseGuards(AuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getRooms_decorators;
    let _getRoom_decorators;
    let _getMessages_decorators;
    let _sendMessage_decorators;
    let _getAnalytics_decorators;
    var ChatController = _classThis = class {
        constructor(chatService) {
            this.chatService = (__runInitializers(this, _instanceExtraInitializers), chatService);
        }
        async getRooms() {
            return this.chatService.getRooms();
        }
        async getRoom(roomId) {
            return this.chatService.getRoom(roomId);
        }
        async getMessages(roomId, limit, offset) {
            return this.chatService.getMessages(roomId, { limit, offset });
        }
        async sendMessage(roomId, createMessageDto) {
            return this.chatService.sendMessage(roomId, createMessageDto);
        }
        async getAnalytics() {
            return this.chatService.getAnalytics();
        }
    };
    __setFunctionName(_classThis, "ChatController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getRooms_decorators = [Get('rooms'), ApiOperation({ summary: 'Get all chat rooms' }), ApiResponse({ status: 200, description: 'Return all chat rooms' })];
        _getRoom_decorators = [Get('rooms/:roomId'), ApiOperation({ summary: 'Get chat room by id' }), ApiResponse({ status: 200, description: 'Return chat room by id' })];
        _getMessages_decorators = [Get('rooms/:roomId/messages'), ApiOperation({ summary: 'Get messages in room' }), ApiResponse({ status: 200, description: 'Return messages in room' })];
        _sendMessage_decorators = [Post('rooms/:roomId/messages'), ApiOperation({ summary: 'Send message to room' }), ApiResponse({ status: 201, description: 'Message sent successfully' })];
        _getAnalytics_decorators = [Get('analytics'), ApiOperation({ summary: 'Get chat analytics' }), ApiResponse({ status: 200, description: 'Return chat analytics' })];
        __esDecorate(_classThis, null, _getRooms_decorators, { kind: "method", name: "getRooms", static: false, private: false, access: { has: obj => "getRooms" in obj, get: obj => obj.getRooms }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRoom_decorators, { kind: "method", name: "getRoom", static: false, private: false, access: { has: obj => "getRoom" in obj, get: obj => obj.getRoom }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMessages_decorators, { kind: "method", name: "getMessages", static: false, private: false, access: { has: obj => "getMessages" in obj, get: obj => obj.getMessages }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendMessage_decorators, { kind: "method", name: "sendMessage", static: false, private: false, access: { has: obj => "sendMessage" in obj, get: obj => obj.sendMessage }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAnalytics_decorators, { kind: "method", name: "getAnalytics", static: false, private: false, access: { has: obj => "getAnalytics" in obj, get: obj => obj.getAnalytics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatController = _classThis;
})();
export { ChatController };
