"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
/**
 * Base service class providing common functionality for all agent services
 */
const events_1 = require("events");
class BaseService extends events_1.EventEmitter {
    name;
    config;
    startTime;
    isRunning = false;
    constructor(config) {
        super();
        this.name = config.name;
        this.config = config;
    }
    /**
     * Initialize the service
     */
    async initialize() {
        this.emit('initializing', this.name);
        try {
            await this.onInitialize();
            this.isRunning = true;
            this.startTime = new Date();
            this.emit('initialized', this.name);
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Start the service
     */
    async start() {
        if (this.isRunning) {
            return;
        }
        this.emit('starting', this.name);
        try {
            await this.onStart();
            this.isRunning = true;
            this.startTime = new Date();
            this.emit('started', this.name);
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Stop the service
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        this.emit('stopping', this.name);
        try {
            await this.onStop();
            this.isRunning = false;
            this.startTime = undefined;
            this.emit('stopped', this.name);
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Get service status
     */
    getStatus() {
        return {
            name: this.name,
            status: this.isRunning ? 'running' : 'stopped',
            uptime: this.startTime ? Date.now() - this.startTime.getTime() : undefined,
            metadata: this.getStatusMetadata()
        };
    }
    /**
     * Check if service is running
     */
    get running() {
        return this.isRunning;
    }
    /**
     * Get service name
     */
    get serviceName() {
        return this.name;
    }
    /**
     * Override in subclasses for custom initialization logic
     */
    async onInitialize() {
        // Default implementation - override in subclasses
    }
    /**
     * Override in subclasses for custom start logic
     */
    async onStart() {
        // Default implementation - override in subclasses
    }
    /**
     * Override in subclasses for custom stop logic
     */
    async onStop() {
        // Default implementation - override in subclasses
    }
    /**
     * Override in subclasses to provide additional status metadata
     */
    getStatusMetadata() {
        return {};
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=BaseService.js.map