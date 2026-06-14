"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentProcessor = void 0;
const core_js_1 = require("../types/core.js");
/**
 * Main processor for an agent instance.
 * Routes incoming messages to the appropriate specialized processor (Command, Task, Notification).
 */
class AgentProcessor {
    constructor(agentId, processors = []) {
        this.processors = new Map();
        this.processorsByType = new Map();
        this.running = false;
        this.agentId = agentId;
        this.logger = new core_js_1.Logger(`AgentProcessor [${this.agentId}]`);
        processors.forEach((processor) => this.registerProcessor(processor));
        this.logger.info('AgentProcessor initialized.');
    }
    registerProcessor(processor, options = {}) {
        const id = options.id || processor.id || processor.constructor?.name || 'anonymous-processor';
        const messageTypes = options.messageTypes || processor.messageTypes || [];
        if (this.processors.has(id) && !options.replace) {
            throw new Error(`Processor already registered: ${id}`);
        }
        if (this.processors.has(id)) {
            this.unregisterProcessor(id);
        }
        const registered = { id, messageTypes, processor };
        this.processors.set(id, registered);
        for (const messageType of messageTypes) {
            const key = String(messageType);
            const processorIds = this.processorsByType.get(key) || new Set();
            processorIds.add(id);
            this.processorsByType.set(key, processorIds);
        }
        this.logger.info(`Registered processor ${id}${messageTypes.length ? ` for ${messageTypes.join(', ')}` : ''}.`);
        return registered;
    }
    unregisterProcessor(id) {
        const registered = this.processors.get(id);
        if (!registered) {
            return false;
        }
        this.processors.delete(id);
        for (const processorIds of this.processorsByType.values()) {
            processorIds.delete(id);
        }
        this.logger.info(`Unregistered processor ${id}.`);
        return true;
    }
    getRegisteredProcessors() {
        return Array.from(this.processors.values());
    }
    /**
     * Processes a single incoming message by routing it to the appropriate processor.
     * @param message The message to process.
     */
    async processMessage(message) {
        const typedMessage = this.assertMessage(message);
        this.logger.debug(`Processing message ${typedMessage.id} of type ${typedMessage.type}`);
        try {
            const processors = this.resolveProcessors(typedMessage);
            if (!processors.length) {
                this.logger.warn(`Received message ${typedMessage.id} with unhandled type: ${typedMessage.type}`);
                return [];
            }
            const results = [];
            for (const registered of processors) {
                const result = await registered.processor.process(typedMessage);
                if (typeof result !== 'undefined' && result !== null) {
                    results.push(result);
                }
            }
            return results;
        }
        catch (error) {
            this.logger.error(`Unhandled error processing message ${typedMessage.id} (Type: ${typedMessage.type}): ${error.message}`);
            throw error;
        }
    }
    /**
     * Starts the agent processor (e.g., connecting to message queues, starting listeners).
     */
    async start() {
        if (this.running) {
            return;
        }
        this.logger.info('Starting AgentProcessor...');
        for (const registered of this.processors.values()) {
            if (registered.processor.start) {
                await registered.processor.start();
            }
        }
        this.running = true;
        this.logger.info('AgentProcessor started.');
    }
    /**
     * Stops the agent processor gracefully.
     */
    async stop() {
        if (!this.running) {
            return;
        }
        this.logger.info('Stopping AgentProcessor...');
        for (const registered of Array.from(this.processors.values()).reverse()) {
            if (registered.processor.stop) {
                await registered.processor.stop();
            }
        }
        this.running = false;
        this.logger.info('AgentProcessor stopped.');
    }
    resolveProcessors(message) {
        const directMatches = this.processorsByType.get(String(message.type)) || new Set();
        const candidates = directMatches.size
            ? Array.from(directMatches).map((id) => this.processors.get(id)).filter(Boolean)
            : Array.from(this.processors.values());
        return candidates.filter((registered) => {
            if (!registered.messageTypes.length && !registered.processor.canProcess) {
                return false;
            }
            return registered.processor.canProcess
                ? registered.processor.canProcess(message)
                : registered.messageTypes.map(String).includes(String(message.type));
        });
    }
    assertMessage(message) {
        if (!message || typeof message !== 'object') {
            throw new Error('Processor runtime received a non-object message');
        }
        const candidate = message;
        if (!candidate.id || typeof candidate.id !== 'string') {
            throw new Error('Processor runtime message is missing a string id');
        }
        if (!candidate.type || typeof candidate.type !== 'string') {
            throw new Error(`Processor runtime message ${candidate.id} is missing a string type`);
        }
        if (typeof candidate.content === 'undefined') {
            throw new Error(`Processor runtime message ${candidate.id} is missing content`);
        }
        return candidate;
    }
}
exports.AgentProcessor = AgentProcessor;
//# sourceMappingURL=AgentProcessor.js.map