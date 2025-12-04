declare class System {
    static checkAuth(isNewToken: boolean): void;
    static getEmbeddingSettings(): Promise<any>;
    static updateEmbeddingSettings(settings: any): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
    }>;
    static checkEmbeddingProvider(settings: any): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
    }>;
    static getModels(settings: any): Promise<any>;
    static hasEmbeddings(): Promise<any>;
    static hasCachedEmbeddings(): Promise<any>;
    static keys(): Promise<{
        appName: string | null;
    }>;
    static login(username: string, password: string): Promise<{
        valid: boolean;
        user: any;
        token: string | null;
        message: string;
        recoveryCodes?: string[] | null;
    }>;
    static recoverPassword(username: string, recoveryCodes: string[]): Promise<{
        success: boolean;
        resetToken: string | null;
        error: string | null;
    }>;
    static resetPassword(resetToken: string, newPassword: string): Promise<{
        success: boolean;
        error: string | null;
    }>;
    static fetchCanViewChatHistory(): Promise<{
        viewable: any;
    }>;
}
export default System;
