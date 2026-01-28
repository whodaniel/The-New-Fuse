import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SelfImprovementCronService } from './self-improvement-cron.service';
import { SelfImprovementController } from './self-improvement.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [SelfImprovementController],
  providers: [SelfImprovementCronService],
  exports: [SelfImprovementCronService],
})
export class SelfImprovementModule {}
