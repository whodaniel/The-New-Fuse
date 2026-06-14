import { ProviderApiKey } from '../types/index.js';
export declare class DrizzleProviderApiKeyRepository {
    listByUser(userId: string): Promise<Omit<ProviderApiKey, 'encryptedKey'>[]>;
    findDecryptedByUserAndProvider(userId: string, provider: string): Promise<(Omit<ProviderApiKey, 'encryptedKey'> & {
        apiKey: string;
    }) | null>;
    upsert(userId: string, provider: string, apiKey: string): Promise<Omit<ProviderApiKey, 'encryptedKey'>>;
    deleteByUserAndId(userId: string, id: string): Promise<boolean>;
}
export declare const drizzleProviderApiKeyRepository: DrizzleProviderApiKeyRepository;
//# sourceMappingURL=provider-api-key.repository.d.ts.map