import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WorkflowEngine } from './WorkflowEngine.js';
import { WorkflowExecutor } from './WorkflowExecutor.js';
import { WorkflowValidator } from './validator.js';
import { WorkflowVersionManager } from './versioning.js';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [WorkflowEngine, WorkflowExecutor, WorkflowValidator, WorkflowVersionManager],
  exports: [WorkflowEngine, WorkflowExecutor, WorkflowValidator, WorkflowVersionManager],
})
export class WorkflowModule {}
