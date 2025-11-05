import { SmartAccountService } from './smart-account.service';
export declare class SmartAccountController {
    private readonly smartAccountService;
    private readonly logger;
    constructor(smartAccountService: SmartAccountService);
    enableSmartAccount(walletId: string): Promise<any>;
    deploySmartAccount(walletId: string): Promise<any>;
    executeTransaction(walletId: string, transactionData: {
        target: string;
        value: string;
        data?: string;
    }): Promise<{
        success: boolean;
        transactionHash: any;
    }>;
    executeBatchTransaction(walletId: string, batchData: {
        transactions: Array<{
            target: string;
            value: string;
            data?: string;
        }>;
    }): Promise<{
        success: boolean;
        transactionHash: any;
    }>;
    getSmartAccountInfo(walletId: string): Promise<any>;
}
//# sourceMappingURL=smart-account.controller.d.ts.map