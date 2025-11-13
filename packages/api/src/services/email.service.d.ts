import { LoggingService } from './logging.service';
export interface EmailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
}
export declare class EmailService {
    private readonly logger;
    constructor(logger: LoggingService);
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendWelcomeEmail(email: string, name?: string): Promise<boolean>;
}
//# sourceMappingURL=email.service.d.ts.map