import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    // Subscribe to Roo's processed output events
    this.eventEmitter.on('roo.output.processed', (data) => {
      this.handleRooOutput(data);
    });

    // Subscribe to Roo's error events
    this.eventEmitter.on('roo.error', (error) => {
      this.handleRooError(error);
    });
  }

  private handleRooOutput(data: any) {
    const { type, timestamp } = data;
    
    // Log the output with timestamp for tracking
    this.logger.log(`[${timestamp}] Roo ${type} output:`, data);

    // You can add custom notification logic here
    // For example, sending notifications to a UI component
    // or triggering specific actions based on the output type
  }

  private handleRooError(errorData: any) {
    const { error, timestamp } = errorData;
    
    // Log errors with timestamp
    this.logger.error(`[${timestamp}] Roo processing error:`, error);

    // You can add custom error handling logic here
    // For example, sending error notifications or triggering recovery actions
  }
}