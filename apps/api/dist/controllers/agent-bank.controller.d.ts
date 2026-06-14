import { User } from '@the-new-fuse/database';
import { AgentBankService } from '../services/agent-bank.service';
/**
 * AgentBankController
 *
 * Exposes the library of agent templates (personas) defined in the filesystem.
 * This allows the frontend and other agents to discover and utilize
 * pre-defined agent definitions from the .agent/agents and .claude/agents directories.
 */
export declare class AgentBankController {
    private readonly agentBankService;
    constructor(agentBankService: AgentBankService);
    /**
     * List all agent templates from the banks
     */
    listTemplates(user: User, bank?: 'tnf' | 'claude' | 'all'): Promise<import("../services/agent-bank.service").AgentTemplate[]>;
    /**
     * Get the content of a specific agent template
     */
    getTemplate(user: User, bank: 'tnf' | 'claude', filename: string): Promise<{
        content: string;
    }>;
}
//# sourceMappingURL=agent-bank.controller.d.ts.map