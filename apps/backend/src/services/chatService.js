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
export var MessageRole;
(function (MessageRole) {
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
    // Add other roles if applicable
})(MessageRole || (MessageRole = {}));
let ChatService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ChatService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
        }
        async addMessage(userId, role, content) {
            return this.prisma.chatMessage.create({
                data: {
                    userId,
                    role,
                    content
                }
            });
        }
        async getMessages(userId, limit = 100) {
            return this.prisma.chatMessage.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit
            });
        }
        async getMessagesBetweenAgents(fromAgentId, toAgentId, limit = 100) {
            // Note: The ChatMessage schema doesn't have fromAgentId/toAgentId fields
            // This is a placeholder implementation that needs schema updates
            return this.prisma.chatMessage.findMany({
                where: {
                    // For now, just filter by user that might represent an agent
                    userId: fromAgentId
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            });
        }
        async getChatHistory(userId, page = 1, pageSize = 20) {
            const skip = (page - 1) * pageSize;
            const [messages, total] = await this.prisma.$transaction([
                this.prisma.chatMessage.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: pageSize,
                }),
                this.prisma.chatMessage.count({ where: { userId } }),
            ]);
            const hasMore = skip + messages.length < total;
            return { messages, total, hasMore, currentPage: page, pageSize };
        }
        async clearChatHistory(userId) {
            return this.prisma.chatMessage.deleteMany({
                where: { userId }
            });
        }
    };
    __setFunctionName(_classThis, "ChatService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatService = _classThis;
})();
export { ChatService };
