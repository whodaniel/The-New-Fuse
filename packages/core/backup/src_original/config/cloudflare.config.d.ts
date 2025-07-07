export declare const cloudflareConfig: {
    agent: {
        namespace: string;
        persistence: {
            type: string;
            database: boolean;
        };
        communication: {
            websocket: boolean;
            redis: boolean;
        };
        scaling: {
            minInstances: number;
            maxInstances: number;
        };
    };
    ai: {
        gateway: {
            enabled: boolean;
            caching: boolean;
            rateLimiting: boolean;
            retries: number;
        };
        vectorize: {
            enabled: boolean;
            collections: string[];
        };
    };
};
