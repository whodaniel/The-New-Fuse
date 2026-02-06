// Testing Module - NestJS module configuration for automated testing suite
// Integrates test runner service and controller with dependencies

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TestRunnerService } from './test-runner.service';
import { TestRunnerController } from './test-runner.controller';
import { LoadTestingService } from './load-testing/load-testing.service';
import { ArtifactGenerationService } from './artifacts/artifact-generation.service';

// Import dependency modules (commented out as they need to be created as proper modules)
// import { CacheModule } from '../../cache/src/cache.module';
// import { QueueModule } from '../../job-queue/src/queue.module';
// import { WebSocketModule } from '../../websocket/src/websocket.module';
// import { A2AModule } from '../../a2a-enhanced/src/a2a.module';

@Module({
  imports: [
    ConfigModule,
    // CacheModule,
    // QueueModule,
    // WebSocketModule,
    // A2AModule,
  ],
  controllers: [TestRunnerController],
  providers: [TestRunnerService, LoadTestingService, ArtifactGenerationService],
  exports: [TestRunnerService, LoadTestingService, ArtifactGenerationService],
})
export class TestingModule {}
