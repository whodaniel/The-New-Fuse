import { Module } from '@nestjs/common';
import { AgentNftController } from '../../controllers/agent-nft.controller';
import { AgentNftService } from '../../services/agent-nft.service';

@Module({
  controllers: [AgentNftController],
  providers: [AgentNftService],
  exports: [AgentNftService],
})
export class AgentNftModule {}
