"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = exports.MongoAdapter = exports.PostgresAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const mongodb_1 = require("mongodb");
let PostgresAdapter = class PostgresAdapter {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    async connect() {
        // PostgreSQL connection is handled by TypeORM
    }
    async disconnect() {
        // PostgreSQL disconnection is handled by TypeORM
    }
    getClient() {
        return typeorm_1.TypeOrmModule;
    }
};
exports.PostgresAdapter = PostgresAdapter;
exports.PostgresAdapter = PostgresAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PostgresAdapter);
let MongoAdapter = class MongoAdapter {
    configService;
    client;
    db;
    constructor(configService) {
        this.configService = configService;
        const mongoUrl = this.configService.get('MONGODB_URL');
        this.client = new mongodb_1.MongoClient(mongoUrl);
    }
    async connect() {
        await this.client.connect();
        this.db = this.client.db('fuse');
    }
    async disconnect() {
        await this.client.close();
    }
    getClient() {
        return this.db;
    }
};
exports.MongoAdapter = MongoAdapter;
exports.MongoAdapter = MongoAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MongoAdapter);
let DatabaseService = class DatabaseService {
    configService;
    adapter;
    constructor(configService) {
        this.configService = configService;
        const dbType = this.configService.get('DATABASE_TYPE');
        this.adapter = dbType === 'mongodb'
            ? new MongoAdapter(configService)
            : new PostgresAdapter(configService);
    }
    async onModuleInit() {
        await this.adapter.connect();
    }
    async onModuleDestroy() {
        await this.adapter.disconnect();
    }
    getClient() {
        return this.adapter.getClient();
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseService);
