import { ConfigService } from '@nestjs/config';
export declare class FirebaseConfig {
    private readonly configService;
    constructor(configService: ConfigService);
    private initializeApp;
}
