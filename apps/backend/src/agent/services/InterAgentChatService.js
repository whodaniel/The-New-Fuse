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
let InterAgentChatService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var InterAgentChatService = _classThis = class {
        constructor(configService, redisService, alertService, monitoringService, eventEmitter) {
            this.configService = configService;
            this.redisService = redisService;
            this.alertService = alertService;
            this.monitoringService = monitoringService;
            this.eventEmitter = eventEmitter;
            this.channelPrefix = 'agent-chat';
            this.agentId = this.configService.get('AGENT_ID') || 'unknown-agent';
        }
        async onModuleInit() {
            // Subscribe to messages directed to this agent
            await this.subscribeToAgentChannel();
        }
        /**
         * Subscribe to the agent's message channel
         */
        async subscribeToAgentChannel() {
            const channel = `${this.channelPrefix}:${this.agentId}`;
            try {
                await this.redisService.subscribe(channel, (message) => {
                    this.handleIncomingMessage(message);
                });
                this.monitoringService.logEvent('agent.channel.subscribed', { agentId: this.agentId, channel });
            }
            catch (error) {
                this.alertService.error('agent.channel.subscribe.failed', `Failed to subscribe to channel ${channel}`, { error: error.message });
            }
        }
        /**
         * Handle an incoming message from another agent
         */
        handleIncomingMessage(message) {
            // Validate message
            if (!message || !message.from || !message.content) {
                this.alertService.warning('agent.message.invalid', 'Received invalid message format');
                return;
            }
            // Emit event for message handlers
            this.eventEmitter.emit('agent.message.received', message);
            // Record metric
            this.monitoringService.recordMetric('agent.messages.received', 1, { from: message.from });
        }
        /**
         * Send a message to another agent
         */
        async sendMessage(toAgentId, content, metadata = {}) {
            const messageId = this.generateMessageId();
            const channel = `${this.channelPrefix}:${toAgentId}`;
            const message = {
                id: messageId,
                from: this.agentId,
                to: toAgentId,
                content,
                timestamp: new Date(),
                metadata,
            };
            try {
                await this.redisService.publish(channel, message);
                // Record metric
                this.monitoringService.recordMetric('agent.messages.sent', 1, { to: toAgentId });
                // Emit event
                this.eventEmitter.emit('agent.message.sent', message);
                return messageId;
            }
            catch (error) {
                this.alertService.error('agent.message.send.failed', `Failed to send message to agent ${toAgentId}`, { error: error.message });
                throw error;
            }
        }
        /**
         * Broadcast a message to all agents
         */
        async broadcastMessage(content, metadata = {}) {
            const messageId = this.generateMessageId();
            const channel = `${this.channelPrefix}:broadcast`;
            const message = {
                id: messageId,
                from: this.agentId,
                to: 'broadcast',
                content,
                timestamp: new Date(),
                metadata,
            };
            try {
                await this.redisService.publish(channel, message);
                // Record metric
                this.monitoringService.recordMetric('agent.messages.broadcast', 1);
                // Emit event
                this.eventEmitter.emit('agent.message.broadcast', message);
                return messageId;
            }
            catch (error) {
                this.alertService.error('agent.message.broadcast.failed', 'Failed to broadcast message', { error: error.message });
                throw error;
            }
        }
        /**
         * Generate a unique message ID
         */
        generateMessageId() {
            return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
        /**
         * Check if the agent chat service is healthy
         */
        async checkHealth() {
            try {
                const redisHealth = await this.redisService.checkHealth();
                if (redisHealth.status !== 'healthy') {
                    return {
                        status: 'unhealthy',
                        details: { redis: redisHealth.details },
                    };
                }
                return { status: 'healthy' };
            }
            catch (error) {
                return {
                    status: 'unhealthy',
                    details: error.message,
                };
            }
        }
    };
    __setFunctionName(_classThis, "InterAgentChatService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        InterAgentChatService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return InterAgentChatService = _classThis;
})();
export { InterAgentChatService };
