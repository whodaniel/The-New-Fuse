import type { APIConfig, APIEndpoint } from '@/types/api';
import { EventEmitter } from '@/utils/EventEmitter';

export class APIIntegration extends EventEmitter {
    private config: APIConfig;
    private endpoints: Map<string, APIEndpoint>;

    constructor(config: APIConfig) {
        super();
        this.config = config;
        this.endpoints = new Map();
    }

    addEndpoint(endpoint: APIEndpoint): void {
        this.endpoints.set(endpoint.id, endpoint);
    }

    async executeRequest(endpointId: string, data?: unknown): Promise<unknown> {
        const endpoint = this.endpoints.get(endpointId);
        if (!endpoint) {
            throw new Error(`Unknown endpoint: ${endpointId}`);
        }

        try {
            const response = await fetch(endpoint.url, {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...endpoint.headers
                },
                body: data ? JSON.stringify(data) : undefined,
                credentials: endpoint.requiresAuth ? 'include' : 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            throw new Error(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    getEndpoint(id: string): APIEndpoint | undefined {
        return this.endpoints.get(id);
    }

    getEndpoints(): APIEndpoint[] {
        return Array.from(this.endpoints.values());
    }
}