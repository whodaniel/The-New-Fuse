import { ConfigService } from '@nestjs/config';
export declare class SmartContractService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    addRevenue(amount: number, source: string, _metadata?: any): Promise<{
        transactionHash: string;
        blockNumber: number;
    }>;
    distributeRevenue(recipients: {
        address: string;
        amount: number;
    }[]): Promise<{
        transactionHash: string;
        blockNumber: number;
    }>;
    getBlockNumber(): Promise<number>;
    getRevenueStream(streamId: string): Promise<{
        id: string;
        totalRevenue: number;
        distributedAmount: number;
        recipients: any[];
    }>;
    getRevenueEntries(_streamId: string, _limit?: number): Promise<any[]>;
    getTokenBalance(_address: string, _tokenAddress?: string): Promise<{
        balance: string;
        decimals: number;
    }>;
    transferTokens(_to: string, _amount: string, _tokenAddress?: string): Promise<{
        transactionHash: string;
    }>;
    deployContract(_contractCode: string, _constructorArgs: any[]): Promise<{
        contractAddress: string;
        transactionHash: string;
    }>;
    callContract(_contractAddress: string, _methodName: string, _args: any[]): Promise<any>;
}
//# sourceMappingURL=smart-contract.service.d.ts.map