import { Module } from '@nestjs/common';
import { CascadeService } from '@the-new-fuse/core';
import { TaskModule } from '../task/task.module';
import { AgentSwarmService } from './agent-swarm.service';
import { BMADService } from './bmad.service';
import { DirectorService } from './director.service';

@Module({
  imports: [TaskModule],
  providers: [DirectorService, BMADService, AgentSwarmService, CascadeService],
  exports: [DirectorService, BMADService, AgentSwarmService],
})
export class DirectorModule {}
