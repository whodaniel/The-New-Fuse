/**
 * Configuration Repository - Drizzle ORM Analysis
 *
 * Adapted for NestJS Dependency Injection.
 */

import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_CLIENT, type DrizzleClient, drizzleSchema, eq } from '@the-new-fuse/database';

const { systemConfigurations, systemSettings } = drizzleSchema;

@Injectable()
export class ConfigurationRepository {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  // System Configurations (KV)

  async findAllConfigs() {
    return this.db.select().from(systemConfigurations).orderBy(systemConfigurations.key);
  }

  async findConfigByKey(key: string) {
    const [config] = await this.db
      .select()
      .from(systemConfigurations)
      .where(eq(systemConfigurations.key, key));
    return config || null;
  }

  async updateConfig(key: string, value: string, updatedBy?: string) {
    const [config] = await this.db
      .insert(systemConfigurations)
      .values({
        key,
        value,
        updatedBy: updatedBy || null,
        updatedAt: new Date(),
      } as any)
      .onConflictDoUpdate({
        target: systemConfigurations.key,
        set: {
          value,
          updatedBy: updatedBy || null,
          updatedAt: new Date(),
        } as any,
      })
      .returning();
    return config;
  }

  // System Settings (Singleton)

  async getSystemSettings() {
    // Assuming table `system_settings` has an ID column and we use ID 1 for global settings
    const [settings] = await this.db.select().from(systemSettings).where(eq(systemSettings.id, 1));
    if (!settings) {
      return null;
    }
    return settings.config;
  }

  async updateSystemSettings(newSettings: any, updatedBy?: string) {
    const [record] = await this.db
      .insert(systemSettings)
      .values({
        id: 1,
        config: newSettings,
        updatedBy: updatedBy || null,
        updatedAt: new Date(),
      } as any)
      .onConflictDoUpdate({
        target: systemSettings.id,
        set: {
          config: newSettings,
          updatedBy: updatedBy || null,
          updatedAt: new Date(),
        } as any,
      })
      .returning();
    return record.config;
  }
}
