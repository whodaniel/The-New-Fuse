var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@the-new-fuse/database';
import { MongoClient } from 'mongodb';
let PostgresAdapter = class PostgresAdapter {
    configService;
    prismaService;
    constructor(configService) {
        this.configService = configService;
        this.prismaService = new PrismaService();
    }
    async connect() {
        await this.prismaService.$connect();
    }
    async disconnect() {
        await this.prismaService.$disconnect();
    }
    getClient() {
        return this.prismaService;
    }
};
PostgresAdapter = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], PostgresAdapter);
export { PostgresAdapter };
let MongoAdapter = class MongoAdapter {
    configService;
    client;
    db;
    constructor(configService) {
        this.configService = configService;
        const mongoUrl = this.configService.get('MONGODB_URL') || 'mongodb://localhost:27017';
        this.client = new MongoClient(mongoUrl);
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
MongoAdapter = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], MongoAdapter);
export { MongoAdapter };
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
DatabaseService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], DatabaseService);
export { DatabaseService };
//# sourceMappingURL=database.adapter.js.map