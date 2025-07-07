import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
export declare class DatabaseConfig implements TypeOrmOptionsFactory {
    private readonly configService;
    constructor(configService: ConfigService);
    createTypeOrmOptions(): TypeOrmModuleOptions;
}
export declare const databaseConfig: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
    poolSize: number;
    connectionTimeoutMillis: number;
    idleTimeoutMillis: number;
};
//# sourceMappingURL=database.config.d.ts.map