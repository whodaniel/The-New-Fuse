import { Module } from '@nestjs/common';
import { LearningSystem } from './LearningSystem';
import { SystemAdaptor } from './SystemAdaptor';
import { PatternRecognition } from './PatternRecognition';
import { Adaptor } from './adaptor';

@Module({
  providers: [LearningSystem, SystemAdaptor, PatternRecognition, Adaptor],
  exports: [LearningSystem, SystemAdaptor, PatternRecognition, Adaptor],
})
export class LearningModule {}
