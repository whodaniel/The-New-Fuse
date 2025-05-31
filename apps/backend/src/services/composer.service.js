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
let ComposerService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ComposerService = _classThis = class {
        constructor(redisService, agentService) {
            this.redisService = redisService;
            this.agentService = agentService;
        }
        async onModuleInit() {
            // Subscribe to agent messages using the public method instead of directly accessing subClient
            await this.redisService.subscribeToChannel('agent:messages', async (message) => {
                try {
                    const data = JSON.parse(message);
                    // Process the agent message
                    console.log('Received agent message:', data);
                    // Handle different message types
                    if (data.type === 'status_update') {
                        await this.handleStatusUpdate(data);
                    }
                    else if (data.type === 'communication') {
                        await this.handleCommunication(data);
                    }
                }
                catch (error) {
                    console.error('Error processing agent message:', error);
                }
            });
        }
        async handleStatusUpdate(data) {
            const { agentId, status, userId } = data;
            try {
                // Update the agent status
                await this.agentService.updateAgentStatus(agentId, status, userId);
                console.log(`Updated agent ${agentId} status to ${status}`);
            }
            catch (error) {
                console.error('Error updating agent status:', error);
            }
        }
        async handleCommunication(data) {
            const { fromAgentId, toAgentId, content, userId } = data;
            try {
                // Validate both agents exist and belong to the user
                const [fromAgent, toAgent] = await Promise.all([
                    this.agentService.getAgentById(fromAgentId, userId),
                    this.agentService.getAgentById(toAgentId, userId)
                ]);
                if (!fromAgent || !toAgent) {
                    console.error('One or both agents not found or not authorized');
                    return;
                }
                // Process the communication between agents
                console.log(`Communication from ${fromAgent.name} to ${toAgent.name}: ${content}`);
                // Forward the message to the target agent's channel
                await this.redisService.publish(`agent:${toAgentId}`, JSON.stringify({
                    type: 'message',
                    fromAgentId,
                    fromAgentName: fromAgent.name,
                    content,
                    timestamp: new Date().toISOString()
                }));
            }
            catch (error) {
                console.error('Error handling agent communication:', error);
            }
        }
    };
    __setFunctionName(_classThis, "ComposerService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ComposerService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ComposerService = _classThis;
})();
export { ComposerService };
