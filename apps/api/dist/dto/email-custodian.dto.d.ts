export declare class ProvisionManagedAccountDto {
    accountType: 'hosted_email' | 'chatgpt' | 'external';
    provider?: string;
    loginIdentifier: string;
    secret: string;
    metadata?: Record<string, unknown>;
    createdByAgent?: string;
    createOnHosting?: boolean;
    hostingDomain?: string;
    hostingMailbox?: string;
    hostingQuotaMb?: number;
    allowChatgptAutomation?: boolean;
}
export declare class CreateManagedAccountGrantDto {
    granteeAgentId: string;
    scopes?: string[];
    expiresAt: string;
}
export declare class RedeemManagedAccountGrantDto {
    grantToken: string;
    granteeAgentId: string;
}
//# sourceMappingURL=email-custodian.dto.d.ts.map