import { Module } from '@nestjs/common';
import { AgentNftService } from '../../services/agent-nft.service';
import { AgentNftController } from '../../controllers/agent-nft.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [AgentNftController],
  providers: [AgentNftService, PrismaService],
  exports: [AgentNftService],
})
export class AgentNftModule {}