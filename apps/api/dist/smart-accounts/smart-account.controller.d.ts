import { SmartAccountService } from './smart-account.service';
export declare class SmartAccountController {
    private readonly smartAccountService;
    private readonly logger;
    constructor(smartAccountService: SmartAccountService);
    enableSmartAccount(walletId: string): Promise<{
        smartAccountAddress: string;
        transactionHash?: string;
        isCounterfactual: boolean;
        success: boolean;
    }>;
    deploySmartAccount(walletId: string): Promise<{
        smartAccountAddress: string;
        transactionHash?: string;
        isCounterfactual: boolean;
        success: boolean;
    }>;
    executeTransaction(walletId: string, transactionData: {
        target: string;
        value: string;
        data?: string;
    }): Promise<{
        success: boolean;
        transactionHash: string;
    }>;
    executeBatchTransaction(walletId: string, batchData: {
        transactions: Array<{
            target: string;
            value: string;
            data?: string;
        }>;
    }): Promise<{
        success: boolean;
        transactionHash: string;
    }>;
    getSmartAccountInfo(walletId: string): Promise<{
        walletId: any;
        eoaAddress: any;
        smartAccountEnabled: boolean;
        smartAccountAddress: string | undefined;
        smartAccountDeployed: boolean;
        userType: any;
        walletType: any;
        success: boolean;
    }>;
}
//# sourceMappingURL=smart-account.controller.d.ts.map