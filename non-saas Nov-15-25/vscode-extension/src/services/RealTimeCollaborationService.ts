import * as vscode from 'vscode';
import { ApiClient } from './ApiClient';
import { ConfigurationManager } from '../config/ConfigurationManager';

export interface CollaborationSession {
    id: string;
    name: string;
    host: Collaborator;
    participants: Collaborator[];
    status: 'active' | 'paused' | 'ended';
    createdAt: Date;
    settings: CollaborationSettings;
    currentFile?: string;
    cursorPositions: Map<string, CursorPosition>;
    activeComments: CodeComment[];
}

export interface Collaborator {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'host' | 'editor' | 'viewer';
    status: 'online' | 'away' | 'offline';
    lastSeen: Date;
    permissions: CollaborationPermission[];
}

export interface CollaborationSettings {
    allowEditing: boolean;
    allowComments: boolean;
    requireApproval: boolean;
    notifyOnChanges: boolean;
    syncCursor: boolean;
    syncSelection: boolean;
    autoSave: boolean;
}

export interface CollaborationPermission {
    type: 'edit' | 'comment' | 'invite' | 'manage';
    scope: 'all' | 'file' | 'selection';
    granted: boolean;
}

export interface CursorPosition {
    userId: string;
    filePath: string;
    line: number;
    column: number;
    selection?: vscode.Range;
    timestamp: Date;
}

export interface CodeComment {
    id: string;
    authorId: string;
    filePath: string;
    lineRange: vscode.Range;
    content: string;
    type: 'comment' | 'suggestion' | 'question' | 'approval';
    status: 'open' | 'resolved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
    replies: CommentReply[];
    reactions: CommentReaction[];
}

export interface CommentReply {
    id: string;
    authorId: string;
    content: string;
    createdAt: Date;
}

export interface CommentReaction {
    emoji: string;
    userId: string;
    createdAt: Date;
}

export class RealTimeCollaborationService {
    private apiClient: ApiClient;
    private configManager: ConfigurationManager;
    private activeSession?: CollaborationSession;
    private cursorDecorations = new Map<string, vscode.TextEditorDecorationType>();
    private commentDecorations = new Map<string, vscode.TextEditorDecorationType>();
    private commentControllers = new Map<string, vscode.CommentController>();
    private wsConnection?: WebSocket;
    private heartbeatInterval?: any;
    private statusBarItem?: vscode.StatusBarItem;

    constructor(apiClient: ApiClient, configManager: ConfigurationManager) {
        this.apiClient = apiClient;
        this.configManager = configManager;
        this.initializeWebSocketConnection();
    }

    /**
     * Start a new collaboration session
     */
    async startCollaborationSession(name: string, settings?: Partial<CollaborationSettings>): Promise<string> {
        try {
            const response = await this.apiClient.axiosInstance.post('/collaboration/sessions', {
                name,
                settings: {
                    allowEditing: true,
                    allowComments: true,
                    requireApproval: false,
                    notifyOnChanges: true,
                    syncCursor: true,
                    syncSelection: true,
                    autoSave: true,
                    ...settings
                }
            });

            this.activeSession = response.data.session;
            this.setupCollaborationUI();
            this.startHeartbeat();

            vscode.window.showInformationMessage(`Collaboration session "${name}" started!`);
            if (!this.activeSession) {
                throw new Error('No active collaboration session');
            }
            return this.activeSession.id;
        } catch (error) {
            console.error('Error starting collaboration session:', error);
            throw error;
        }
    }

    /**
     * Join an existing collaboration session
     */
    async joinCollaborationSession(sessionId: string): Promise<void> {
        try {
            const response = await this.apiClient.axiosInstance.post(`/collaboration/sessions/${sessionId}/join`, {
                userInfo: await this.getCurrentUserInfo()
            });

            this.activeSession = response.data.session;
            this.setupCollaborationUI();
            this.startHeartbeat();

            if (this.activeSession) {
                vscode.window.showInformationMessage(`Joined collaboration session: ${this.activeSession.name}`);
            }
        } catch (error) {
            console.error('Error joining collaboration session:', error);
            throw error;
        }
    }

    /**
     * Leave current collaboration session
     */
    async leaveCollaborationSession(): Promise<void> {
        if (!this.activeSession) {
            return;
        }

        try {
            await this.apiClient.axiosInstance.post(`/collaboration/sessions/${this.activeSession.id}/leave`, {
                userId: await this.getCurrentUserId()
            });

            this.cleanupCollaborationUI();
            this.stopHeartbeat();

            vscode.window.showInformationMessage(`Left collaboration session: ${this.activeSession.name}`);
            this.activeSession = undefined;
        } catch (error) {
            console.error('Error leaving collaboration session:', error);
        }
    }

