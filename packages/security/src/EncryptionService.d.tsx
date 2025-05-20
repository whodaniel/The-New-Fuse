export declare class EncryptionService {
    private logger;
    private readonly db;
    private config;
    private masterKey;
    constructor();
    initialize(): Promise<void>;
}
