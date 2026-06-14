import { DatabaseService } from '@the-new-fuse/database';
import { Web3authService } from '../web3auth/web3auth.service';
export interface SmartAccountDeploymentResult {
    smartAccountAddress: string;
    transactionHash?: string;
    isCounterfactual: boolean;
}
export declare class SmartAccountService {
    private readonly db;
    private readonly web3authService;
    private readonly logger;
    private readonly factoryAbi;
    private readonly smartAccountAbi;
    constructor(db: DatabaseService, web3authService: Web3authService);
    private getSmartAccountMetadata;
    enableSmartAccountForWallet(walletId: string): Promise<SmartAccountDeploymentResult>;
    deploySmartAccount(walletId: string): Promise<SmartAccountDeploymentResult>;
    executeSmartAccountTransaction(walletId: string, target: string, value: bigint, data: string): Promise<string>;
    executeBatchSmartAccountTransaction(walletId: string, transactions: Array<{
        target: string;
        value: bigint;
        data: string;
    }>): Promise<string>;
    getSmartAccountInfo(walletId: string): Promise<{
        walletId: any;
        eoaAddress: any;
        smartAccountEnabled: boolean;
        smartAccountAddress: string | undefined;
        smartAccountDeployed: boolean;
        userType: any;
        walletType: any;
    }>;
    private generateSalt;
    private getCounterfactualAddress;
    isSmartAccountDeployed(smartAccountAddress: string): Promise<boolean>;
    getWalletsWithoutSmartAccounts(): Promise<{
        id: any;
        address: any;
        type: any;
    }[]>;
}
//# sourceMappingURL=smart-account.service.d.ts.map