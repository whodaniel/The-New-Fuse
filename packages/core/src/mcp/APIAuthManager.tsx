import { APISpec } from '../agents/types/workflow.types.js';

export class APIAuthManager {
    private static instance: APIAuthManager;
    private authTokens: Map<string, any> = new Map();
    
    public static getInstance(): APIAuthManager {
        if (!APIAuthManager.instance) {
            APIAuthManager.instance = new APIAuthManager();
        }
        return APIAuthManager.instance;
    }

    async getAuthHeaders(agentId: string, auth: APISpec['auth']): Promise<Record<string, string>> {
        if (!auth) return {};

        switch (auth.type) {
            case 'bearer':
                const token = await this.getBearerToken(agentId, auth.config);
                return { 'Authorization': `Bearer ${token}` };

            case 'basic':
                const { username, password } = auth.config;
                const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
                return { 'Authorization': `Basic ${basicAuth}` };

            case 'apiKey':
                const { key, headerName = 'X-API-Key' } = auth.config;
                return { [headerName]: key };

            case 'oauth2':
                const oauthToken = await this.getOAuth2Token(agentId, auth.config);
                return { 'Authorization': `Bearer ${oauthToken}` };

            default:
                return {};
        }
    }

    private async getBearerToken(agentId: string, config: any): Promise<string> {
        let token = this.authTokens.get(`${agentId}_bearer`);
        if (!token || this.isTokenExpired(token)) {
            token = await this.refreshBearerToken(config);
            this.authTokens.set(`${agentId}_bearer`, token);
        }
        return token.access_token;
    }

    private async getOAuth2Token(agentId: string, config: any): Promise<string> {
        let token = this.authTokens.get(`${agentId}_oauth2`);
        if (!token || this.isTokenExpired(token)) {
            token = await this.refreshOAuth2Token(config);
            this.authTokens.set(`${agentId}_oauth2`, token);
        }
        return token.access_token;
    }

    private async refreshBearerToken(config: any): Promise<any> {
        const response = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                grant_type: 'client_credentials'
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to refresh bearer token');
        }
        
        const token = await response.json();
        token.expiresAt = Date.now() + (token.expires_in * 1000);
        return token;
    }

    private async refreshOAuth2Token(config: any): Promise<any> {
        const response = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: config.refreshToken,
                client_id: config.clientId,
                client_secret: config.clientSecret
            })
        });

        if (!response.ok) {
            throw new Error('Failed to refresh OAuth2 token');
        }

        const token = await response.json();
        token.expiresAt = Date.now() + (token.expires_in * 1000);
        return token;
    }

    private isTokenExpired(token: any): boolean {
        return token.expiresAt && token.expiresAt <= Date.now();
    }
}