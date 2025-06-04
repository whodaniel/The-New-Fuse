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
import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
let ChatController = (() => {
    let _classDecorators = [ApiTags('chat'), Controller('chat')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getChats_decorators;
    let _getChat_decorators;
    let _createChat_decorators;
    var ChatController = _classThis = class {
        constructor(chatService) {
            this.chatService = (__runInitializers(this, _instanceExtraInitializers), chatService);
        }
        async getChats() {
            return this.chatService.findAll();
        }
        async getChat(id) {
            return this.chatService.findOne(id);
        }
        async createChat(createChatDto) {
            return this.chatService.create(createChatDto);
        }
    };
    __setFunctionName(_classThis, "ChatController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getChats_decorators = [Get(), ApiOperation({ summary: 'Get all chats' })];
        _getChat_decorators = [Get(':id'), ApiOperation({ summary: 'Get chat by ID' })];
        _createChat_decorators = [Post(), ApiOperation({ summary: 'Create new chat' })];
        __esDecorate(_classThis, null, _getChats_decorators, { kind: "method", name: "getChats", static: false, private: false, access: { has: obj => "getChats" in obj, get: obj => obj.getChats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getChat_decorators, { kind: "method", name: "getChat", static: false, private: false, access: { has: obj => "getChat" in obj, get: obj => obj.getChat }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createChat_decorators, { kind: "method", name: "createChat", static: false, private: false, access: { has: obj => "createChat" in obj, get: obj => obj.createChat }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatController = _classThis;
})();
export { ChatController };
