"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AProtocolHandler = void 0;
const common_1 = require("@nestjs/common");
const logger_js_1 = require("../utils/logger.js");
let A2AProtocolHandler = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var A2AProtocolHandler = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            A2AProtocolHandler = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        eventEmitter;
        agentCardService;
        logger = new logger_js_1.Logger(A2AProtocolHandler.name);
        messageHandlers = new Map();
        constructor(eventEmitter, agentCardService) {
            this.eventEmitter = eventEmitter;
            this.agentCardService = agentCardService;
        }
        async handleMessage(message) {
            try {
                // Validate message format
                this.validateMessage(message);
                // Check if target agent exists
                if (message.header.target) {
                    const targetAgent = this.agentCardService.getAgentById(message.header.target);
                    if (!targetAgent) {
                        throw new Error(`Target agent ${message.header.target} not found`);
                    }
                }
                // Get handler for message type
                const handler = this.messageHandlers.get(message.header.type);
                if (!handler) {
                    throw new Error(`No handler registered for message type ${message.header.type}`);
                }
                // Handle message
                await handler(message);
                // Emit event for message handled
                this.eventEmitter.emit('a2a.message.handled', message);
            }
            catch (error) {
                this.logger.error('Failed to handle A2A message', error);
                throw error;
            }
        }
        registerHandler(type, handler) {
            this.messageHandlers.set(type, handler);
            this.logger.debug(`Registered handler for message type ${type}`);
        }
        validateMessage(message) {
            if (!message.header?.id || !message.header?.type || !message.header?.version) {
                throw new Error('Invalid message format: missing required header fields');
            }
            if (!message.body?.content || !message.body?.metadata?.sent_at) {
                throw new Error('Invalid message format: missing required body fields');
            }
        }
    };
    return A2AProtocolHandler = _classThis;
})();
exports.A2AProtocolHandler = A2AProtocolHandler;
//# sourceMappingURL=A2AProtocolHandler.js.map