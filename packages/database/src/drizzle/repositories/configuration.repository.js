"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleConfigurationRepository = exports.DrizzleConfigurationRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const configuration_1 = require("../schema/configuration");
class DrizzleConfigurationRepository {
    // System Configurations (KV)
    async findAllConfigs() {
        return client_1.db.select().from(configuration_1.systemConfigurations).orderBy(configuration_1.systemConfigurations.key);
    }
    async findConfigByKey(key) {
        const [config] = await client_1.db
            .select()
            .from(configuration_1.systemConfigurations)
            .where((0, drizzle_orm_1.eq)(configuration_1.systemConfigurations.key, key));
        return config || null;
    }
    async updateConfig(key, value, updatedBy) {
        const [config] = await client_1.db
            .insert(configuration_1.systemConfigurations)
            .values({ key, value, updatedBy, updatedAt: new Date() })
            .onConflictDoUpdate({
            target: configuration_1.systemConfigurations.key,
            set: { value, updatedBy, updatedAt: new Date() },
        })
            .returning();
        return config;
    }
    async createConfig(data) {
        const [config] = await client_1.db.insert(configuration_1.systemConfigurations).values(data).returning();
        return config;
    }
    // System Settings (Singleton)
    async getSystemSettings() {
        const [settings] = await client_1.db.select().from(configuration_1.systemSettings).where((0, drizzle_orm_1.eq)(configuration_1.systemSettings.id, 1));
        if (!settings) {
            // Return default empty structure or initialize
            return null;
        }
        return settings.config;
    }
    async updateSystemSettings(newSettings, updatedBy) {
        // Upsert logic for ID 1
        const [record] = await client_1.db
            .insert(configuration_1.systemSettings)
            .values({ id: 1, config: newSettings, updatedBy, updatedAt: new Date() })
            .onConflictDoUpdate({
            target: configuration_1.systemSettings.id,
            set: { config: newSettings, updatedBy, updatedAt: new Date() },
        })
            .returning();
        return record.config;
    }
}
exports.DrizzleConfigurationRepository = DrizzleConfigurationRepository;
exports.drizzleConfigurationRepository = new DrizzleConfigurationRepository();
//# sourceMappingURL=configuration.repository.js.map