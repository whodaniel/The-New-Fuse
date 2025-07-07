import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AgentRepository } from './repositories/agent.repository';
import { UserRepository } from './repositories/user.repository';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import { TaskRepository } from './repositories/task.repository';
import { WorkflowRepository } from './repositories/workflow.repository';
import { WorkflowExecutionRepository } from './repositories/workflow-execution.repository';

@Global()
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
export class DatabaseModule {}
