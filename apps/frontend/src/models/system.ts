class System {
    static checkAuth(_isNewToken: boolean) {
        throw new Error('Method not implemented.');
    }
    static async getEmbeddingSettings() {
        try {
            const response = await fetch("/api/system/embedding-settings", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const result = await response.json();
            if (response.ok) {
                return result;
            }
            else {
                throw new Error(result.message || "Failed to fetch embedding settings");
            }
        }
        catch (error) {
            console.error("Error fetching embedding settings:", error);
            throw error;
        }
    }
    static async updateEmbeddingSettings(settings: any) {
        try {
            const response = await fetch("/api/system/embedding-settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            });
            const result = await response.json();
            if (response.ok) {
                return { success: true };
            }
            else {
                return { error: result.message || "Failed to update embedding settings" };
            }
        }
        catch (error) {
            console.error("Error updating embedding settings:", error);
            return { error: "An unexpected error occurred" };
        }
    }
    static async checkEmbeddingProvider(settings: any) {
        try {
            const response = await fetch("/api/system/check-embedding-provider", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            });
            const result = await response.json();
            if (response.ok) {
                return { success: true };
            }
            else {
                return { error: result.message || "Failed to check embedding provider" };
            }
        }
        catch (error) {
            console.error("Error checking embedding provider:", error);
            return { error: "An unexpected error occurred" };
        }
    }
    static async getModels(settings: any) {
        try {
            const response = await fetch("/api/system/embedding-models", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            });
            const result = await response.json();
            if (response.ok) {
                return result.models || [];
            }
            else {
                throw new Error(result.message || "Failed to fetch models");
            }
        }
        catch (error) {
            console.error("Error fetching models:", error);
            return [];
        }
    }
    static async hasEmbeddings() {
        try {
            const response = await fetch("/api/system/has-embeddings", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const result = await response.json();
            return result.hasEmbeddings || false;
        }
        catch (error) {
            console.error("Error checking embeddings:", error);
            return false;
        }
    }
    static async hasCachedEmbeddings() {
        try {
            const response = await fetch("/api/system/has-cached-embeddings", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const result = await response.json();
            return result.hasCachedEmbeddings || false;
        }
        catch (error) {
            console.error("Error checking cached embeddings:", error);
            return false;
        }
    }
    static async keys() {
        return Promise.resolve({ appName: "MyApp" });
    }
    static async login(_username: string, _password: string) {
        return {
            valid: true,
            user: { id: "1", username: "test", role: "user" },
            token: "test-token",
            message: "Login successful",
            recoveryCodes: ["code1", "code2"]
        };
    }
    static async recoverPassword(_username: string, _recoveryCodes: string[]) {
        return {
            success: true,
            resetToken: "reset-token",
            error: null
        };
    }
    static async resetPassword(_resetToken: string, _newPassword: string) {
        return {
            success: true,
            error: null
        };
    }
    static async fetchCanViewChatHistory() {
        try {
            const response = await fetch("/api/system/chat-history-settings", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const result = await response.json();
            if (response.ok) {
                return { viewable: result.canViewChatHistory };
            }
            else {
                throw new Error(result.message || "Failed to fetch chat history settings");
            }
        }
        catch (error) {
            console.error("Error fetching chat history settings:", error);
            return { viewable: false };
        }
    }
}
export default System;
