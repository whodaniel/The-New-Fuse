/**
 * Configuration Repository - Drizzle ORM Analysis
 *
 * Adapted for NestJS Dependency Injection.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_CLIENT, drizzleSchema, eq } from '@the-new-fuse/database';
const { systemConfigurations, systemSettings } = drizzleSchema;
let ConfigurationRepository = class ConfigurationRepository {
    constructor(db) {
        this.db = db;
    }
    // System Configurations (KV)
    async findAllConfigs() {
        return this.db.select().from(systemConfigurations).orderBy(systemConfigurations.key);
    }
    async findConfigByKey(key) {
        const [config] = await this.db
            .select()
            .from(systemConfigurations)
            .where(eq(systemConfigurations.key, key));
        return config || null;
    }
    async updateConfig(key, value, updatedBy) {
        const [config] = await this.db
            .insert(systemConfigurations)
            .values({
            key,
            value,
            updatedBy: updatedBy || null,
            updatedAt: new Date(),
        })
            .onConflictDoUpdate({
            target: systemConfigurations.key,
            set: {
                value,
                updatedBy: updatedBy || null,
                updatedAt: new Date(),
            },
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
    async updateSystemSettings(newSettings, updatedBy) {
        const [record] = await this.db
            .insert(systemSettings)
            .values({
            id: 1,
            config: newSettings,
            updatedBy: updatedBy || null,
            updatedAt: new Date(),
        })
            .onConflictDoUpdate({
            target: systemSettings.id,
            set: {
                config: newSettings,
                updatedBy: updatedBy || null,
                updatedAt: new Date(),
            },
        })
            .returning();
        return record.config;
    }
};
ConfigurationRepository = __decorate([
    Injectable(),
    __param(0, Inject(DRIZZLE_CLIENT)),
    __metadata("design:paramtypes", [Object])
], ConfigurationRepository);
export { ConfigurationRepository };
//# sourceMappingURL=configuration.repository.js.map