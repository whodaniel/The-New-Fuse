import { Module } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AgentsModule {}