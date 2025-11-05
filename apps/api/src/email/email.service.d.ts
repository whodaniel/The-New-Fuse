import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private transporter?;
    constructor(configService: ConfigService);
    sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean>;
    sendWelcomeEmail(to: string, name: string): Promise<boolean>;
    sendResetPasswordEmail(to: string, resetToken: string): Promise<boolean>;
    sendTemplateEmail(to: string, templateName: string, subject: string, data: Record<string, any>): Promise<boolean>;
}
//# sourceMappingURL=email.service.d.ts.map