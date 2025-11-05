import { ConfigService } from '@nestjs/config';
export interface DatabaseConfig {
    url: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    logging: boolean;
    ssl?: boolean;
}
export declare const getDatabaseConfig: (configService: ConfigService) => DatabaseConfig;
//# sourceMappingURL=database.config.d.ts.map