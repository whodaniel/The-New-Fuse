import { Module } from '@nestjs/common';
import {
  AgentRepository,
  ChatMessageRepository,
  PrismaService,
  TaskRepository,
  UserRepository,
  WorkflowExecutionRepository,
  WorkflowRepository,
} from '@the-new-fuse/database';

@Module({
  providers: [
    PrismaService,
    AgentRepository,
    UserRepository,
    ChatMessageRepository,
    TaskRepository,
    WorkflowRepository,
    WorkflowExecutionRepository,
  ],
  exports: [
    PrismaService,
    AgentRepository,
    UserRepository,
    ChatMessageRepository,
    TaskRepository,
    WorkflowRepository,
    WorkflowExecutionRepository,
  ],
})
export class PrismaModule {}
