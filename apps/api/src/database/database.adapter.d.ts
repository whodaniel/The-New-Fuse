import { ConfigService } from '@nestjs/config';
import { Db } from 'mongodb';
export interface DatabaseAdapter {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getClient(): any;
}
export declare class PostgresAdapter implements DatabaseAdapter {
    private configService;
    private prismaService;
    constructor(configService: ConfigService);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getClient(): PrismaService;
}
export declare class MongoAdapter implements DatabaseAdapter {
    private configService;
    private client;
    private db;
    constructor(configService: ConfigService);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getClient(): Db;
}
export declare class DatabaseService {
    private configService;
    private adapter;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    getClient(): any;
}
//# sourceMappingURL=database.adapter.d.ts.map