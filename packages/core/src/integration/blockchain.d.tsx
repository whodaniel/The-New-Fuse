export declare class BlockchainIntegration {
    private readonly config;
    constructor(config: {
        providers: {
            ethereum: string;
            circle: {
                apiKey: string;
                environment: 'sandbox' | 'production';
            };
        };
    });
    initialize(): Promise<void>;
}
