import { Web3authService } from '../web3auth/web3auth.service';
import { PrismaService } from '../services/prisma.service';
import { SmartAccountService } from '../smart-accounts/smart-account.service';
export declare class TransactionsService {
    private readonly web3authService;
    private readonly prisma;
    private readonly smartAccountService;
    private readonly logger;
    constructor(web3authService: Web3authService, prisma: PrismaService, smartAccountService: SmartAccountService);
    private getSmartAccountCapability;
    buildAndSignUserOpForAI(agentVerifierId: string, userOpData: {
        to: string;
        value: string;
        data?: string;
        chainId?: number;
    }): Promise<{
        userOpHash: string;
        transactionRecord: any;
    }>;
    private getSmartAccountAddress;
    private buildUserOperation;
    private signUserOperation;
    private submitUserOperation;
    private encodeExecuteCall;
    private getNonce;
    private getUserOperationHash;
    executeTransaction(walletId: string, transactionData: {
        to: string;
        value: string;
        data?: string;
        useSmartAccount?: boolean;
    }): Promise<{
        txHash: string;
        transactionRecord: any;
        method: string;
    }>;
    executeBatchTransaction(walletId: string, batchData: {
        transactions: Array<{
            to: string;
            value: string;
            data?: string;
        }>;
        useSmartAccount?: boolean;
    }): Promise<{
        txHash: any;
        transactionRecords: any;
        method: string;
    }>;
    private executeEOATransaction;
    private performComplianceCheck;
    private getWalletIdByAddress;
    getTransactionsByWalletId(walletId: string): Promise<any>;
    updateTransactionStatus(txHash: string, status: 'SUCCESS' | 'FAILED'): Promise<any>;
}
//# sourceMappingURL=transactions.service.d.ts.map