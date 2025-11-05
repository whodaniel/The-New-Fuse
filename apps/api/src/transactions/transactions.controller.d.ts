import { TransactionsService } from './transactions.service';
export declare class TransactionsController {
    private readonly transactionsService;
    private readonly logger;
    constructor(transactionsService: TransactionsService);
    executeTransaction(walletId: string, transactionData: {
        to: string;
        value: string;
        data?: string;
        useSmartAccount?: boolean;
    }): Promise<any>;
    executeBatchTransaction(walletId: string, batchData: {
        transactions: Array<{
            to: string;
            value: string;
            data?: string;
        }>;
        useSmartAccount?: boolean;
    }): Promise<any>;
    getTransactionsByWalletId(walletId: string): Promise<any>;
    updateTransactionStatus(txHash: string, statusData: {
        status: 'SUCCESS' | 'FAILED';
    }): Promise<any>;
    createAIUserOperation(userOpData: {
        agentVerifierId: string;
        to: string;
        value: string;
        data?: string;
        chainId?: number;
    }): Promise<any>;
}
//# sourceMappingURL=transactions.controller.d.ts.map