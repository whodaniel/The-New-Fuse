import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { N8nIntegrationController } from './n8n-integration.controller';
import { N8nMetadataService } from './n8n-metadata.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [N8nIntegrationController],
  providers: [N8nMetadataService],
  exports: [N8nMetadataService],
})
export class N8nModule {}
