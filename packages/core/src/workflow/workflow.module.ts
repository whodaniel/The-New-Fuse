import { Module } from '@nestjs/common';
import { WorkflowEngine } from './engine.tsx';
import { WorkflowExecutor } from './executor.tsx';
import { WorkflowValidator } from './validator.tsx';

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
