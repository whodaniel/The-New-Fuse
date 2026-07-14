/**
 * API Logs Repository - Drizzle ORM Analysis
 *
 * Adapted for NestJS Dependency Injection.
 */
import { type DrizzleClient } from '@the-new-fuse/database';
declare const apiLogs: import("drizzle-orm/pg-core/table", { with: { "resolution-mode": "require" } }).PgTableWithColumns<{
    name: "api_logs";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "id";
            tableName: "api_logs";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        method: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "method";
            tableName: "api_logs";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 10;
        }>;
        path: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "path";
            tableName: "api_logs";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        statusCode: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "status_code";
            tableName: "api_logs";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        duration: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "duration";
            tableName: "api_logs";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        ip: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "ip";
            tableName: "api_logs";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 45;
        }>;
        userAgent: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "user_agent";
            tableName: "api_logs";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "user_id";
            tableName: "api_logs";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "created_at";
            tableName: "api_logs";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare class ApiLogsRepository {
    private readonly db;
    constructor(db: DrizzleClient);
    logRequest(data: typeof apiLogs.$inferInsert): Promise<{
        userId: string;
        duration: number;
        id: string;
        createdAt: Date;
        ip: string;
        method: string;
        statusCode: number;
        userAgent: string;
        path: string;
    }[]>;
    getRecentLogs(limit?: number): Promise<{
        id: string;
        method: string;
        path: string;
        statusCode: number;
        duration: number;
        ip: string;
        userAgent: string;
        userId: string;
        createdAt: Date;
    }[]>;
    getStats(startDate?: Date, endDate?: Date): Promise<{
        count: number;
        avgDuration: number;
        errorCount: number;
    }[]>;
    getStatusCodeDistribution(startDate?: Date, endDate?: Date): Promise<{
        status: number;
        count: number;
    }[]>;
    getMethodDistribution(startDate?: Date, endDate?: Date): Promise<{
        method: string;
        count: number;
    }[]>;
    getTopEndpoints(limit?: number, startDate?: Date, endDate?: Date): Promise<{
        endpoint: string;
        count: number;
        avgDuration: number;
        errorCount: number;
    }[]>;
    getTimeSeriesData(startDate: Date, endDate: Date): Promise<{
        time: string;
        requests: number;
        errors: number;
        avgDuration: number;
    }[]>;
}
export {};
//# sourceMappingURL=api-logs.repository.d.ts.map