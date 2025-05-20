import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoadTestingService } from './load-testing/load-testing.service.js';
import { ArtifactGenerationService } from './artifacts/artifact-generation.service.js';

@Module({
  imports: [
    ConfigModule
  ],
  providers: [
    LoadTestingService,
    ArtifactGenerationService
  ],
  exports: [
    LoadTestingService,
    ArtifactGenerationService
  ]
})
export class TestingModule {}
