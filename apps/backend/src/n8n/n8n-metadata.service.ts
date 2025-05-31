import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@the-new-fuse/utils';

@Injectable()
export class N8nMetadataService {
  private readonly logger: Logger;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.logger = new Logger({ prefix: 'N8nMetadataService' });
  }

  async getAllNodeTypes() {
    try {
      const n8nUrl = this.configService.get<string>('N8N_URL');
      const n8nApiKey = this.configService.get<string>('N8N_API_KEY');

      if (!n8nUrl || !n8nApiKey) {
        throw new Error('N8N configuration missing');
      }

      const response = await firstValueFrom(
        this.httpService.get(`${n8nUrl}/api/v1/node-types`, {
          headers: {
            'X-N8N-API-KEY': n8nApiKey,
          },
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch node types', error);
      throw error;
    }
  }

  async getNodeTypeDescription(nodeType: string) {
    try {
      const n8nUrl = this.configService.get<string>('N8N_URL');
      const n8nApiKey = this.configService.get<string>('N8N_API_KEY');

      if (!n8nUrl || !n8nApiKey) {
        throw new Error('N8N configuration missing');
      }

      const response = await firstValueFrom(
        this.httpService.get(`${n8nUrl}/api/v1/node-types/${nodeType}`, {
          headers: {
            'X-N8N-API-KEY': n8nApiKey,
          },
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch node type description for ${nodeType}`, error);
      throw error;
    }
  }

  async getCredentialTypes() {
    try {
      const n8nUrl = this.configService.get<string>('N8N_URL');
      const n8nApiKey = this.configService.get<string>('N8N_API_KEY');

      if (!n8nUrl || !n8nApiKey) {
        throw new Error('N8N configuration missing');
      }

      const response = await firstValueFrom(
        this.httpService.get(`${n8nUrl}/api/v1/credentials/schema`, {
          headers: {
            'X-N8N-API-KEY': n8nApiKey,
          },
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch credential types', error);
      throw error;
    }
  }
}
