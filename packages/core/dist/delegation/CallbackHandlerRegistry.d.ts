import { EventEmitter2 } from '@nestjs/event-emitter';
/**
 * @interface SubTaskEvent
 * @description Defines the structure of a sub-task event.
 * @property {any} subTask - The sub-task data.
 * @property {string} parentTaskId - The ID of the parent task.
 * @property {Date} timestamp - The event timestamp.
 */
export interface SubTaskEvent {
    subTask: any;
    parentTaskId: string;
    timestamp: Date;
}
/**
 * @type CallbackHandler
 * @description Defines the function signature for a callback handler.
 */
export type CallbackHandler = (event: SubTaskEvent) => Promise<void>;
/**
 * @class CallbackHandlerRegistry
 * @description A registry for managing and executing callback handlers for sub-task events.
 */
export declare class CallbackHandlerRegistry {
    private eventEmitter;
    private readonly logger;
    private handlers;
    constructor(eventEmitter: EventEmitter2);
    /**
     * Registers a callback handler for a specific parent task ID.
     * @param {string} parentTaskId - The ID of the parent task to register the handler for.
     * @param {CallbackHandler} handler - The callback handler function.
     */
    registerHandler(parentTaskId: string, handler: CallbackHandler): void;
    /**
     * Executes all registered handlers for a given parent task ID.
     * @param {SubTaskEvent} event - The sub-task event.
     */
    executeHandlers(event: SubTaskEvent): Promise<void>;
    /**
     * Listens for the 'subtask.completed' event and executes the appropriate handlers.
     * @param {SubTaskEvent} event - The sub-task event.
     */
    handleSubtaskCompleted(event: SubTaskEvent): void;
}
//# sourceMappingURL=CallbackHandlerRegistry.d.ts.map