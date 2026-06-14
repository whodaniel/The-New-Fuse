"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentHarnessExtensionHost = void 0;
const core_js_1 = require("../types/core.js");
class AgentHarnessExtensionHost {
    constructor(agentId, processor) {
        this.agentId = agentId;
        this.processor = processor;
        this.extensions = new Map();
        this.logger = new core_js_1.Logger(`AgentHarnessExtensionHost [${agentId}]`);
    }
    async registerExtension(extension, options = {}) {
        const id = options.id || extension.id;
        if (!id) {
            throw new Error('Agent harness extension id is required');
        }
        if (this.extensions.has(id) && !options.replace) {
            throw new Error(`Agent harness extension already registered: ${id}`);
        }
        if (this.extensions.has(id)) {
            await this.unregisterExtension(id);
        }
        const context = this.createContext();
        if (extension.canExtend && !(await extension.canExtend(context))) {
            throw new Error(`Agent harness extension refused context: ${id}`);
        }
        const processorIds = [];
        for (const runtimeProcessor of extension.processors || []) {
            const processorOptions = options.processorOptions?.[runtimeProcessor.id || ''] || {};
            const registered = this.processor.registerProcessor(runtimeProcessor, {
                ...processorOptions,
                replace: options.replace || processorOptions.replace,
            });
            processorIds.push(registered.id);
        }
        if (extension.activate) {
            await extension.activate(context);
        }
        this.extensions.set(id, { extension, processorIds });
        this.logger.info(`Registered agent harness extension ${id}.`);
    }
    async unregisterExtension(id) {
        const registered = this.extensions.get(id);
        if (!registered) {
            return false;
        }
        const context = this.createContext();
        if (registered.extension.deactivate) {
            await registered.extension.deactivate(context);
        }
        for (const processorId of registered.processorIds) {
            this.processor.unregisterProcessor(processorId);
        }
        this.extensions.delete(id);
        this.logger.info(`Unregistered agent harness extension ${id}.`);
        return true;
    }
    listExtensions() {
        return Array.from(this.extensions.values()).map((entry) => entry.extension);
    }
    createContext() {
        return {
            agentId: this.agentId,
            processor: this.processor,
            logger: this.logger,
        };
    }
}
exports.AgentHarnessExtensionHost = AgentHarnessExtensionHost;
//# sourceMappingURL=AgentHarnessExtension.js.map