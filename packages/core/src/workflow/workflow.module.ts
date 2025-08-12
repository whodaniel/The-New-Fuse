import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WorkflowEngine } from './engine';
import { WorkflowExecutor } from './executor';
import { WorkflowValidator } from './validator';
import { WorkflowVersionManager } from './versioning';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    WorkflowEngine,
    WorkflowExecutor,
    WorkflowValidator,
    WorkflowVersionManager,
  ],
  exports: [
    WorkflowEngine,
    WorkflowExecutor,
    WorkflowValidator,
    WorkflowVersionManager,
  ],
})
export class WorkflowModule {}