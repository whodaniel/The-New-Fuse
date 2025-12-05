declare class System {
    static checkAuth(_isNewToken: boolean): void;
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
        appName: string;
    }>;
    static login(_username: string, _password: string): Promise<{
        valid: boolean;
        user: {
            id: string;
            username: string;
            role: string;
        };
        token: string;
        message: string;
        recoveryCodes: string[];
    }>;
    static recoverPassword(_username: string, _recoveryCodes: string[]): Promise<{
        success: boolean;
        resetToken: string;
        error: null;
    }>;
    static resetPassword(_resetToken: string, _newPassword: string): Promise<{
        success: boolean;
        error: null;
    }>;
    static fetchCanViewChatHistory(): Promise<{
        viewable: any;
    }>;
}
export default System;
