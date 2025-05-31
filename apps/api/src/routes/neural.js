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
let NeuralController = (() => {
    let _classDecorators = [Controller('neural'), UseGuards(AuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _searchMemories_decorators;
    let _addMemory_decorators;
    let _addMemoryBatch_decorators;
    let _renderPrompt_decorators;
    var NeuralController = _classThis = class {
        constructor(agentService, memorySystem, promptService) {
            this.agentService = (__runInitializers(this, _instanceExtraInitializers), agentService);
            this.memorySystem = memorySystem;
            this.promptService = promptService;
        }
        async searchMemories(query) {
            try {
                const results = await this.memorySystem.search(query);
                return {
                    success: true,
                    data: results,
                };
            }
            catch (error) { // Explicitly type error as unknown
                return {
                    success: false,
                    // Check if error is an instance of Error before accessing message
                    error: error instanceof Error ? error.message : 'An unknown error occurred',
                };
            }
        }
        async addMemory(content) {
            try {
                await this.memorySystem.add(content);
                return {
                    success: true,
                    message: 'Memory stored successfully',
                };
            }
            catch (error) { // Explicitly type error as unknown
                return {
                    success: false,
                    // Check if error is an instance of Error before accessing message
                    error: error instanceof Error ? error.message : 'An unknown error occurred',
                };
            }
        }
        async addMemoryBatch(body) {
            try {
                for (const content of body.memories) {
                    await this.memorySystem.add(content);
                }
                return { success: true };
            }
            catch (error) { // Explicitly type error as unknown
                return {
                    success: false,
                    // Check if error is an instance of Error before accessing message
                    error: error instanceof Error ? error.message : 'An unknown error occurred',
                };
            }
        }
        async renderPrompt(data) {
            try {
                let renderedPrompt;
                if (data.agentId) {
                    // For agent-specific templates
                    renderedPrompt = await this.promptService.createAgentTemplate({
                        agentId: data.agentId,
                        name: `Agent Template ${data.templateId}`,
                        description: 'Dynamically created agent template',
                        template: data.templateId,
                        parameters: Object.keys(data.variables).map(key => ({
                            name: key,
                            type: 'string',
                            required: true
                        })),
                        purpose: 'user',
                        category: 'agent_prompts',
                        version: 1,
                        metrics: {
                            successRate: 0,
                            averageResponseTime: 0,
                            errorRate: 0,
                            tokenUsage: {
                                average: 0,
                                total: 0
                            },
                            lastUsed: undefined
                        },
                        metadata: {
                            author: 'system',
                            created: new Date(),
                            updated: new Date(),
                            tags: ['agent', 'dynamic']
                        },
                        contextRequirements: {
                            needsHistory: true,
                            needsMemory: true,
                            needsTools: true,
                            needsState: true
                        },
                        expectedResponse: {
                            format: 'text'
                        }
                    });
                }
                else {
                    // For regular templates
                    renderedPrompt = await this.promptService.renderTemplate(data.templateId, data.variables);
                }
                return {
                    success: true,
                    data: renderedPrompt,
                };
            }
            catch (error) { // Explicitly type error as unknown
                return {
                    success: false,
                    // Check if error is an instance of Error before accessing message
                    error: error instanceof Error ? error.message : 'An unknown error occurred',
                };
            }
        }
    };
    __setFunctionName(_classThis, "NeuralController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _searchMemories_decorators = [Get('search')];
        _addMemory_decorators = [Post('memory')];
        _addMemoryBatch_decorators = [Post('memory/batch')];
        _renderPrompt_decorators = [Post('prompt')];
        __esDecorate(_classThis, null, _searchMemories_decorators, { kind: "method", name: "searchMemories", static: false, private: false, access: { has: obj => "searchMemories" in obj, get: obj => obj.searchMemories }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addMemory_decorators, { kind: "method", name: "addMemory", static: false, private: false, access: { has: obj => "addMemory" in obj, get: obj => obj.addMemory }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addMemoryBatch_decorators, { kind: "method", name: "addMemoryBatch", static: false, private: false, access: { has: obj => "addMemoryBatch" in obj, get: obj => obj.addMemoryBatch }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _renderPrompt_decorators, { kind: "method", name: "renderPrompt", static: false, private: false, access: { has: obj => "renderPrompt" in obj, get: obj => obj.renderPrompt }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        NeuralController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return NeuralController = _classThis;
})();
export { NeuralController };
