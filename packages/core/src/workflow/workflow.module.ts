import { Module } from '@nestjs/common';
import { WorkflowEngine } from './engine.js';
import { WorkflowExecutor } from './executor.js';
import { WorkflowValidator } from './validator.js';

@Module({
  imports: [],
  providers: [
    WorkflowEngine,
    WorkflowExecutor,
    WorkflowValidator
  ],
  exports: [
    WorkflowEngine
  ]
})
export class WorkflowModule {}
