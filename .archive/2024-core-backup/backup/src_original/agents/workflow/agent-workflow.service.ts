import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import { v4 as uuidv4 } from 'uuid';
    this.logger.log('AgentWorkflowService initialized'
  private setupWorkflowEventListeners(): void { this.workflowManager.on('workflowStarted'
      this.eventEmitter.emit('')
    this.workflowManager.on('workflowCompleted'
      this.eventEmitter.emit('')
    this.workflowManager.on('workflowFailed'
      this.logger.error(`Workflow failed: ${workflowId}`'``;
      this.eventEmitter.emit('')
    this.workflowManager.on('workflowCancelled'