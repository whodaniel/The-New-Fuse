import * as vscode from 'vscode';
import { NewFuseApiClient, ChatParticipant, ChatRequest } from './ApiClient';
import { ConfigurationManager } from './ConfigurationManager';
import { LoggingService } from './LoggingService';
import { MetricsService } from './MetricsService';

/**
 * Chat Participant Manager
 * 
 * Manages VS Code chat participants that integrate with The New Fuse platform
 */
export class ChatParticipantManager {
	private participants: Map<string, vscode.ChatParticipant> = new Map();
	private participantData: Map<string, ChatParticipant> = new Map();
	private apiClient: NewFuseApiClient;
	private configManager: ConfigurationManager;
	private loggingService: LoggingService;
	private metricsService: MetricsService;

	constructor(
		apiClient: NewFuseApiClient,
		configManager: ConfigurationManager,
		loggingService: LoggingService,
		metricsService: MetricsService
	) {
		this.apiClient = apiClient;
		this.configManager = configManager;
		this.loggingService = loggingService;
		this.metricsService = metricsService;
	}

	/**
	 * Initialize chat participants from the backend
	 */
	async initialize(context: vscode.ExtensionContext): Promise<void> {
		try {
			// Health check first
			const isHealthy = await this.apiClient.healthCheck();
			if (!isHealthy) {
				throw new Error('Backend health check failed');
			}

			// Fetch participants from backend
			await this.refreshAgents();

			this.loggingService.info(`Initialized ${this.participants.size} chat participants`);
		} catch (error) {
			this.loggingService.error('Failed to initialize chat participants', error);
			throw error;
		}
	}

	/**
	 * Refresh agents from the backend
	 */
	async refreshAgents(): Promise<void> {
		try {
			// Fetch current participants
			const backendParticipants = await this.apiClient.getChatParticipants();
			
			// Dispose old participants
			this.disposeAllParticipants();
			
			// Create new participants
			for (const participantData of backendParticipants) {
				if (participantData.isActive) {
					await this.createChatParticipant(participantData);
				}
			}

			this.loggingService.info(`Refreshed ${this.participants.size} active chat participants`);
		} catch (error) {
			this.loggingService.error('Failed to refresh agents', error);
			throw error;
		}
	}

	/**
	 * Create a chat participant for VS Code
	 */
	private async createChatParticipant(participantData: ChatParticipant): Promise<void> {
		try {
			// Create the VS Code chat participant
			const participant = vscode.chat.createChatParticipant(
				`new-fuse.${participantData.id}`,
				this.createChatHandler(participantData)
			);

			// Set participant properties
			participant.iconPath = new vscode.ThemeIcon('robot');
			
			// Store participant references
			this.participants.set(participantData.id, participant);
			this.participantData.set(participantData.id, participantData);

			this.loggingService.debug(`Created chat participant: ${participantData.name}`);
		} catch (error) {
			this.loggingService.error(`Failed to create participant ${participantData.name}`, error);
			throw error;
		}
	}

	/**
	 * Create chat request handler for a participant
	 */
	private createChatHandler(participantData: ChatParticipant): vscode.ChatRequestHandler {
		return async (
			request: vscode.ChatRequest,
			context: vscode.ChatContext,
			stream: vscode.ChatResponseStream,
			token: vscode.CancellationToken
		) => {
			const startTime = Date.now();
			
			try {
				// Track metrics
				this.metricsService.trackRequest(participantData.id);

				// Validate request
				if (!request.prompt?.trim()) {
					stream.markdown('Please provide a message to process.');
					return;
				}

				// Create chat request
				const chatRequest: ChatRequest = {
					participantId: participantData.id,
					message: request.prompt,
					command: request.command,
					context: this.buildChatContext(context)
				};

				// Handle cancellation
				if (token.isCancellationRequested) {
					this.loggingService.debug('Chat request cancelled');
					return;
				}

				// Send request based on streaming preference
				if (this.configManager.isStreamingEnabled()) {
					await this.handleStreamingResponse(chatRequest, stream, token);
				} else {
					await this.handleRegularResponse(chatRequest, stream, token);
				}

				// Track successful completion
				const duration = Date.now() - startTime;
				this.metricsService.trackSuccess(participantData.id, duration);

			} catch (error) {
				// Track error
				const duration = Date.now() - startTime;
				this.metricsService.trackError(participantData.id, duration);

				this.loggingService.error(`Chat request failed for ${participantData.name}`, error);
				
				const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
				stream.markdown(`❌ **Error**: ${errorMessage}`);
				
				if (this.configManager.isDebugLoggingEnabled()) {
					stream.markdown(`\n\n*Debug info: Check VS Code Developer Console for details*`);
				}
			}
		};
	}

