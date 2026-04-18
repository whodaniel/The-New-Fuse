// Testing Module - NestJS module configuration for automated testing suite
// Integrates test runner service and controller with dependencies

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TestRunnerService } from './test-runner.service';
import { TestRunnerController } from './test-runner.controller';
import { LoadTestingService } from './load-testing/load-testing.service';
import { ArtifactGenerationService } from './artifacts/artifact-generation.service';

// TODO: Add CacheModule, QueueModule, WebSocketModule, A2AModule when ready

@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [TestRunnerController],
  providers: [
    TestRunnerService,
    LoadTestingService,
    ArtifactGenerationService,
  ],
  exports: [
    TestRunnerService,
    LoadTestingService,
    ArtifactGenerationService,
  ],
})
export class TestingModule {}
