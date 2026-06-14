import { PayPalService } from '../modules/billing/paypal.service';
/**
 * AgentTemplate interface representing a persona template in the bank
 */
export interface AgentTemplate {
    id: string;
    name: string;
    bank: 'tnf' | 'claude';
    filename: string;
    size: number;
    lastModified: Date;
    description?: string;
    category?: string;
}
export declare class AgentBankService {
    private readonly paypalService;
    private readonly logger;
    constructor(paypalService: PayPalService);
    /**
     * Resolve the workspace root directory
     */
    getWorkspaceRoot(): string;
    /**
     * List all templates in the agent banks
     */
    listTemplates(bank?: 'tnf' | 'claude' | 'all', userId?: string, userRole?: string): Promise<AgentTemplate[]>;
    /**
     * Get the full content of a template file
     */
    getTemplateContent(bank: 'tnf' | 'claude', filename: string, userId?: string, userRole?: string): Promise<string>;
}
//# sourceMappingURL=agent-bank.service.d.ts.map