	/**
	 * Handle streaming chat response
	 */
	private async handleStreamingResponse(
		request: ChatRequest,
		stream: vscode.ChatResponseStream,
		token: vscode.CancellationToken
	): Promise<void> {
		return new Promise((resolve, reject) => {
			if (token.isCancellationRequested) {
				resolve();
				return;
			}

			this.apiClient.sendStreamingChatRequest(
				request,
				(chunk: string) => {
					if (token.isCancellationRequested) {
						return;
					}
					stream.markdown(chunk);
				},
				() => {
					resolve();
				},
				(error: Error) => {
					reject(error);
				}
			);
		});
	}

	/**
	 * Handle regular (non-streaming) chat response
	 */
	private async handleRegularResponse(
		request: ChatRequest,
		stream: vscode.ChatResponseStream,
		token: vscode.CancellationToken
	): Promise<void> {
		if (token.isCancellationRequested) {
			return;
		}

		// Show typing indicator
		stream.progress('Processing your request...');

		const response = await this.apiClient.sendChatRequest(request);
		
		if (token.isCancellationRequested) {
			return;
		}

		stream.markdown(response.response);
	}

	/**
	 * Build chat context from VS Code context
	 */
	private buildChatContext(context: vscode.ChatContext): any {
		const chatContext: any = {
			history: []
		};

		// Include relevant chat history
		for (const turn of context.history) {
			if (turn instanceof vscode.ChatRequestTurn) {
				chatContext.history.push({
					type: 'request',
					message: turn.prompt,
					command: turn.command,
					timestamp: new Date().toISOString()
				});
			} else if (turn instanceof vscode.ChatResponseTurn) {
				// Extract markdown content from response
				let responseText = '';
				for (const part of turn.response) {
					if (part instanceof vscode.ChatResponseMarkdownPart) {
						responseText += part.value.value;
					}
				}
				
				chatContext.history.push({
					type: 'response',
					message: responseText,
					timestamp: new Date().toISOString()
				});
			}
		}

		// Add workspace context if available
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (workspaceFolder) {
			chatContext.workspace = {
				name: workspaceFolder.name,
				uri: workspaceFolder.uri.toString()
			};
		}

		// Add active editor context
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			chatContext.activeEditor = {
				fileName: activeEditor.document.fileName,
				languageId: activeEditor.document.languageId,
				selection: activeEditor.selection,
				lineCount: activeEditor.document.lineCount
			};
		}

		return chatContext;
	}

	/**
	 * Get participant by ID
	 */
	getParticipant(id: string): ChatParticipant | undefined {
		return this.participantData.get(id);
	}

	/**
	 * Get all active participants
	 */
	getAllParticipants(): ChatParticipant[] {
		return Array.from(this.participantData.values());
	}

	/**
	 * Dispose a specific participant
	 */
	disposeParticipant(id: string): void {
		const participant = this.participants.get(id);
		if (participant) {
			participant.dispose();
			this.participants.delete(id);
			this.participantData.delete(id);
			this.loggingService.debug(`Disposed participant: ${id}`);
		}
	}

	/**
	 * Dispose all participants
	 */
	disposeAllParticipants(): void {
		for (const [id, participant] of this.participants) {
			participant.dispose();
		}
		this.participants.clear();
		this.participantData.clear();
		this.loggingService.debug('Disposed all participants');
	}

	/**
	 * Dispose manager
	 */
	dispose(): void {
		this.disposeAllParticipants();
		this.loggingService.info('Chat participant manager disposed');
	}
}
