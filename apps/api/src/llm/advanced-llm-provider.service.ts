import { Injectable } from '@nestjs/common';
import { ProviderService } from '@the-new-fuse/agent';
import {
  ProviderDefinition,
  AuthProfile,
  ProviderConfig
} from '@the-new-fuse/types';

@Injectable()
export class AdvancedLLMProviderService {
  private providerService: ProviderService;

  constructor() {
    this.providerService = new ProviderService();
  }

  async listProviders(): Promise<ProviderDefinition[]> {
    return this.providerService.listProviders();
  }

  async getAuthProfiles(): Promise<AuthProfile[]> {
    return this.providerService.getAuthProfiles();
  }

  async addAuthProfile(profile: AuthProfile): Promise<void> {
    this.providerService.addAuthProfile(profile);
  }

  async removeAuthProfile(id: string): Promise<void> {
    this.providerService.removeAuthProfile(id);
  }

  async getConfig(): Promise<ProviderConfig> {
    return this.providerService.getConfig();
  }

  async saveConfig(config: ProviderConfig): Promise<void> {
    this.providerService.saveConfig(config);
  }
}
