import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { ChatViewProvider } from '../../views/ChatViewProvider';
import { LLMService } from './LLMService';
import { NotificationService } from '../core/NotificationService';
import { StorageService } from '../data/StorageService';

/**
 * Represents a single message in a chat session.
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: any; // e.g., for starred status, LLM provider used
}

/**
 * Represents a chat session, containing a series of messages.
 */
export interface ChatSession {
    id: string;
    messages: ChatMessage[];
    createdAt: Date;
    metadata?: any;
}

const CHAT_SESSIONS_KEY = 'theNewFuse.chatSessions';
const CURRENT_SESSION_ID_KEY = 'theNewFuse.currentSessionId';

/**
 * Manages chat sessions, message history, and orchestrates LLM interactions for chat.
 */
export class ChatService {
    private llmService: LLMService;
    private notificationService: NotificationService;
    private storageService: StorageService;
    private activeSessions: Map<string, ChatSession> = new Map();
    private currentSessionId: string | null = null;
    private chatViewProvider?: ChatViewProvider;

    constructor(
        llmService: LLMService,
        notificationService: NotificationService,
        storageService: StorageService
    ) {
        this.llmService = llmService;
        this.notificationService = notificationService;
        this.storageService = storageService;
        this.loadSessions(); // Load sessions on initialization
    }

    /**
     * Sets the ChatViewProvider instance.
     * @param provider The ChatViewProvider instance.
     */
    public setChatViewProvider(provider: ChatViewProvider): void {
        this.chatViewProvider = provider;
    }

    /**
     * Creates a new chat session.
     * @param initialSystemMessage Optional system message to start the session.
     * @returns The newly created ChatSession.
     */
    public createNewSession(initialSystemMessage?: string): ChatSession {
        const sessionId = uuidv4();
        const newSession: ChatSession = {
            id: sessionId,
            messages: [],
            createdAt: new Date(),
            metadata: {},
        };

        if (initialSystemMessage) {
            const systemMessage: ChatMessage = {
                id: uuidv4(),
                role: 'system',
                content: initialSystemMessage,
                timestamp: new Date(),
            };
            newSession.messages.push(systemMessage);
        }

        this.activeSessions.set(sessionId, newSession);
        this.currentSessionId = sessionId;
        this.saveSessions();
        this.notificationService.showInformationMessage(`New chat session created: ${sessionId}`);
        this.chatViewProvider?.setActiveSession(newSession);
        this.chatViewProvider?.updateChatMessages(newSession.messages, newSession.id);
        return newSession;
    }

    /**
     * Gets the current active chat session. If none exists, creates a new one.
     * @returns The current ChatSession.
     */
    public getCurrentSession(): ChatSession {
        if (this.currentSessionId && this.activeSessions.has(this.currentSessionId)) {
            return this.activeSessions.get(this.currentSessionId)!;
        }
        return this.createNewSession("Welcome to your new chat session!");
    }

    /**
     * Gets a specific chat session by its ID.
     * @param sessionId The ID of the session to retrieve.
     * @returns The ChatSession if found, otherwise undefined.
     */
    public getSessionById(sessionId: string): ChatSession | undefined {
        return this.activeSessions.get(sessionId);
    }

    /**
     * Sets the current active session.
     * @param sessionId The ID of the session to set as active.
     * @returns True if the session was found and set, false otherwise.
     */
    public setCurrentSession(sessionId: string): boolean {
        if (this.activeSessions.has(sessionId)) {
            this.currentSessionId = sessionId;
            this.storageService.storeGlobal(CURRENT_SESSION_ID_KEY, this.currentSessionId); // Save change immediately
            const session = this.getSessionById(sessionId);
            if (session) {
                this.chatViewProvider?.setActiveSession(session);
                this.chatViewProvider?.updateChatMessages(session.messages || [], sessionId);
            }
            this.notificationService.showInformationMessage(`Switched to chat session: ${sessionId}`);
            return true;
        }
        this.notificationService.showWarningMessage(`Chat session not found: ${sessionId}`);
        return false;
    }


