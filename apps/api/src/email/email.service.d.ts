import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private transporter?;
    constructor(configService: ConfigService);
    send2FACode(to: string, code: string): Promise<void>;
    private loadTemplate;
}
