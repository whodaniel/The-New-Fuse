"use strict";
/**
 * Drizzle ORM Index
 * Central export point for all Drizzle-related modules
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = exports.or = exports.notInArray = exports.not = exports.ne = exports.lte = exports.lt = exports.like = exports.isNull = exports.isNotNull = exports.inArray = exports.ilike = exports.gte = exports.gt = exports.eq = exports.desc = exports.asc = exports.and = exports.DatabaseService = exports.DrizzleService = exports.DrizzleModule = exports.DRIZZLE_CLIENT = exports.schema = exports.queryClient = exports.db = void 0;
// Export the database client and types
var client_1 = require("./client");
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return client_1.db; } });
Object.defineProperty(exports, "queryClient", { enumerable: true, get: function () { return client_1.queryClient; } });
Object.defineProperty(exports, "schema", { enumerable: true, get: function () { return client_1.schema; } });
// Export NestJS module and service
var drizzle_module_1 = require("./drizzle.module");
Object.defineProperty(exports, "DRIZZLE_CLIENT", { enumerable: true, get: function () { return drizzle_module_1.DRIZZLE_CLIENT; } });
Object.defineProperty(exports, "DrizzleModule", { enumerable: true, get: function () { return drizzle_module_1.DrizzleModule; } });
Object.defineProperty(exports, "DrizzleService", { enumerable: true, get: function () { return drizzle_module_1.DrizzleService; } });
// Export all schema tables
__exportStar(require("./schema"), exports);
// Export all inferred types
__exportStar(require("./types"), exports);
// Export all repositories
__exportStar(require("./repositories"), exports);
// Export compatibility layer for Drizzle migration
__exportStar(require("./compatibility"), exports);
// Export DatabaseService (unified database access layer)
// DrizzleService is exported from drizzle.module above for backwards compatibility
var database_service_1 = require("./database.service");
Object.defineProperty(exports, "DatabaseService", { enumerable: true, get: function () { return database_service_1.DatabaseService; } });
// Re-export useful Drizzle utilities
var drizzle_orm_1 = require("drizzle-orm");
Object.defineProperty(exports, "and", { enumerable: true, get: function () { return drizzle_orm_1.and; } });
Object.defineProperty(exports, "asc", { enumerable: true, get: function () { return drizzle_orm_1.asc; } });
Object.defineProperty(exports, "desc", { enumerable: true, get: function () { return drizzle_orm_1.desc; } });
Object.defineProperty(exports, "eq", { enumerable: true, get: function () { return drizzle_orm_1.eq; } });
Object.defineProperty(exports, "gt", { enumerable: true, get: function () { return drizzle_orm_1.gt; } });
Object.defineProperty(exports, "gte", { enumerable: true, get: function () { return drizzle_orm_1.gte; } });
Object.defineProperty(exports, "ilike", { enumerable: true, get: function () { return drizzle_orm_1.ilike; } });
Object.defineProperty(exports, "inArray", { enumerable: true, get: function () { return drizzle_orm_1.inArray; } });
Object.defineProperty(exports, "isNotNull", { enumerable: true, get: function () { return drizzle_orm_1.isNotNull; } });
Object.defineProperty(exports, "isNull", { enumerable: true, get: function () { return drizzle_orm_1.isNull; } });
Object.defineProperty(exports, "like", { enumerable: true, get: function () { return drizzle_orm_1.like; } });
Object.defineProperty(exports, "lt", { enumerable: true, get: function () { return drizzle_orm_1.lt; } });
Object.defineProperty(exports, "lte", { enumerable: true, get: function () { return drizzle_orm_1.lte; } });
Object.defineProperty(exports, "ne", { enumerable: true, get: function () { return drizzle_orm_1.ne; } });
Object.defineProperty(exports, "not", { enumerable: true, get: function () { return drizzle_orm_1.not; } });
Object.defineProperty(exports, "notInArray", { enumerable: true, get: function () { return drizzle_orm_1.notInArray; } });
Object.defineProperty(exports, "or", { enumerable: true, get: function () { return drizzle_orm_1.or; } });
Object.defineProperty(exports, "sql", { enumerable: true, get: function () { return drizzle_orm_1.sql; } });
//# sourceMappingURL=index.js.map