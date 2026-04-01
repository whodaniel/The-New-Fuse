import { Body, Controller, Post } from '@nestjs/common';
// @ts-ignore
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';
import { SgpEnvelopeDefaults, SgpNestjsTranslationService } from './sgp-nestjs-translation.service';

class TranslateToNestDto {
  @IsObject()
  envelope!: Record<string, unknown>;
}

class TranslateFromNestDto {
  @IsObject()
  packet!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  defaults?: SgpEnvelopeDefaults;
}

@Controller('sgp')
@ApiTags('sgp')
export class SgpGatewayController {
  constructor(private readonly translationService: SgpNestjsTranslationService) {}

  @Post('translate/to-nest')
  @ApiOperation({ summary: 'Translate SGP envelope into NestJS ReadPacket format' })
  @ApiBody({ type: TranslateToNestDto })
  @ApiResponse({ status: 201, description: 'Translation completed successfully' })
  translateToNest(@Body() body: TranslateToNestDto) {
    const packet = this.translationService.toNestPacket(body.envelope as any);
    return { packet };
  }

  @Post('translate/from-nest')
  @ApiOperation({ summary: 'Translate NestJS ReadPacket into SGP envelope format' })
  @ApiBody({ type: TranslateFromNestDto })
  @ApiResponse({ status: 201, description: 'Translation completed successfully' })
  translateFromNest(@Body() body: TranslateFromNestDto) {
    const envelope = this.translationService.fromNestPacket(body.packet as any, body.defaults);
    return { envelope };
  }
}
