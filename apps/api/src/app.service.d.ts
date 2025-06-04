import { ConfigService } from '@nestjs/config';
export declare class AppService {
    private configService;
    constructor(configService: ConfigService);
    getHello(): string;
    getVersion(): string;
    getEnvironment(): string;
}
