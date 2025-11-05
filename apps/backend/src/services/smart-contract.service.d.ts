export declare const AGENT_NFT_ABI: string[];
export declare const MARKETPLACE_ABI: string[];
export declare const REVENUE_DISTRIBUTOR_ABI: string[];
export declare const SMART_ACCOUNT_FACTORY_ABI: string[];
export declare class SmartContractService {
    private readonly logger;
    private provider;
    private wallet;
    private agentNftContract;
    private marketplaceContract;
    private revenueDistributorContract;
    private smartAccountFactoryContract;
    constructor();
    private initializeContracts;
    mintAgentNft(ownerAddress: string, metadataUri: string): Promise<{
        tokenId: number;
        txHash: string;
    }>;
    updateTokenMetadata(tokenId: number, metadataUri: string): Promise<string>;
    transferFractionalShare(tokenId: number, from: string, to: string, shareAmount: number): Promise<string>;
    listShares(agentTokenId: number, shareAmount: number, pricePerShare: string, duration: number): Promise<{
        listingId: number;
        txHash: string;
    }>;
    buyShares(listingId: number, totalPrice: string): Promise<string>;
    makeOffer(listingId: number, shareAmount: number, offerPrice: string): Promise<{
        offerId: number;
        txHash: string;
    }>;
    acceptOffer(offerId: number): Promise<string>;
    createRevenueStream(agentTokenId: number, streamName: string, tokenAddress: string, distributionThreshold: string): Promise<{
        streamId: number;
        txHash: string;
    }>;
    addRevenue(streamId: number, amount: string, tokenAddress?: string): Promise<string>;
    distributeRevenue(streamId: number): Promise<{
        distributedAmount: string;
        txHash: string;
    }>;
    createSmartAccount(ownerAddress: string, salt: number): Promise<{
        accountAddress: string;
        txHash: string;
    }>;
    getSmartAccountAddress(ownerAddress: string, salt: number): Promise<string>;
    getContractAddresses(): {
        agentNft: any;
        marketplace: any;
        revenueDistributor: any;
        smartAccountFactory: any;
    };
    getBlockNumber(): Promise<number>;
    getTransaction(txHash: string): Promise<any>;
    getTransactionReceipt(txHash: string): Promise<any>;
}
//# sourceMappingURL=smart-contract.service.d.ts.map