    /**
     * Invite user to collaboration session
     */
    async inviteToSession(email: string, role: 'editor' | 'viewer' = 'viewer'): Promise<void> {
        if (!this.activeSession) {
            throw new Error('No active collaboration session');
        }

        try {
            await this.apiClient.axiosInstance.post(`/collaboration/sessions/${this.activeSession.id}/invite`, {
                email,
                role,
                permissions: this.getDefaultPermissions(role)
            });

            vscode.window.showInformationMessage(`Invitation sent to ${email}`);
        } catch (error) {
            console.error('Error inviting user:', error);
            throw error;
        }
    }

    /**
     * Add comment to code
     */
    async addCodeComment(filePath: string, range: vscode.Range, content: string, type: CodeComment['type'] = 'comment'): Promise<string> {
        if (!this.activeSession) {
            throw new Error('No active collaboration session');
        }

        try {
            const response = await this.apiClient.axiosInstance.post(`/collaboration/comments`, {
                sessionId: this.activeSession.id,
                filePath,
                lineRange: {
                    startLine: range.start.line,
                    startColumn: range.start.character,
                    endLine: range.end.line,
                    endColumn: range.end.character
                },
                content,
                type,
                authorId: await this.getCurrentUserId()
            });

            // Update local UI
            this.updateCommentDecorations(filePath);

            return response.data.commentId;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }

    /**
     * Update cursor position for real-time tracking
     */
    updateCursorPosition(editor: vscode.TextEditor): void {
        if (!this.activeSession || !this.activeSession.settings.syncCursor) {
            return;
        }

        const position = editor.selection.active;
        const cursorPos: CursorPosition = {
            userId: this.getCurrentUserId(),
            filePath: editor.document.fileName,
            line: position.line,
            column: position.character,
            selection: editor.selection,
            timestamp: new Date()
        };

        // Send to backend
        this.sendWebSocketMessage('cursor_update', cursorPos);

        // Update local decorations
        this.updateCursorDecorations(editor);
    }

    /**
     * Handle file content changes in collaboration
     */
    async handleFileChange(event: vscode.TextDocumentChangeEvent): Promise<void> {
        if (!this.activeSession || !this.activeSession.settings.allowEditing) {
            return;
        }

        try {
            await this.apiClient.axiosInstance.post('/collaboration/changes', {
                sessionId: this.activeSession.id,
                filePath: event.document.fileName,
                changes: event.contentChanges.map((change: any) => ({
                    range: {
                        startLine: change.range.start.line,
                        startColumn: change.range.start.character,
                        endLine: change.range.end.line,
                        endColumn: change.range.end.character
                    },
                    text: change.text,
                    rangeLength: change.rangeLength
                })),
                timestamp: Date.now()
            });

            // Notify other participants
            this.sendWebSocketMessage('file_changed', {
                filePath: event.document.fileName,
                changeCount: event.contentChanges.length
            });
        } catch (error) {
            console.error('Error handling file change:', error);
        }
    }

    /**
     * Get current collaboration session
     */
    getActiveSession(): CollaborationSession | undefined {
        return this.activeSession;
    }

    /**
     * Get all participants in current session
     */
    getParticipants(): Collaborator[] {
        if (!this.activeSession) {
            return [];
        }
        return [...this.activeSession.participants];
    }

    /**
     * Toggle follow mode for a user
     */
    async toggleFollowUser(userId: string): Promise<void> {
        if (!this.activeSession) {
            return;
        }

        try {
            await this.apiClient.axiosInstance.post(`/collaboration/sessions/${this.activeSession.id}/follow`, {
                targetUserId: userId,
                enabled: true // Would need state management for toggle
            });

            vscode.window.showInformationMessage(`Now following ${this.getParticipantName(userId)}`);
        } catch (error) {
            console.error('Error toggling follow mode:', error);
        }
    }

    /**
     * Request approval for changes
     */
    async requestApproval(description: string): Promise<void> {
        if (!this.activeSession || !this.activeSession.settings.requireApproval) {
            return;
        }

        try {
            await this.apiClient.axiosInstance.post(`/collaboration/approvals`, {
                sessionId: this.activeSession.id,
                description,
                requesterId: await this.getCurrentUserId(),
                timestamp: Date.now()
            });

            vscode.window.showInformationMessage('Approval request sent to participants');
        } catch (error) {
            console.error('Error requesting approval:', error);
        }
    }

    /**
     * Initialize WebSocket connection for real-time updates
     */
    private async initializeWebSocketConnection(): Promise<void> {
        try {
            const wsUrl = await this.getWebSocketUrl();
            this.wsConnection = new WebSocket(wsUrl);

            this.wsConnection.onopen = () => {
                console.log('Collaboration WebSocket connected');
            };

            this.wsConnection.onmessage = (event) => {
                this.handleWebSocketMessage(JSON.parse(event.data));
            };

            this.wsConnection.onclose = () => {
                console.log('Collaboration WebSocket disconnected');
                // Attempt to reconnect after delay
                setTimeout(() => this.initializeWebSocketConnection(), 5000);
            };

            this.wsConnection.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Error initializing WebSocket:', error);
        }
    }

    /**
     * Setup collaboration UI elements
     */
    private setupCollaborationUI(): void {
        if (!this.activeSession) {
            return;
        }

        // Create comment controller for the workspace
        const commentController = vscode.comments.createCommentController(
            `collaboration-${this.activeSession.id}`,
            `Collaboration: ${this.activeSession.name}`
        );

        commentController.commentingRangeProvider = {
            provideCommentingRanges: (document: vscode.TextDocument, token: vscode.CancellationToken) => {
                // Allow commenting on any line
                const ranges: vscode.Range[] = [];
                for (let i = 0; i < document.lineCount; i++) {
                    ranges.push(new vscode.Range(i, 0, i, 0));
                }
                return ranges;
            }
        };

        this.commentControllers.set(this.activeSession.id, commentController);

        // Setup status bar indicator
        this.updateStatusBar();
    }

    /**
     * Cleanup collaboration UI elements
     */
    private cleanupCollaborationUI(): void {
        // Dispose comment controllers
        for (const controller of this.commentControllers.values()) {
            controller.dispose();
        }
        this.commentControllers.clear();

        // Clear decorations
        for (const decoration of this.cursorDecorations.values()) {
            decoration.dispose();
        }
        this.cursorDecorations.clear();

        // Clear status bar
        this.clearStatusBar();
    }

    /**
     * Update cursor decorations for all participants
     */
    private updateCursorDecorations(activeEditor: vscode.TextEditor): void {
        if (!this.activeSession) {
            return;
        }

        // Clear existing decorations
        for (const decoration of this.cursorDecorations.values()) {
            decoration.dispose();
        }
        this.cursorDecorations.clear();

        // Create decorations for each participant
        for (const participant of this.activeSession.participants) {
            if (participant.id === this.getCurrentUserId()) {
                continue; // Skip current user
            }

            const cursorPos = this.activeSession.cursorPositions.get(participant.id);
            if (cursorPos && cursorPos.filePath === activeEditor.document.fileName) {
                const decoration = vscode.window.createTextEditorDecorationType({
                    backgroundColor: this.getUserColor(participant.id),
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: this.getUserColor(participant.id),
                    after: {
                        contentText: ` ${participant.name}`,
                        backgroundColor: this.getUserColor(participant.id),
                        color: 'white',
                        margin: '0 0 0 4px',
                        padding: '0 4px',
                        borderRadius: '2px'
                    }
                });

                const range = new vscode.Range(
                    cursorPos.line, cursorPos.column,
                    cursorPos.line, cursorPos.column
                );

                activeEditor.setDecorations(decoration, [range]);
                this.cursorDecorations.set(participant.id, decoration);
            }
        }
    }

    /**
     * Update comment decorations
     */
    private updateCommentDecorations(filePath: string): void {
        if (!this.activeSession) {
            return;
        }

        const editor = vscode.window.visibleTextEditors.find((e: vscode.TextEditor) => e.document.fileName === filePath);
        if (!editor) {
            return;
        }

        // Clear existing comment decorations
        for (const decoration of this.commentDecorations.values()) {
            decoration.dispose();
        }
        this.commentDecorations.clear();

        // Create decorations for comments in current file
        const fileComments = this.activeSession.activeComments.filter(c => c.filePath === filePath);

        for (const comment of fileComments) {
            const decoration = vscode.window.createTextEditorDecorationType({
                backgroundColor: 'rgba(255, 255, 0, 0.1)',
                borderWidth: '1px',
                borderStyle: 'dashed',
                borderColor: 'orange',
                overviewRulerColor: 'orange',
                overviewRulerLane: vscode.OverviewRulerLane.Right
            });

            editor.setDecorations(decoration, [comment.lineRange]);
            this.commentDecorations.set(comment.id, decoration);
        }
    }

    /**
     * Handle WebSocket messages
     */
    private handleWebSocketMessage(message: any): void {
        switch (message.type) {
            case 'cursor_update':
                this.handleRemoteCursorUpdate(message.data);
                break;
            case 'file_change':
                this.handleRemoteFileChange(message.data);
                break;
            case 'comment_added':
                this.handleRemoteComment(message.data);
                break;
            case 'participant_joined':
                this.handleParticipantJoined(message.data);
                break;
            case 'participant_left':
                this.handleParticipantLeft(message.data);
                break;
        }
    }

    /**
     * Send WebSocket message
     */
    private sendWebSocketMessage(type: string, data: any): void {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send(JSON.stringify({
                type,
                data,
                sessionId: this.activeSession?.id,
                timestamp: Date.now()
            }));
        }
    }

