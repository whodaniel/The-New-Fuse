import { eq } from 'drizzle-orm';
import { db } from '../client.js';
import { systemConfigurations, systemSettings } from '../schema/configuration.js';

export class DrizzleConfigurationRepository {
  // System Configurations (KV)

  async findAllConfigs() {
    return db.select().from(systemConfigurations).orderBy(systemConfigurations.key);
  }

  async findConfigByKey(key: string) {
    const [config] = await db
      .select()
      .from(systemConfigurations)
      .where(eq(systemConfigurations.key, key));
    return config || null;
  }

  async updateConfig(key: string, value: string, updatedBy?: string) {
    const [config] = await db
      .insert(systemConfigurations)
      .values({ key, value, updatedBy, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemConfigurations.key,
        set: { value, updatedBy, updatedAt: new Date() },
      })
      .returning();
    return config;
  }

  async createConfig(data: typeof systemConfigurations.$inferInsert) {
    const [config] = await db.insert(systemConfigurations).values(data).returning();
    return config;
  }

  // System Settings (Singleton)

  async getSystemSettings() {
    const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
    if (!settings) {
      // Return default empty structure or initialize
      return null;
    }
    return settings.config;
  }

  async updateSystemSettings(newSettings: any, updatedBy?: string) {
    // Upsert logic for ID 1
    const [record] = await db
      .insert(systemSettings)
      .values({ id: 1, config: newSettings, updatedBy, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemSettings.id,
        set: { config: newSettings, updatedBy, updatedAt: new Date() },
      })
      .returning();
    return record.config;
  }
}

export const drizzleConfigurationRepository = new DrizzleConfigurationRepository();
