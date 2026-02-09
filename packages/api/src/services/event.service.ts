/**
 * Event Service
 * Centralized event bus for application-wide events
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Emit an event
   * @param eventName Name of the event
   * @param payload Event data
   */
  emit(eventName: string, payload: any): void {
    this.logger.debug(`Emitting event: ${eventName}`);
    this.eventEmitter.emit(eventName, payload);
  }

  /**
   * Subscribe to an event
   * @param eventName Name of the event
   * @param listener Event handler function
   * @returns Unsubscribe function
   */
  subscribe(eventName: string, listener: (payload: any) => void): () => void {
    this.logger.debug(`Subscribing to event: ${eventName}`);
    
    const callback = (payload: any) => {
      this.logger.debug(`Received event: ${eventName}`);
      listener(payload);
    };
    
    this.eventEmitter.on(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      this.logger.debug(`Unsubscribing from event: ${eventName}`);
      this.eventEmitter.removeListener(eventName, callback);
    };
  }

  /**
   * Subscribe to an event once
   * @param eventName Name of the event
   * @param listener Event handler function
   * @returns Unsubscribe function
   */
  subscribeOnce(eventName: string, listener: (payload: any) => void): () => void {
    this.logger.debug(`Subscribing once to event: ${eventName}`);
    
    const callback = (payload: any) => {
      this.logger.debug(`Received one-time event: ${eventName}`);
      listener(payload);
    };
    
    this.eventEmitter.once(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      this.logger.debug(`Unsubscribing from one-time event: ${eventName}`);
      this.eventEmitter.removeListener(eventName, callback);
    };
  }
}