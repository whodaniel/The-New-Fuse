import { Module } from '@nestjs/common';
import { TerminalsController } from './terminals.controller.js';
import { TerminalsService } from './terminals.service.js';

@Module({
  controllers: [TerminalsController],
  providers: [TerminalsService],
  exports: [TerminalsService],
})
export class TerminalsModule {}

