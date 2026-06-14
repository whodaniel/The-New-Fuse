import { DatabaseService } from '@the-new-fuse/database';
import { SmartAccountDeploymentResult, SmartAccountService } from '../smart-accounts/smart-account.service';
import { Web3authService } from '../web3auth/web3auth.service';
export declare class WalletsService {
    private readonly web3authService;
    private readonly db;
    private readonly smartAccountService;
    private readonly logger;
    constructor(web3authService: Web3authService, db: DatabaseService, smartAccountService: SmartAccountService);
    createWallet(userId: string, verifierId: string, _chainId?: number, userType?: 'HUMAN' | 'AI', enableSmartAccount?: boolean): Promise<any>;
    enableSmartAccountForWallet(walletId: string): Promise<SmartAccountDeploymentResult>;
    deploySmartAccountForWallet(walletId: string): Promise<SmartAccountDeploymentResult>;
    getWalletWithSmartAccountInfo(walletId: string): Promise<any>;
    getWalletsByUserId(userId: string): Promise<any[]>;
    getWalletByAddress(address: string): Promise<any | null>;
}
//# sourceMappingURL=wallets.service.d.ts.map