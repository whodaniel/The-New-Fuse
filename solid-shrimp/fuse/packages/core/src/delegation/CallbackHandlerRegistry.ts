import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

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
@Injectable()
export class CallbackHandlerRegistry {
  private readonly logger = new Logger(CallbackHandlerRegistry.name);
  private handlers: Map<string, CallbackHandler[]> = new Map();

  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Registers a callback handler for a specific parent task ID.
   * @param {string} parentTaskId - The ID of the parent task to register the handler for.
   * @param {CallbackHandler} handler - The callback handler function.
   */
  registerHandler(parentTaskId: string, handler: CallbackHandler): void {
    if (!this.handlers.has(parentTaskId)) {
      this.handlers.set(parentTaskId, []);
    }
    this.handlers.get(parentTaskId)?.push(handler);
  }

  /**
   * Executes all registered handlers for a given parent task ID.
   * @param {SubTaskEvent} event - The sub-task event.
   */
  async executeHandlers(event: SubTaskEvent): Promise<void> {
    const { parentTaskId } = event;
    const taskHandlers = this.handlers.get(parentTaskId);

    if (taskHandlers) {
      this.logger.log(`Executing ${taskHandlers.length} handlers for parent task ${parentTaskId}`);
      await Promise.all(
        taskHandlers.map((handler) =>
          handler(event).catch((error) =>
            this.logger.error(`Error executing handler for parent task ${parentTaskId}:`, error),
          ),
        ),
      );
    }
  }

  /**
   * Listens for the 'subtask.completed' event and executes the appropriate handlers.
   * @param {SubTaskEvent} event - The sub-task event.
   */
  @OnEvent('subtask.completed')
  handleSubtaskCompleted(event: SubTaskEvent) {
    this.executeHandlers(event);
  }
}
