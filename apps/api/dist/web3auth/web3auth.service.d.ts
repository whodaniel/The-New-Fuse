import { OnModuleInit } from '@nestjs/common';
import { ProviderResult } from './web3auth.types';
export declare class Web3authService implements OnModuleInit {
    private readonly logger;
    private isEnabled;
    private web3auth;
    private privateKeyProvider;
    private chainConfig;
    onModuleInit(): Promise<void>;
    getProvider(verifierId: string): Promise<ProviderResult>;
    deriveAddress(verifierId: string): Promise<string>;
    private generateServerSideToken;
    disconnect(verifierId: string): Promise<void>;
}
//# sourceMappingURL=web3auth.service.d.ts.map