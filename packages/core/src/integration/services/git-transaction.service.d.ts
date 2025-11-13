import { SecureSubprocessService } from './secure-subprocess.service';
export interface GitTransaction {
    id: string;
    type: 'ai_change' | 'user_change' | 'system_change' | 'rollback';
    description: string;
    aiAgent?: string;
    userName?: string;
    files: string[];
    timestamp: Date;
    commitHash?: string;
    status: 'pending' | 'committed' | 'failed' | 'rolled_back';
    metadata: {
        changedLines: number;
        addedFiles: number;
        deletedFiles: number;
        modifiedFiles: number;
        diffSummary: string;
    };
}
export interface GitAuditTrail {
    transactionId: string;
    commitHash: string;
    author: string;
    date: Date;
    message: string;
    files: GitFileChange[];
    aiGenerated: boolean;
    parentTransaction?: string;
}
export interface GitFileChange {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
    linesAdded: number;
    linesDeleted: number;
    oldPath?: string;
}
export interface GitBranchInfo {
    name: string;
    commit: string;
    upstream?: string;
    ahead: number;
    behind: number;
}
export declare class GitTransactionService {
    private readonly secureSubprocess;
    private readonly logger;
    private activeTransactions;
    private auditTrail;
    private readonly AI_SIGNATURE;
    constructor(secureSubprocess: SecureSubprocessService);
    /**
     * Create a new AI change transaction
     */
    createAITransaction(description: string, aiAgent: string, files: string[], cwd?: string): Promise<string>;
    catch(error: any): void;
}
//# sourceMappingURL=git-transaction.service.d.ts.map