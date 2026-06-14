import { WalletsService } from './wallets.service';
import { SmartAccountDeploymentResult } from '../smart-accounts/smart-account.service';
export declare class WalletsController {
    private readonly walletsService;
    private readonly logger;
    constructor(walletsService: WalletsService);
    createWallet(createWalletDto: {
        userId: string;
        verifierId: string;
        chainId?: number;
        userType?: 'HUMAN' | 'AI';
        enableSmartAccount?: boolean;
    }): Promise<any>;
    getWalletsByUserId(userId: string): Promise<any[]>;
    getWalletByAddress(address: string): Promise<any>;
    getWalletWithSmartAccountInfo(walletId: string): Promise<any>;
    enableSmartAccount(walletId: string): Promise<SmartAccountDeploymentResult>;
    deploySmartAccount(walletId: string): Promise<SmartAccountDeploymentResult>;
}
//# sourceMappingURL=wallets.controller.d.ts.map