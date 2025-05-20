import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningSystem } from './LearningSystem.js';
import { PatternRecognition } from './PatternRecognition.js';
import { Pattern } from '@the-new-fuse/database/src/models/Pattern';
import { LearningEvent } from '@the-new-fuse/database/src/models/LearningEvent';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pattern, LearningEvent])
  ],
  providers: [
    LearningSystem,
    PatternRecognition
  ],
  exports: [
    LearningSystem,
    PatternRecognition
  ]
})
export class LearningModule implements OnModuleInit {
  constructor(
    private readonly learningSystem: LearningSystem
  ) {}

  async onModuleInit(): Promise<void> {
    await this.learningSystem.initialize();
  }
}
