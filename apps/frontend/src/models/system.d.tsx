import { EmbeddingSettings, SystemUpdateResponse } from "@/types/embedding";
declare class System {
    static checkAuth(isNewToken: boolean): {
        requiresAuth: any;
        mode: any;
    } | PromiseLike<{
        requiresAuth: any;
        mode: any;
    }>;
    static getEmbeddingSettings(): Promise<EmbeddingSettings>;
    static updateEmbeddingSettings(settings: EmbeddingSettings): Promise<SystemUpdateResponse>;
    static checkEmbeddingProvider(settings: EmbeddingSettings): Promise<SystemUpdateResponse>;
    static getModels(settings: EmbeddingSettings): Promise<string[]>;
    static hasEmbeddings(): Promise<boolean>;
    static hasCachedEmbeddings(): Promise<boolean>;
    static fetchCanViewChatHistory(): Promise<{
        viewable: boolean;
    }>;
}
export default System;
