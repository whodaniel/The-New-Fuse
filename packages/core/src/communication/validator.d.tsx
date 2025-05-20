import { ConfigService } from '@nestjs/config';
export declare class MessageValidator {
    private readonly configService;
    private readonly schemas;
    private readonly maxContentSize;
    constructor(configService: ConfigService);
    validate(): Promise<void>;
}
