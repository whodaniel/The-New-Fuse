import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SelfImprovementCronService } from './self-improvement-cron.service.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  providers: [SelfImprovementCronService],
  exports: [SelfImprovementCronService],
})
export class SelfImprovementModule {}
