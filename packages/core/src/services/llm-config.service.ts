import { Injectable } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { EncryptionService } from '../security/encryption';
import { LLMConfig } from '@prisma/client';

@Injectable()
export class LlmConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(data: Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<LLMConfig> {
    const encryptedApiKey = await this.encryptionService.encrypt(data.apiKey);
    return this.prisma.lLMConfig.create({
      data: {
        ...data,
        apiKey: encryptedApiKey,
      },
    });
  }

  async findOne(id: string): Promise<LLMConfig | null> {
    const config = await this.prisma.lLMConfig.findUnique({ where: { id } });
    if (config) {
      config.apiKey = await this.encryptionService.decrypt(config.apiKey);
    }
    return config;
  }

  async findMany(): Promise<LLMConfig[]> {
    const configs = await this.prisma.lLMConfig.findMany();
    for (const config of configs) {
      config.apiKey = await this.encryptionService.decrypt(config.apiKey);
    }
    return configs;
  }

  async update(id: string, data: Partial<Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<LLMConfig> {
    if (data.apiKey) {
      data.apiKey = await this.encryptionService.encrypt(data.apiKey);
    }
    return this.prisma.lLMConfig.update({
      where: { id },
      data,
    });
  }
}
