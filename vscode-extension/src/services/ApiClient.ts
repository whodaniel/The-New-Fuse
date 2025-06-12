import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ConfigurationManager } from './ConfigurationManager';
import { LoggingService } from './LoggingService';

/**
 * Types matching the backend API
 */
export interface ChatParticipant {
	id: string;
	name: string;
	description: string;
	commands: string[];
	isActive: boolean;
	metadata: Record<string, any>;
	createdAt: string;
	updatedAt: string;
}

export interface CreateChatParticipantDto {
	name: string;
	description: string;
	commands?: string[];
	metadata?: Record<string, any>;
}

export interface UpdateChatParticipantDto {
	name?: string;
	description?: string;
	commands?: string[];
	metadata?: Record<string, any>;
}

export interface ChatRequest {
	participantId: string;
	message: string;
	command?: string;
	context?: any;
}

export interface ChatResponse {
	response: string;
	metadata?: Record<string, any>;
}

export interface AgentTemplate {
	id: string;
	name: string;
	description: string;
	defaultCommands: string[];
	configSchema: any;
	category: string;
}

export interface IntegrationMetrics {
	totalParticipants: number;
	activeParticipants: number;
	totalRequests: number;
	averageResponseTime: number;
	errorRate: number;
	lastRequestAt?: string;
}

/**
 * API Client for communicating with The New Fuse backend
 */
export class NewFuseApiClient {
	private client: AxiosInstance;
	private configManager: ConfigurationManager;
	private loggingService: LoggingService;

	constructor(configManager: ConfigurationManager, loggingService: LoggingService) {
		this.configManager = configManager;
		this.loggingService = loggingService;
		this.client = this.createAxiosInstance();
	}

	/**
	 * Update configuration and recreate client
	 */
	async updateConfiguration(): Promise<void> {
		this.client = this.createAxiosInstance();
		this.loggingService.info('API client configuration updated');
	}

	/**
	 * Create axios instance with current configuration
	 */
	private createAxiosInstance(): AxiosInstance {
		const config = this.configManager.getConfiguration();
		
		const client = axios.create({
			baseURL: `${config.serverUrl}/api/copilot`,
			timeout: 30000,
			headers: {
				'Content-Type': 'application/json',
				'X-Tenant-ID': config.tenantId,
				'Authorization': `Bearer ${config.apiKey}`
			}
		});

		// Request interceptor for logging
		client.interceptors.request.use(
			(config) => {
				this.loggingService.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
				return config;
			},
			(error) => {
				this.loggingService.error('API Request Error', error);
				return Promise.reject(error);
			}
		);

		// Response interceptor for logging and error handling
		client.interceptors.response.use(
			(response) => {
				this.loggingService.debug(`API Response: ${response.status} ${response.config.url}`);
				return response;
			},
			(error) => {
				this.loggingService.error('API Response Error', error);
				
				if (error.response?.status === 401) {
					this.loggingService.error('Authentication failed - check your API key');
				} else if (error.response?.status === 403) {
					this.loggingService.error('Access forbidden - check your tenant permissions');
				}
				
				return Promise.reject(error);
			}
		);

		return client;
	}

	/**
	 * Get all chat participants for the current tenant
	 */
	async getChatParticipants(): Promise<ChatParticipant[]> {
		try {
			const response = await this.client.get<ChatParticipant[]>('/participants');
			return response.data;
		} catch (error) {
			this.loggingService.error('Failed to fetch chat participants', error);
			throw new Error('Failed to fetch chat participants');
		}
	}

	/**
	 * Get a specific chat participant by ID
	 */
	async getChatParticipant(id: string): Promise<ChatParticipant> {
		try {
			const response = await this.client.get<ChatParticipant>(`/participants/${id}`);
			return response.data;
		} catch (error) {
			this.loggingService.error(`Failed to fetch chat participant ${id}`, error);
			throw new Error(`Failed to fetch chat participant ${id}`);
		}
	}

