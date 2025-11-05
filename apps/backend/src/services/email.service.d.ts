export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
}
export declare class EmailService {
    private readonly logger;
    private transporter;
    constructor();
    sendEmail(options: EmailOptions): Promise<void>;
    sendNotificationEmail(to: string, type: string, data: any): Promise<void>;
}
//# sourceMappingURL=email.service.d.ts.map