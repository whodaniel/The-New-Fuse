import { ConfigService } from '@nestjs/config';
export declare class EncryptionService {
    private readonly configService;
    private readonly config;
    private readonly encryptionKey;
    private readonly algorithm;
    constructor(configService: ConfigService);
    private pbkdf2;
}
