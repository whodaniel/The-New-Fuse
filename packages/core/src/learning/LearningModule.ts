import { Module } from '@nestjs/common';
import { LearningSystem } from './LearningSystem.js';
import { SystemAdaptor } from './SystemAdaptor.js';
import { PatternRecognition } from './PatternRecognition.js';
import { Adaptor } from './adaptor.js';

@Module({
  providers: [LearningSystem, SystemAdaptor, PatternRecognition, Adaptor],
  exports: [LearningSystem, SystemAdaptor, PatternRecognition, Adaptor],
})
export class LearningModule {}
