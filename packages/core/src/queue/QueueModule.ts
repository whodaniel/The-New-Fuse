import { Module, Global } from '@nestjs/common';
import { QueueService } from './QueueService.tsx';

@Global()
@Module({
  providers: [
    QueueService
  ],
  exports: [
    QueueService
  ]
})
export class QueueModule {}