    /**
     * Start heartbeat for session management
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.activeSession) {
                this.sendWebSocketMessage('heartbeat', {
                    userId: this.getCurrentUserId(),
                    timestamp: Date.now()
                });
            }
        }, 30000); // 30 seconds
    }

    /**
     * Stop heartbeat
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = undefined;
        }
    }

    /**
     * Update status bar with collaboration info
     */
    private updateStatusBar(): void {
        if (!this.activeSession) {
            return;
        }

        const onlineParticipants = this.activeSession.participants.filter(p => p.status === 'online').length;

        // Create status bar item if it doesn't exist
        if (!this.statusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
            this.statusBarItem.command = 'theNewFuse.showCollaborationPanel';
        }

        this.statusBarItem.text = `🤝 ${onlineParticipants} collaborator${onlineParticipants !== 1 ? 's' : ''}`;
        this.statusBarItem.tooltip = `Collaboration: ${this.activeSession.name}\nClick to manage session`;
        this.statusBarItem.show();
    }

    /**
     * Clear status bar
     */
    private clearStatusBar(): void {
        if (this.statusBarItem) {
            this.statusBarItem.hide();
        }
    }

    /**
     * Helper methods
     */
    private async getCurrentUserInfo(): Promise<Partial<Collaborator>> {
        const config = vscode.workspace.getConfiguration('theNewFuse');
        return {
            name: config.get('userName') || 'Anonymous',
            email: config.get('userEmail') || 'anonymous@example.com'
        };
    }