	/**
	 * Create a new chat participant
	 */
	async createChatParticipant(data: CreateChatParticipantDto): Promise<ChatParticipant> {
		try {
			const response = await this.client.post<ChatParticipant>('/participants', data);
			return response.data;
		} catch (error) {
			this.loggingService.error('Failed to create chat participant', error);
			throw new Error('Failed to create chat participant');
		}
	}

	/**
	 * Update an existing chat participant
	 */
	async updateChatParticipant(id: string, data: UpdateChatParticipantDto): Promise<ChatParticipant> {
		try {
			const response = await this.client.put<ChatParticipant>(`/participants/${id}`, data);
			return response.data;
		} catch (error) {
			this.loggingService.error(`Failed to update chat participant ${id}`, error);
			throw new Error(`Failed to update chat participant ${id}`);
		}
	}

	/**
	 * Delete a chat participant
	 */
	async deleteChatParticipant(id: string): Promise<void> {
		try {
			await this.client.delete(`/participants/${id}`);
		} catch (error) {
			this.loggingService.error(`Failed to delete chat participant ${id}`, error);
			throw new Error(`Failed to delete chat participant ${id}`);
		}
	}

	/**
	 * Send a chat request to a participant
	 */
	async sendChatRequest(request: ChatRequest): Promise<ChatResponse> {
		try {
			const response = await this.client.post<ChatResponse>('/chat', request);
			return response.data;
		} catch (error) {
			this.loggingService.error('Failed to send chat request', error);
			throw new Error('Failed to send chat request');
		}
	}

	/**
	 * Send a streaming chat request
	 */
	async sendStreamingChatRequest(
		request: ChatRequest,
		onChunk: (chunk: string) => void,
		onComplete: () => void,
		onError: (error: Error) => void
	): Promise<void> {
		try {
			const response = await this.client.post('/chat/stream', request, {
				responseType: 'stream'
			});

			let buffer = '';
			
			response.data.on('data', (chunk: Buffer) => {
				buffer += chunk.toString();
				
				// Process complete lines
				const lines = buffer.split('\n');
				buffer = lines.pop() || ''; // Keep incomplete line in buffer
				
				for (const line of lines) {
					if (line.trim()) {
						try {
							if (line.startsWith('data: ')) {
								const data = line.slice(6);
								if (data === '[DONE]') {
									onComplete();
									return;
								}
								const parsed = JSON.parse(data);
								if (parsed.chunk) {
									onChunk(parsed.chunk);
								}
							}
						} catch (e) {
							// Ignore parsing errors for individual chunks
						}
					}
				}
			});

			response.data.on('end', () => {
				onComplete();
			});

			response.data.on('error', (error: Error) => {
				onError(error);
			});
		} catch (error) {
			this.loggingService.error('Failed to send streaming chat request', error);
			onError(error instanceof Error ? error : new Error('Unknown streaming error'));
		}
	}

	/**
	 * Get available agent templates
	 */
	async getAgentTemplates(): Promise<AgentTemplate[]> {
		try {
			const response = await this.client.get<AgentTemplate[]>('/templates');
			return response.data;
		} catch (error) {
			this.loggingService.error('Failed to fetch agent templates', error);
			throw new Error('Failed to fetch agent templates');
		}
	}

	/**
	 * Create participant from template
	 */
	async createParticipantFromTemplate(templateId: string, config: any): Promise<ChatParticipant> {
		try {
			const response = await this.client.post<ChatParticipant>(`/templates/${templateId}/create`, config);
			return response.data;
		} catch (error) {
			this.loggingService.error(`Failed to create participant from template ${templateId}`, error);
			throw new Error(`Failed to create participant from template ${templateId}`);
		}
	}

	/**
	 * Get integration metrics
	 */
	async getMetrics(): Promise<IntegrationMetrics> {
		try {
			const response = await this.client.get<IntegrationMetrics>('/metrics');
			return response.data;
		} catch (error) {
			this.loggingService.error('Failed to fetch metrics', error);
			throw new Error('Failed to fetch metrics');
		}
	}

	/**
	 * Health check
	 */
	async healthCheck(): Promise<boolean> {
		try {
			await this.client.get('/health');
			return true;
		} catch (error) {
			this.loggingService.error('Health check failed', error);
			return false;
		}
	}
}
