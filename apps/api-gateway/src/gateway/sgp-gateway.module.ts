import { Module } from '@nestjs/common';
import { SgpGatewayController } from './sgp-gateway.controller';
import { SgpNestjsTranslationService } from './sgp-nestjs-translation.service';

@Module({
  controllers: [SgpGatewayController],
  providers: [SgpNestjsTranslationService],
})
export class SgpGatewayModule {}