    private getCurrentUserId(): string {
        // Generate consistent user ID based on configuration
        const config = vscode.workspace.getConfiguration('theNewFuse');
        const email = config.get('userEmail') || 'anonymous@example.com';
        return `user-${btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`;
    }

    private getParticipantName(userId: string): string {
        if (!this.activeSession) {
            return 'Unknown';
        }

        const participant = this.activeSession.participants.find(p => p.id === userId);
        return participant?.name || 'Unknown';
    }

    private getUserColor(userId: string): string {
        const colors = [
            'rgba(255, 0, 0, 0.3)',
            'rgba(0, 255, 0, 0.3)',
            'rgba(0, 0, 255, 0.3)',
            'rgba(255, 255, 0, 0.3)',
            'rgba(255, 0, 255, 0.3)',
            'rgba(0, 255, 255, 0.3)'
        ];

        const hash = userId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);

        return colors[Math.abs(hash) % colors.length];
    }

    private getDefaultPermissions(role: 'editor' | 'viewer'): CollaborationPermission[] {
        const basePermissions: CollaborationPermission[] = [
            { type: 'comment', scope: 'all', granted: true }
        ];

        if (role === 'editor') {
            basePermissions.push(
                { type: 'edit', scope: 'all', granted: true },
                { type: 'invite', scope: 'all', granted: true }
            );
        }

        return basePermissions;
    }

    private async getWebSocketUrl(): Promise<string> {
        const config = this.configManager.getApiUrl();
        const baseUrl = config.replace('/api', '');
        return `${baseUrl.replace('http', 'ws')}/collaboration/ws`;
    }

    private handleRemoteCursorUpdate(data: CursorPosition): void {
        if (!this.activeSession) {
            return;
        }

        this.activeSession.cursorPositions.set(data.userId, data);

        // Update decorations if file is open
        const editor = vscode.window.visibleTextEditors.find((e: vscode.TextEditor) => e.document.fileName === data.filePath);
        if (editor) {
            this.updateCursorDecorations(editor);
        }
    }

    private handleRemoteFileChange(data: any): void {
        // Handle remote file changes
        vscode.window.showInformationMessage(`File ${data.filePath} was modified by another participant`);
    }

    private handleRemoteComment(data: CodeComment): void {
        if (!this.activeSession) {
            return;
        }

        this.activeSession.activeComments.push(data);
        this.updateCommentDecorations(data.filePath);
    }

    private handleParticipantJoined(data: Collaborator): void {
        if (!this.activeSession) {
            return;
        }

        this.activeSession.participants.push(data);
        this.updateStatusBar();

        vscode.window.showInformationMessage(`${data.name} joined the collaboration session`);
    }

    private handleParticipantLeft(data: { userId: string }): void {
        if (!this.activeSession) {
            return;
        }

        const participant = this.activeSession.participants.find(p => p.id === data.userId);
        if (participant) {
            this.activeSession.participants = this.activeSession.participants.filter(p => p.id !== data.userId);
            this.updateStatusBar();

            vscode.window.showInformationMessage(`${participant.name} left the collaboration session`);
        }
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.cleanupCollaborationUI();
        this.stopHeartbeat();

        if (this.wsConnection) {
            this.wsConnection.close();
        }
    }
}