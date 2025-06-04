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
let AgentFactory = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AgentFactory = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.activeAgents = new Map();
        }
        async createAgent(type, agentId, config) {
            const instance = {
                id: `${agentId}-instance`,
                type,
                status: 'active',
                config: { ...this.getDefaultConfig(type), ...config }
            };
            this.activeAgents.set(agentId, instance);
            return instance;
        }
        async updateAgent(instanceId, config) {
            const agentId = instanceId.replace('-instance', '');
            const instance = this.activeAgents.get(agentId);
            if (instance) {
                instance.config = { ...instance.config, ...config };
                this.activeAgents.set(agentId, instance);
            }
        }
        async destroyAgent(instanceId) {
            const agentId = instanceId.replace('-instance', '');
            this.activeAgents.delete(agentId);
        }
        getDefaultConfig(type) {
            switch (type) {
                case 'CONVERSATIONAL':
                    return {
                        maxTokens: 4000,
                        temperature: 0.7,
                        model: 'gpt-4'
                    };
                case 'IDE_EXTENSION':
                    return {
                        maxTokens: 2000,
                        temperature: 0.3,
                        model: 'gpt-3.5-turbo'
                    };
                case 'API':
                    return {
                        maxTokens: 1000,
                        temperature: 0.1,
                        model: 'gpt-3.5-turbo'
                    };
                default:
                    return {
                        maxTokens: 2000,
                        temperature: 0.5,
                        model: 'gpt-3.5-turbo'
                    };
            }
        }
        getActiveAgents() {
            return Array.from(this.activeAgents.values());
        }
        getAgent(agentId) {
            return this.activeAgents.get(agentId);
        }
    };
    __setFunctionName(_classThis, "AgentFactory");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AgentFactory = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AgentFactory = _classThis;
})();
export { AgentFactory };
