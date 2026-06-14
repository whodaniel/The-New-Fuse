var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CallbackHandlerRegistry_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
/**
 * @class CallbackHandlerRegistry
 * @description A registry for managing and executing callback handlers for sub-task events.
 */
let CallbackHandlerRegistry = CallbackHandlerRegistry_1 = class CallbackHandlerRegistry {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new Logger(CallbackHandlerRegistry_1.name);
        this.handlers = new Map();
    }
    /**
     * Registers a callback handler for a specific parent task ID.
     * @param {string} parentTaskId - The ID of the parent task to register the handler for.
     * @param {CallbackHandler} handler - The callback handler function.
     */
    registerHandler(parentTaskId, handler) {
        if (!this.handlers.has(parentTaskId)) {
            this.handlers.set(parentTaskId, []);
        }
        this.handlers.get(parentTaskId)?.push(handler);
    }
    /**
     * Executes all registered handlers for a given parent task ID.
     * @param {SubTaskEvent} event - The sub-task event.
     */
    async executeHandlers(event) {
        const { parentTaskId } = event;
        const taskHandlers = this.handlers.get(parentTaskId);
        if (taskHandlers) {
            this.logger.log(`Executing ${taskHandlers.length} handlers for parent task ${parentTaskId}`);
            await Promise.all(taskHandlers.map((handler) => handler(event).catch((error) => this.logger.error(`Error executing handler for parent task ${parentTaskId}:`, error))));
        }
    }
    /**
     * Listens for the 'subtask.completed' event and executes the appropriate handlers.
     * @param {SubTaskEvent} event - The sub-task event.
     */
    handleSubtaskCompleted(event) {
        this.executeHandlers(event);
    }
};
__decorate([
    OnEvent('subtask.completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CallbackHandlerRegistry.prototype, "handleSubtaskCompleted", null);
CallbackHandlerRegistry = CallbackHandlerRegistry_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], CallbackHandlerRegistry);
export { CallbackHandlerRegistry };
//# sourceMappingURL=CallbackHandlerRegistry.js.map