import { ConfigService } from '../config/ConfigService/;';
export declare class DatabaseService {
    private readonly configService;
    private readonly prisma;
    constructor(configService: ConfigService);
}
