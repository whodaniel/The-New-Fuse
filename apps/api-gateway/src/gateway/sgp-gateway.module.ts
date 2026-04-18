import { Module } from '@nestjs/common';
import { SgpGatewayController } from './sgp-gateway.controller.js';
import { SgpNestjsTranslationService } from './sgp-nestjs-translation.service.js';

@Module({
  controllers: [SgpGatewayController],
  providers: [SgpNestjsTranslationService],
})
export class SgpGatewayModule {}
