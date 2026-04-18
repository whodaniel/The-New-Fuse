import { Module } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
import { CascadeService } from '@the-new-fuse/core';
import { TaskModule } from '../task/task.module.js';
import { AgentSwarmService } from './agent-swarm.service.js';
import { BMADService } from './bmad.service.js';
import { DirectorService } from './director.service.js';

@Module({
  imports: [TaskModule],
  providers: [DirectorService, BMADService, AgentSwarmService, CascadeService],
  exports: [DirectorService, BMADService, AgentSwarmService],
})
export class DirectorModule {}
