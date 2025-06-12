import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoadTestingService } from './load-testing/load-testing.service';
import { ArtifactGenerationService } from './artifacts/artifact-generation.service';

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
