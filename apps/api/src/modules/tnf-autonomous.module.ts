import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TNFAutonomousController } from '../controllers/tnf-autonomous.controller.js';
import { AgentSwarmService } from './director/agent-swarm.service.js';
import { BMADService } from './director/bmad.service.js';
import { DirectorModule } from './director/director.module.js';
import { DirectorService } from './director/director.service.js';

/**
 * TNF Autonomous Module
 * Main module that wires everything together using the standardized Director components.
 */
@Module({
  imports: [EventEmitterModule, DirectorModule],
  controllers: [TNFAutonomousController],
  exports: [DirectorModule],
})
export class TNFAutonomousModule implements OnModuleInit {
  private readonly logger = new Logger(TNFAutonomousModule.name);

  constructor(
    private readonly director: DirectorService,
    private readonly bmad: BMADService,
    private readonly swarm: AgentSwarmService
  ) {}

  async onModuleInit() {
    this.logger.log('═'.repeat(60));
    this.logger.log('   🔮 THE NEW FUSE - AUTONOMOUS SYSTEM');
    this.logger.log('═'.repeat(60));
    this.logger.log('');
    this.logger.log('   Standardized Components:');
    this.logger.log('   ├── DirectorService (Modern Loop with Drizzle + Redis)');
    this.logger.log('   ├── BMADService (Skills→Tools→Context)');
    this.logger.log('   └── AgentSwarmService (Registry & Heartbeat)');
    this.logger.log('');
    this.logger.log('═'.repeat(60) + '\n');

    // Log initial statistics
    const swarmStats = this.swarm.getStatistics();
    const bmadStats = this.bmad.getStatistics();
    const directorStatus = this.director.getStatus();

    this.logger.log(`📊 Current State:`);
    this.logger.log(
      `   Director: ${directorStatus.isRunning ? 'RUNNING' : 'STOPPED'} (Cycles: ${directorStatus.cycleCount})`
    );
    this.logger.log(`   BMAD Skills: ${bmadStats.skills}`);
    this.logger.log(
      `   Swarm Agents: ${swarmStats.totalAgents} (${swarmStats.onlineAgents} online)`
    );
  }

  /**
   * Get overall system status
   */
  getSystemStatus() {
    return {
      director: this.director.getStatus(),
      bmad: this.bmad.getStatistics(),
      swarm: this.swarm.getStatistics(),
      uptime: process.uptime(),
    };
  }
}

export default TNFAutonomousModule;
