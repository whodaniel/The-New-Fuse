/**
 * Admin Configuration Service
 */

import { Injectable } from '@nestjs/common';
import { ConfigurationRepository } from '../repositories/configuration.repository';

@Injectable()
export class AdminConfigurationService {
  constructor(private readonly configRepository: ConfigurationRepository) {}

  // KV Configs
  async getAllConfigs() {
    return this.configRepository.findAllConfigs();
  }

  async updateConfig(key: string, value: string, userId: string) {
    return this.configRepository.updateConfig(key, value, userId);
  }

  // System Settings
  async getSettings() {
    return this.configRepository.getSystemSettings();
  }

  async updateSettings(settings: any, userId: string) {
    return this.configRepository.updateSystemSettings(settings, userId);
  }
}