    /**
     * Adds a user message to a session and triggers an LLM response.
     * @param userPrompt The user's message content.
     * @param sessionId The ID of the session to add the message to. If null, uses the current session.
     * @returns A promise that resolves to the assistant's ChatMessage or null if an error occurs.
     */
    public async sendMessage(userPrompt: string, sessionId?: string): Promise<ChatMessage | null> {
        const sessionToUseId = sessionId || this.currentSessionId;
        if (!sessionToUseId) {
            this.notificationService.showErrorMessage('No active chat session to send message to.');
            return null;
        }

        const session = this.activeSessions.get(sessionToUseId);
        if (!session) {
            this.notificationService.showErrorMessage(`Chat session ${sessionToUseId} not found.`);
            return null;
        }

        const userMessage: ChatMessage = {
            id: uuidv4(),
            role: 'user',
            content: userPrompt,
            timestamp: new Date(),
        };
        session.messages.push(userMessage);
        this.chatViewProvider?.appendChatMessage(userMessage);
        this.chatViewProvider?.setThinkingIndicator(true);
        this.chatViewProvider?.clearUserInput();

        // For simplicity, sending only the last user message as prompt.
        // A more advanced implementation would send a history of messages.
        const llmResponseContent = await this.llmService.generateResponse(userPrompt);
        this.chatViewProvider?.setThinkingIndicator(false);

        if (llmResponseContent) {
            const assistantMessage: ChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: llmResponseContent,
                timestamp: new Date(),
                metadata: { provider: this.llmService.getCurrentProvider()?.id },
            };
            session.messages.push(assistantMessage);
            this.saveSessions();
            this.chatViewProvider?.appendChatMessage(assistantMessage);
            return assistantMessage;
        } else {
            // Remove user message if LLM failed to respond, or handle error differently
            // session.messages.pop(); // Optional: revert user message on failure
            this.notificationService.showErrorMessage('Failed to get a response from the LLM.');
            this.saveSessions(); // Save even if LLM fails, to keep user message
            return null;
        }
    }

    /**
     * Loads chat sessions from storage (placeholder using globalState).
     */
    private loadSessions(): void {
        try {
            const parsedSessions = this.storageService.getGlobal<ChatSession[]>(CHAT_SESSIONS_KEY, []);
            // Dates are not automatically revived by JSON.parse with StorageService, so we do it manually.
            // It's better to store dates as ISO strings or timestamps (numbers)
            // For now, assuming they are stored as strings and need revival if StorageService doesn't handle it.
            // However, StorageService's getGlobal might already handle JSON parsing and date revival if configured.
            // Let's assume for now that dates are strings and need to be converted.
            const revivedSessions = parsedSessions.map(session => ({
                ...session,
                createdAt: new Date(session.createdAt),
                messages: session.messages.map(msg => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }))
            }));

            revivedSessions.forEach(session => this.activeSessions.set(session.id, session));
            this.currentSessionId = this.storageService.getGlobal<string | null>(CURRENT_SESSION_ID_KEY, null);

            // Validate currentSessionId
            if (this.currentSessionId && !this.activeSessions.has(this.currentSessionId)) {
                this.notificationService.showWarningMessage(`Loaded currentSessionId (${this.currentSessionId}) is invalid or session no longer exists. Resetting.`);
                this.currentSessionId = null;
            }

            // If no current session ID, but sessions exist, set to the most recent one
            if (!this.currentSessionId && this.activeSessions.size > 0) {
                const sortedSessions = Array.from(this.activeSessions.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                this.currentSessionId = sortedSessions[0].id;
            }

            console.log(`Loaded ${this.activeSessions.size} chat sessions. Current session ID: ${this.currentSessionId}`);

            // Update UI after loading
            const currentSession = this.getCurrentSession(); // getCurrentSession handles creating one if needed
            this.chatViewProvider?.setActiveSession(currentSession);
            this.chatViewProvider?.updateChatMessages(currentSession.messages || [], currentSession.id);

        } catch (error) {
            this.notificationService.showErrorMessage('Failed to load chat history.');
            console.error('Error loading chat sessions:', error);
            this.activeSessions.clear(); // Start fresh if loading fails
            this.currentSessionId = null;
        }
    }

    /**
     * Saves all active chat sessions and the current session ID to storage.
     */
    private saveSessions(): void {
        try {
            const sessionsArray = Array.from(this.activeSessions.values());
            this.storageService.storeGlobal(CHAT_SESSIONS_KEY, sessionsArray);
            this.storageService.storeGlobal(CURRENT_SESSION_ID_KEY, this.currentSessionId);
            // console.log(`Saved ${sessionsArray.length} chat sessions. Current session ID: ${this.currentSessionId}`);
        } catch (error) {
            this.notificationService.showErrorMessage('Failed to save chat history.');
            console.error('Error saving chat sessions:', error);
        }
    }

    /**
     * Clears a specific chat session.
     * @param sessionId The ID of the session to clear.
     */
    public clearSession(sessionId: string): void {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.messages = [];
            this.saveSessions();
            if (this.currentSessionId === sessionId) {
                this.chatViewProvider?.updateChatMessages([], sessionId);
            }
            this.notificationService.showInformationMessage(`Chat session ${sessionId} cleared.`);
        } else {
            this.notificationService.showWarningMessage(`Chat session ${sessionId} not found for clearing.`);
        }
    }

    /**
     * Deletes a specific chat session.
     * @param sessionId The ID of the session to delete.
     */
    public deleteSession(sessionId: string): void {
        if (this.activeSessions.has(sessionId)) {
            this.activeSessions.delete(sessionId);
            const wasCurrentSession = this.currentSessionId === sessionId;
            if (wasCurrentSession) {
                // Determine next session (most recent if available, or null)
                if (this.activeSessions.size > 0) {
                    const sortedSessions = Array.from(this.activeSessions.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    this.currentSessionId = sortedSessions[0].id;
                } else {
                    this.currentSessionId = null;
                }
            }
            this.saveSessions(); // Save before UI update to reflect new currentSessionId

            if (wasCurrentSession) {
                const newCurrentSession = this.currentSessionId ? this.activeSessions.get(this.currentSessionId) : undefined;
                this.chatViewProvider?.setActiveSession(newCurrentSession); // Pass undefined if no session
                this.chatViewProvider?.updateChatMessages(newCurrentSession?.messages || [], newCurrentSession?.id || '');
            }
            this.notificationService.showInformationMessage(`Chat session ${sessionId} deleted.`);
        } else {
            this.notificationService.showWarningMessage(`Chat session ${sessionId} not found for deletion.`);
        }
    }

    /**
     * Retrieves all chat sessions.
     * @returns An array of all ChatSession objects.
     */
    public getAllSessions(): ChatSession[] {
        return Array.from(this.activeSessions.values()).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
}