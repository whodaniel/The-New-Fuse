"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DrizzleModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrizzleService = exports.DrizzleModule = exports.DRIZZLE_CLIENT = void 0;
/**
 * Drizzle ORM NestJS Module
 * Provides dependency injection for the Drizzle database client
 */
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const schema = __importStar(require("./schema"));
const database_service_1 = require("./database.service");
// Injection token for the Drizzle client
exports.DRIZZLE_CLIENT = Symbol('DRIZZLE_CLIENT');
/**
 * Drizzle Database Module for NestJS
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [DrizzleModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 *
 * Then inject the client:
 * ```typescript
 * constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleClient) {}
 * // OR use DatabaseService (also available as DrizzleService alias):
 * constructor(private db: DatabaseService) {}
 * ```
 */
let DrizzleModule = DrizzleModule_1 = class DrizzleModule {
    /**
     * Register the module with default configuration (uses DATABASE_URL env var)
     */
    static forRoot(options) {
        const drizzleProvider = {
            provide: exports.DRIZZLE_CLIENT,
            useFactory: () => {
                const connectionString = options?.connectionString ??
                    process.env.DATABASE_URL ??
                    'postgresql://localhost:5432/fuse';
                const queryClient = (0, postgres_1.default)(connectionString, {
                    max: options?.maxConnections ?? 10,
                    idle_timeout: options?.idleTimeout ?? 20,
                    connect_timeout: options?.connectTimeout ?? 10,
                });
                return (0, postgres_js_1.drizzle)(queryClient, { schema });
            },
        };
        return {
            module: DrizzleModule_1,
            providers: [drizzleProvider, database_service_1.DatabaseService],
            exports: [exports.DRIZZLE_CLIENT, database_service_1.DatabaseService],
        };
    }
    /**
     * Register the module with async configuration (uses ConfigService)
     */
    static forRootAsync() {
        const drizzleProvider = {
            provide: exports.DRIZZLE_CLIENT,
            inject: [config_1.ConfigService],
            useFactory: (configService) => {
                const connectionString = configService.get('DATABASE_URL') ?? 'postgresql://localhost:5432/fuse';
                const maxConnections = configService.get('DB_MAX_CONNECTIONS') ?? 10;
                const idleTimeout = configService.get('DB_IDLE_TIMEOUT') ?? 20;
                const connectTimeout = configService.get('DB_CONNECT_TIMEOUT') ?? 10;
                const queryClient = (0, postgres_1.default)(connectionString, {
                    max: maxConnections,
                    idle_timeout: idleTimeout,
                    connect_timeout: connectTimeout,
                });
                return (0, postgres_js_1.drizzle)(queryClient, { schema });
            },
        };
        return {
            module: DrizzleModule_1,
            imports: [config_1.ConfigModule],
            providers: [drizzleProvider, database_service_1.DatabaseService],
            exports: [exports.DRIZZLE_CLIENT, database_service_1.DatabaseService],
        };
    }
};
exports.DrizzleModule = DrizzleModule;
exports.DrizzleModule = DrizzleModule = DrizzleModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], DrizzleModule);
/**
 * Drizzle Service - Alternative injectable wrapper
 */
const common_2 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
let DrizzleService = class DrizzleService {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Get the database client instance
     */
    get client() {
        return this.db;
    }
    /**
     * Execute a raw SQL query
     */
    async executeRaw(query, params) {
        const result = await this.db.execute(drizzle_orm_1.sql.raw(query));
        return result;
    }
    /**
     * Health check - verify database connectivity
     */
    async healthCheck() {
        try {
            await this.db.execute((0, drizzle_orm_1.sql) `SELECT 1`);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Cleanup on module destroy
     */
    async onModuleDestroy() {
        // postgres.js handles cleanup automatically
        console.log('Drizzle module shutting down');
    }
};
exports.DrizzleService = DrizzleService;
exports.DrizzleService = DrizzleService = __decorate([
    (0, common_2.Injectable)(),
    __param(0, (0, common_2.Inject)(exports.DRIZZLE_CLIENT)),
    __metadata("design:paramtypes", [Object])
], DrizzleService);
//# sourceMappingURL=drizzle.module.js.map