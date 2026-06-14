/**
 * API Logs Repository - Drizzle ORM Analysis
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
import { and, desc, DRIZZLE_CLIENT, drizzleSchema, gte, lte, sql, } from '@the-new-fuse/database';
const { apiLogs } = drizzleSchema;
let ApiLogsRepository = class ApiLogsRepository {
    constructor(db) {
        this.db = db;
    }
    async logRequest(data) {
        return this.db.insert(apiLogs).values(data).returning();
    }
    async getRecentLogs(limit = 50) {
        return this.db.select().from(apiLogs).orderBy(desc(apiLogs.createdAt)).limit(limit);
    }
    async getStats(startDate, endDate) {
        const conditions = [];
        if (startDate)
            conditions.push(gte(apiLogs.createdAt, startDate));
        if (endDate)
            conditions.push(lte(apiLogs.createdAt, endDate));
        const query = this.db
            .select({
            count: sql `count(*)`,
            avgDuration: sql `avg(${apiLogs.duration})`,
            errorCount: sql `count(*) filter (where ${apiLogs.statusCode} >= 400)`,
        })
            .from(apiLogs);
        if (conditions.length) {
            query.where(and(...conditions));
        }
        return query;
    }
    async getStatusCodeDistribution(startDate, endDate) {
        const conditions = [];
        if (startDate)
            conditions.push(gte(apiLogs.createdAt, startDate));
        if (endDate)
            conditions.push(lte(apiLogs.createdAt, endDate));
        const query = this.db
            .select({
            status: apiLogs.statusCode,
            count: sql `count(*)`,
        })
            .from(apiLogs)
            .groupBy(apiLogs.statusCode);
        if (conditions.length) {
            query.where(and(...conditions));
        }
        return query;
    }
    async getMethodDistribution(startDate, endDate) {
        const conditions = [];
        if (startDate)
            conditions.push(gte(apiLogs.createdAt, startDate));
        if (endDate)
            conditions.push(lte(apiLogs.createdAt, endDate));
        const query = this.db
            .select({
            method: apiLogs.method,
            count: sql `count(*)`,
        })
            .from(apiLogs)
            .groupBy(apiLogs.method);
        if (conditions.length) {
            query.where(and(...conditions));
        }
        return query;
    }
    async getTopEndpoints(limit = 5, startDate, endDate) {
        const conditions = [];
        if (startDate)
            conditions.push(gte(apiLogs.createdAt, startDate));
        if (endDate)
            conditions.push(lte(apiLogs.createdAt, endDate));
        const query = this.db
            .select({
            endpoint: apiLogs.path,
            count: sql `count(*)`,
            avgDuration: sql `avg(${apiLogs.duration})`,
            errorCount: sql `count(*) filter (where ${apiLogs.statusCode} >= 400)`,
        })
            .from(apiLogs)
            .groupBy(apiLogs.path)
            .orderBy(desc(sql `count(*)`))
            .limit(limit);
        if (conditions.length) {
            query.where(and(...conditions));
        }
        return query;
    }
    async getTimeSeriesData(startDate, endDate) {
        // Note: This SQL might be specific to Postgres
        const query = this.db
            .select({
            time: sql `date_trunc('hour', ${apiLogs.createdAt})`,
            requests: sql `count(*)`,
            errors: sql `count(*) filter (where ${apiLogs.statusCode} >= 400)`,
            avgDuration: sql `avg(${apiLogs.duration})`,
        })
            .from(apiLogs)
            .where(and(gte(apiLogs.createdAt, startDate), lte(apiLogs.createdAt, endDate)))
            .groupBy(sql `date_trunc('hour', ${apiLogs.createdAt})`)
            .orderBy(sql `date_trunc('hour', ${apiLogs.createdAt})`);
        return query;
    }
};
ApiLogsRepository = __decorate([
    Injectable(),
    __param(0, Inject(DRIZZLE_CLIENT)),
    __metadata("design:paramtypes", [Object])
], ApiLogsRepository);
export { ApiLogsRepository };
//# sourceMappingURL=api-logs.repository.js.map