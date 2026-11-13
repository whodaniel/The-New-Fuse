import { Module } from '@nestjs/common';
import { PersonalIntelligenceController } from './personal-intelligence.controller';
import { PersonalIntelligenceService } from './personal-intelligence.service';

@Module({
  controllers: [PersonalIntelligenceController],
  providers: [PersonalIntelligenceService],
  exports: [PersonalIntelligenceService],
})
export class PersonalIntelligenceModule {}
