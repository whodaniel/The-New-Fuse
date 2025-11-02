import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Ap2ProtocolService } from './ap2-protocol.service';
import { Ap2ProtocolController } from './ap2-protocol.controller';

@Module({
  imports: [HttpModule],
  providers: [Ap2ProtocolService],
  controllers: [Ap2ProtocolController],
  exports: [Ap2ProtocolService],
})
export class Ap2ProtocolModule {}
