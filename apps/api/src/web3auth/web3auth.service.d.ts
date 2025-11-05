import { OnModuleInit } from '@nestjs/common';
export declare class Web3authService implements OnModuleInit {
    private readonly logger;
    private web3auth;
    private chainConfig;
    onModuleInit(): Promise<void>;
    getProvider(verifierId: string): Promise<{
        provider: any;
        account: any;
        walletClient: any;
    }>;
    deriveAddress(verifierId: string): Promise<string>;
    private generateServerSideToken;
    disconnect(verifierId: string): Promise<void>;
}
//# sourceMappingURL=web3auth.service.d.ts.map