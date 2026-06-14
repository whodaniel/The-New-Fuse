import { WebhookSecurityConfig } from '@the-new-fuse/types';
export declare class WebhookSecurityService {
    private readonly logger;
    validateSignature(payload: string, signature: string, config: WebhookSecurityConfig): Promise<boolean>;
    private generateSignature;
    private normalizeSignature;
    private timingSafeEqual;
    validateStripeSignature(payload: string, signature: string, secret: string, tolerance?: number): boolean;
    validateHubSpotSignature(payload: string, signature: string, secret: string): boolean;
    validateSalesforceSignature(payload: string, signature: string, secret: string, url: string): boolean;
    validatePayPalSignature(payload: string, headers: Record<string, string>, webhookId: string, secret: string): boolean;
    validateSquareSignature(payload: string, signature: string, secret: string, url: string): boolean;
    validatePipedriveSignature(payload: string, signature: string, secret: string): boolean;
    validateQuickBooksSignature(payload: string, signature: string, secret: string): boolean;
    validateZapierSignature(payload: string, signature: string, secret: string): boolean;
    validateWorkatoSignature(payload: string, signature: string, secret: string, timestamp: string): boolean;
    validatePowerAutomateSignature(payload: string, signature: string, secret: string): boolean;
    generateWebhookSecret(length?: number): string;
    encryptSecret(secret: string, key: string): string;
    decryptSecret(encryptedSecret: string, key: string): string;
    validateTimestamp(timestamp: string | number, tolerance?: number): boolean;
    sanitizePayload(payload: any): any;
    private recursiveSanitize;
    validatePayloadSize(payload: string, maxSize?: number): boolean;
    rateLimitCheck(identifier: string, windowMs?: number, maxRequests?: number): boolean;
}
//# sourceMappingURL=webhook-security.service.d.ts.map