import { Injectable, Logger } from '@nestjs/common';
import { drizzleConfigurationRepository } from '@the-new-fuse/database';

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);

  // --- Generic Configuration (KV) ---

  async findAllConfigs() {
    return drizzleConfigurationRepository.findAllConfigs();
  }

  async findConfigByKey(key: string) {
    return drizzleConfigurationRepository.findConfigByKey(key);
  }

  async updateConfig(key: string, value: string, updatedBy?: string) {
    this.logger.log(`Updating config key: ${key} by ${updatedBy}`);
    return drizzleConfigurationRepository.updateConfig(key, value, updatedBy);
  }

  // --- Application Settings (Singleton) ---

  async getAdminSettings() {
    const settings = await drizzleConfigurationRepository.getSystemSettings();
    if (!settings) {
      // Return default settings if none exist
      return {
        system: {
          maintenanceMode: false,
          debugMode: false,
          logLevel: 'info',
          maxConcurrentUsers: 1000,
          sessionTimeout: 30,
          backupFrequency: 'daily',
        },
        security: {
          enforceSSL: true,
          requireMFA: false,
          passwordPolicy: {
            minLength: 8,
            requireSpecialChars: true,
            requireNumbers: true,
            requireUppercase: true,
          },
          sessionSecurity: {
            maxSessions: 5,
            ipWhitelist: [],
          },
        },
        database: {
          connectionPoolSize: 20,
          queryTimeout: 30,
          enableQueryLogging: false,
          autoBackup: true,
          retentionDays: 30,
        },
        notifications: {
          emailNotifications: true,
          slackIntegration: false,
          webhookUrl: '',
          alertThresholds: {
            cpuUsage: 80,
            memoryUsage: 85,
            diskUsage: 90,
          },
        },
      };
    }
    return settings;
  }

  async updateAdminSettings(settings: any, updatedBy?: string) {
    this.logger.log(`Updating system settings by ${updatedBy}`);
    return drizzleConfigurationRepository.updateSystemSettings(settings, updatedBy);
  }
}
