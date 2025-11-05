import { Web3authService } from '../web3auth/web3auth.service';
import { PrismaService } from '../services/prisma.service';
import { SmartAccountService, SmartAccountDeploymentResult } from '../smart-accounts/smart-account.service';
declare const USER_TYPES: {
    readonly HUMAN: "HUMAN";
    readonly AI: "AI";
};
type UserType = typeof USER_TYPES[keyof typeof USER_TYPES];
interface Wallet {
    id: string;
    address: string;
    agentId?: string;
    type: string;
    balance: any;
    nonce: number;
    isActive: boolean;
    lastActivity?: Date;
    createdAt: Date;
    updatedAt: Date;
    agent?: {
        id: string;
        name: string;
        status: string;
        type: string;
        capabilities: string[];
        createdAt: Date;
        updatedAt: Date;
        user?: {
            id: string;
            email: string;
            name?: string;
            username?: string;
            hashedPassword: string;
            createdAt: Date;
            updatedAt: Date;
        };
    };
    transactions?: Array<{
        id: string;
        hash: string;
        walletId: string;
        fromAddress: string;
        toAddress: string;
        value: any;
        gasPrice: any;
        gasUsed: number;
        gasLimit: number;
        status: string;
        blockNumber?: number;
        blockHash?: string;
        type: string;
        data?: any;
        createdAt: Date;
        confirmedAt?: Date;
    }>;
}
interface WalletWithSmartAccountInfo extends Wallet {
    smartAccountInfo: any;
}
interface CreateWalletResult extends Wallet {
    agent: {
        id: string;
        name: string;
        status: string;
        type: string;
        capabilities: string[];
        createdAt: Date;
        updatedAt: Date;
        user?: {
            id: string;
            email: string;
            name?: string;
            username?: string;
            hashedPassword: string;
            createdAt: Date;
            updatedAt: Date;
        };
    };
}
export declare class WalletsService {
    private readonly web3authService;
    private readonly prisma;
    private readonly smartAccountService;
    private readonly logger;
    constructor(web3authService: Web3authService, prisma: PrismaService, smartAccountService: SmartAccountService);
    createWallet(userId: string, verifierId: string, _chainId?: number, userType?: UserType, enableSmartAccount?: boolean): Promise<CreateWalletResult>;
    enableSmartAccountForWallet(walletId: string): Promise<SmartAccountDeploymentResult>;
    deploySmartAccountForWallet(walletId: string): Promise<SmartAccountDeploymentResult>;
    getWalletWithSmartAccountInfo(walletId: string): Promise<WalletWithSmartAccountInfo>;
    getWalletsByUserId(userId: string): Promise<Wallet[]>;
    getWalletByAddress(address: string): Promise<Wallet | null>;
}
export {};
//# sourceMappingURL=wallets.service.d.ts.map