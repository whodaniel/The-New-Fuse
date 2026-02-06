import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { Ap2ProtocolController } from './ap2-protocol.controller';
import { Ap2ProtocolService } from './ap2-protocol.service';

@Module({
  imports: [HttpModule],
  providers: [Ap2ProtocolService],
  controllers: [Ap2ProtocolController],
  exports: [Ap2ProtocolService],
})
export class Ap2ProtocolModule {}
