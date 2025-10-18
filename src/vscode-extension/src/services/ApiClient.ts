import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';
import { ConfigurationManager } from '../config/ConfigurationManager';

export interface AgentInfo {
    id: string;
    name: string;
    type: string;
    status: string;
    lastActive?: Date;
}

export interface HealthStatus {
    status: 'healthy' | 'unhealthy';
    timestamp: Date;
    services: Record<string, boolean>;
}

export class ApiClient {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(private configManager: ConfigurationManager) {
        this.baseUrl = this.configManager.getApiUrl();
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        this.client.interceptors.request.use(
            async (config) => {
                const token = await this.configManager.getAuthToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    vscode.window.showErrorMessage('Authentication failed. Please login.');
                }
                return Promise.reject(error);
            }
        );
    }

    async checkHealth(): Promise<HealthStatus> {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            throw new Error(`Health check failed: ${error}`);
        }
    }

    async getAgents(): Promise<AgentInfo[]> {
        try {
            const response = await this.client.get('/agents');
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch agents: ${error}`);
        }
    }

    async createAgent(agentData: any): Promise<AgentInfo> {
        try {
            const response = await this.client.post('/agents', agentData);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to create agent: ${error}`);
        }
    }

    async sendMessage(agentId: string, message: string): Promise<string> {
        try {
            const response = await this.client.post(`/agents/${agentId}/chat`, {
                message: message
            });
            return response.data.response;
        } catch (error) {
            throw new Error(`Failed to send message: ${error}`);
        }
    }

    async executeCode(code: string, language: string): Promise<any> {
        try {
            const response = await this.client.post('/code/execute', {
                code: code,
                language: language
            });
            return response.data;
        } catch (error) {
            throw new Error(`Code execution failed: ${error}`);
        }
    }

    // Expose axios instance for advanced usage
    get axiosInstance(): AxiosInstance {
        return this.client;
    }

    async post(endpoint: string, data: any): Promise<any> {
        const response = await this.client.post(endpoint, data);
        return response.data;
    }

    async get(endpoint: string): Promise<any> {
        const response = await this.client.get(endpoint);
        return response.data;
    }
}