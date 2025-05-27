import * as vscode from 'vscode';
import { getLogger, Logger } from '../src/core/logging.js';
import { ConnectionStatus } from '../types/shared.js';
import { EventEmitter } from 'events';

/**
 * Unified Agent System that consolidates functionality from:
 * - agent-communication.ts/tsx
 * - agent-communication-simple.ts/tsx
 * - ai-collaboration.ts/tsx
 * - ai-collaboration-simple.ts/tsx
 */
export class UnifiedAgentSystem {
    private logger: Logger;
    private disposables: vscode.Disposable[] = [];
    private agents: Map<string, AgentInfo> = new Map();
    private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
    private statusBarItem: vscode.StatusBarItem;
    private eventEmitter: EventEmitter = new EventEmitter();
    private activeSessions: Map<string, AgentSession> = new Map();
    
    constructor() {
        this.logger = Logger.getInstance();
        
        // Create status bar item for agent communication
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.text = '$(plug) Agents: Disconnected';
        this.statusBarItem.tooltip = 'Agent Communication Status';
        this.statusBarItem.show();
        
        // Register commands
        this.registerCommands();
        
        // Initialize agent discovery
        this.discoverAgents();
    }
    
    /**
     * Register agent system commands
     */
    private registerCommands() {
        // Connect to agent command
        this.disposables.push(vscode.commands.registerCommand('thefuse.connectToAgent', async () => {
            // Show quick pick of available agents
            const availableAgents = Array.from(this.agents.values());
            
            if (availableAgents.length === 0) {
                vscode.window.showInformationMessage('No agents discovered. Scanning...');
                await this.discoverAgents();
                return;
            }
            
            const selectedAgent = await vscode.window.showQuickPick(
                availableAgents.map(agent => ({
                    label: agent.name,
                    description: agent.description || '',
                    detail: `Type: ${agent.type}, Status: ${agent.status}`,
                    agent: agent
                })),
                { placeHolder: 'Select an agent to connect to' }
            );
            
            if (!selectedAgent) {
                return;
            }
            
            // Connect to the selected agent
            this.connectToAgent(selectedAgent.agent.id);
        }));
        
        // Disconnect from agent command
        this.disposables.push(vscode.commands.registerCommand('thefuse.disconnectFromAgent', async () => {
            // Show quick pick of connected agents
            const connectedAgents = Array.from(this.agents.values())
                .filter(agent => agent.status === ConnectionStatus.CONNECTED);
            
            if (connectedAgents.length === 0) {
                vscode.window.showInformationMessage('No connected agents');
                return;
            }
            
            const selectedAgent = await vscode.window.showQuickPick(
                connectedAgents.map(agent => ({
                    label: agent.name,
                    description: agent.description || '',
                    detail: `Type: ${agent.type}`,
                    agent: agent
                })),
                { placeHolder: 'Select an agent to disconnect from' }
            );
            
            if (!selectedAgent) {
                return;
            }
            
            // Disconnect from the selected agent
            this.disconnectFromAgent(selectedAgent.agent.id);
        }));
        
        // Discover agents command
        this.disposables.push(vscode.commands.registerCommand('thefuse.discoverAgents', async () => {
            vscode.window.showInformationMessage('Scanning for agents...');
            await this.discoverAgents();
            
            const agentCount = this.agents.size;
            vscode.window.showInformationMessage(`Found ${agentCount} agent${agentCount !== 1 ? 's' : ''}`);
        }));
        
        // Start agent collaboration session command
        this.disposables.push(vscode.commands.registerCommand('thefuse.startCollaboration', async () => {
            // Show quick pick of available agents
            const availableAgents = Array.from(this.agents.values())
                .filter(agent => agent.status === ConnectionStatus.CONNECTED);
            
            if (availableAgents.length === 0) {
                vscode.window.showInformationMessage('No connected agents available. Connect to an agent first.');
                return;
            }
            
            const selectedAgent = await vscode.window.showQuickPick(
                availableAgents.map(agent => ({
                    label: agent.name,
                    description: agent.description || '',
                    detail: `Type: ${agent.type}`,
                    agent: agent
                })),
                { placeHolder: 'Select an agent to collaborate with' }
            );
            
            if (!selectedAgent) {
                return;
            }
            
            // Get collaboration topic
            const topic = await vscode.window.showInputBox({
                prompt: 'Enter a topic or task for collaboration',
                placeHolder: 'e.g., "Refactor authentication system" or "Design new API endpoints"'
            });
            
            if (!topic) {
                return;
            }
            
            // Start collaboration session
            this.startCollaborationSession(selectedAgent.agent.id, topic);
        }));
        
        // End agent collaboration session command
        this.disposables.push(vscode.commands.registerCommand('thefuse.endCollaboration', async () => {
            // Show quick pick of active sessions
            const activeSessions = Array.from(this.activeSessions.values());
            
            if (activeSessions.length === 0) {
                vscode.window.showInformationMessage('No active collaboration sessions');
                return;
            }
            
            const selectedSession = await vscode.window.showQuickPick(
                activeSessions.map(session => ({
                    label: session.topic,
                    description: `Agent: ${session.agentName}`,
                    detail: `Started: ${session.startTime.toLocaleTimeString()}`,
                    session: session
                })),
                { placeHolder: 'Select a collaboration session to end' }
            );
            
            if (!selectedSession) {
                return;
            }
            
            // End the selected session
            this.endCollaborationSession(selectedSession.session.id);
        }));
        
        // Send message to agent command
        this.disposables.push(vscode.commands.registerCommand('thefuse.sendMessageToAgent', async () => {
            // Show quick pick of connected agents
            const connectedAgents = Array.from(this.agents.values())
                .filter(agent => agent.status === ConnectionStatus.CONNECTED);
            
            if (connectedAgents.length === 0) {
                vscode.window.showInformationMessage('No connected agents. Connect to an agent first.');
                return;
            }
            
            const selectedAgent = await vscode.window.showQuickPick(
                connectedAgents.map(agent => ({
                    label: agent.name,
                    description: agent.description || '',
                    detail: `Type: ${agent.type}`,
                    agent: agent
                })),
                { placeHolder: 'Select an agent to send a message to' }
            );
            
            if (!selectedAgent) {
                return;
            }
            
            // Get message
            const message = await vscode.window.showInputBox({
                prompt: `Enter a message to send to ${selectedAgent.agent.name}`,
                placeHolder: 'Your message...'
            });
            
            if (!message) {
                return;
            }
            
            // Send message to the selected agent
            this.sendMessageToAgent(selectedAgent.agent.id, message);
        }));
        
        // Toggle agent auto-detection command
        this.disposables.push(vscode.commands.registerCommand('thefuse.toggleAgentAutoDetection', async () => {
            // Toggle auto-detection setting
            const config = vscode.workspace.getConfiguration('thefuse');
            const currentSetting = config.get('agentAutoDetection', true);
            
            await config.update('agentAutoDetection', !currentSetting, true);
            
            vscode.window.showInformationMessage(`Agent auto-detection is now ${!currentSetting ? 'enabled' : 'disabled'}`);
            
            if (!currentSetting) {
                // If we just enabled it, run discovery
                this.discoverAgents();
            }
        }));
    }
    
    /**
     * Discover available agents
     */
    private async discoverAgents() {
        try {
            this.updateStatusBarItem('$(sync~spin) Agents: Scanning...');
            
            // Check if auto-detection is enabled
            const config = vscode.workspace.getConfiguration('thefuse');
            const autoDetectionEnabled = config.get('agentAutoDetection', true);
            
            if (!autoDetectionEnabled) {
                this.updateStatusBarItem('$(plug) Agents: Auto-detection disabled');
                return;
            }
            
            // Simulate agent discovery
            // In a real implementation, this would involve network scanning, service discovery, etc.
            const discoveredAgents: AgentInfo[] = [
                {
                    id: 'agent-1',
                    name: 'Code Assistant',
                    type: 'AI Assistant',
                    description: 'AI-powered coding assistant',
                    capabilities: ['code-generation', 'code-review', 'refactoring'],
                    status: ConnectionStatus.DISCONNECTED
                },
                {
                    id: 'agent-2',
                    name: 'Documentation Bot',
                    type: 'Documentation',
                    description: 'Generates and updates documentation',
                    capabilities: ['doc-generation', 'api-docs', 'comment-analysis'],
                    status: ConnectionStatus.DISCONNECTED
                },
                {
                    id: 'agent-3',
                    name: 'Testing Assistant',
                    type: 'Testing',
                    description: 'Helps with test creation and execution',
                    capabilities: ['test-generation', 'test-execution', 'coverage-analysis'],
                    status: ConnectionStatus.DISCONNECTED
                }
            ];
            
            // Update agent registry
            discoveredAgents.forEach(agent => {
                // If we already know about this agent, preserve its status
                if (this.agents.has(agent.id)) {
                    agent.status = this.agents.get(agent.id)!.status;
                }
                this.agents.set(agent.id, agent);
            });
            
            // Update status bar
            this.updateConnectionStatus();
            
            // Emit agent discovery event
            this.eventEmitter.emit('agentsDiscovered', discoveredAgents);
            
            return discoveredAgents;
        } catch (error) {
            this.logger.error('Error discovering agents:', error);
            this.updateStatusBarItem('$(error) Agents: Discovery error');
            throw error;
        }
    }
    
    /**
     * Connect to a specific agent
     */
    public async connectToAgent(agentId: string): Promise<boolean> {
        try {
            const agent = this.agents.get(agentId);
            
            if (!agent) {
                throw new Error(`Agent with ID ${agentId} not found`);
            }
            
            this.updateStatusBarItem(`$(sync~spin) Connecting to ${agent.name}...`);
            
            // Simulate connection process
            // In a real implementation, this would involve establishing a connection to the agent
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update agent status
            agent.status = ConnectionStatus.CONNECTED;
            this.agents.set(agentId, agent);
            
            // Update connection status
            this.updateConnectionStatus();
            
            vscode.window.showInformationMessage(`Connected to ${agent.name}`);
            
            // Emit agent connected event
            this.eventEmitter.emit('agentConnected', agent);
            
            return true;
        } catch (error) {
            this.logger.error(`Error connecting to agent ${agentId}:`, error);
            this.updateStatusBarItem('$(error) Agents: Connection error');
            
            vscode.window.showErrorMessage(`Failed to connect to agent: ${error.message}`);
            
            return false;
        }
    }
    
    /**
     * Disconnect from a specific agent
     */
    public async disconnectFromAgent(agentId: string): Promise<boolean> {
        try {
            const agent = this.agents.get(agentId);
            
            if (!agent) {
                throw new Error(`Agent with ID ${agentId} not found`);
            }
            
            if (agent.status !== ConnectionStatus.CONNECTED) {
                throw new Error(`Agent ${agent.name} is not connected`);
            }
            
            this.updateStatusBarItem(`$(sync~spin) Disconnecting from ${agent.name}...`);
            
            // End any active sessions with this agent
            for (const [sessionId, session] of this.activeSessions.entries()) {
                if (session.agentId === agentId) {
                    this.endCollaborationSession(sessionId);
                }
            }
            
            // Simulate disconnection process
            // In a real implementation, this would involve closing the connection to the agent
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Update agent status
            agent.status = ConnectionStatus.DISCONNECTED;
            this.agents.set(agentId, agent);
            
            // Update connection status
            this.updateConnectionStatus();
            
            vscode.window.showInformationMessage(`Disconnected from ${agent.name}`);
            
            // Emit agent disconnected event
            this.eventEmitter.emit('agentDisconnected', agent);
            
            return true;
        } catch (error) {
            this.logger.error(`Error disconnecting from agent ${agentId}:`, error);
            this.updateStatusBarItem('$(error) Agents: Disconnection error');
            
            vscode.window.showErrorMessage(`Failed to disconnect from agent: ${error.message}`);
            
            return false;
        }
    }
    
    /**
     * Start a collaboration session with an agent
     */
    public async startCollaborationSession(agentId: string, topic: string): Promise<string | null> {
        try {
            const agent = this.agents.get(agentId);
            
            if (!agent) {
                throw new Error(`Agent with ID ${agentId} not found`);
            }
            
            if (agent.status !== ConnectionStatus.CONNECTED) {
                throw new Error(`Agent ${agent.name} is not connected`);
            }
            
            // Create a new session
            const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const session: AgentSession = {
                id: sessionId,
                agentId,
                agentName: agent.name,
                topic,
                startTime: new Date(),
                messages: []
            };
            
            // Register the session
            this.activeSessions.set(sessionId, session);
            
            // Create a webview panel for the session
            const panel = vscode.window.createWebviewPanel(
                'collaborationSession',
                `Collaboration: ${topic}`,
                vscode.ViewColumn.One,
                { enableScripts: true, retainContextWhenHidden: true }
            );
            
            // Initialize the webview content
            panel.webview.html = this.getCollaborationHtml(panel.webview, session);
            
            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(async message => {
                if (message.command === 'sendMessage') {
                    await this.sendMessageToAgent(agentId, message.text, sessionId);
                    
                    // Update the webview with the new message
                    panel.webview.html = this.getCollaborationHtml(panel.webview, this.activeSessions.get(sessionId)!);
                }
            });
            
            // When the panel is disposed, end the session
            panel.onDidDispose(() => {
                this.endCollaborationSession(sessionId);
            });
            
            // Send a welcome message from the agent
            await this.simulateAgentMessage(
                agentId,
                `Hello! I'm ${agent.name}. Let's collaborate on: ${topic}. How can I help you?`,
                sessionId
            );
            
            // Update the webview with the welcome message
            panel.webview.html = this.getCollaborationHtml(panel.webview, this.activeSessions.get(sessionId)!);
            
            // Emit session started event
            this.eventEmitter.emit('sessionStarted', session);
            
            return sessionId;
        } catch (error) {
            this.logger.error(`Error starting collaboration session with agent ${agentId}:`, error);
            
            vscode.window.showErrorMessage(`Failed to start collaboration session: ${error.message}`);
            
            return null;
        }
    }
    
    /**
     * End a collaboration session
     */
    public async endCollaborationSession(sessionId: string): Promise<boolean> {
        try {
            const session = this.activeSessions.get(sessionId);
            
            if (!session) {
                return false;
            }
            
            // Remove the session
            this.activeSessions.delete(sessionId);
            
            // Emit session ended event
            this.eventEmitter.emit('sessionEnded', session);
            
            vscode.window.showInformationMessage(`Collaboration session "${session.topic}" has ended`);
            
            return true;
        } catch (error) {
            this.logger.error(`Error ending collaboration session ${sessionId}:`, error);
            
            vscode.window.showErrorMessage(`Failed to end collaboration session: ${error.message}`);
            
            return false;
        }
    }
    
    /**
     * Send a message to an agent
     */
    public async sendMessageToAgent(agentId: string, message: string, sessionId?: string): Promise<boolean> {
        try {
            const agent = this.agents.get(agentId);
            
            if (!agent) {
                throw new Error(`Agent with ID ${agentId} not found`);
            }
            
            if (agent.status !== ConnectionStatus.CONNECTED) {
                throw new Error(`Agent ${agent.name} is not connected`);
            }
            
            // If session ID is provided, add the message to the session
            if (sessionId) {
                const session = this.activeSessions.get(sessionId);
                
                if (!session) {
                    throw new Error(`Session with ID ${sessionId} not found`);
                }
                
                // Add user message to session
                session.messages.push({
                    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    sender: 'user',
                    content: message,
                    timestamp: new Date()
                });
                
                // Update session
                this.activeSessions.set(sessionId, session);
                
                // Emit message sent event
                this.eventEmitter.emit('messageSent', {
                    agentId,
                    message,
                    sessionId
                });
                
                // Simulate agent response
                await this.simulateAgentResponse(agentId, message, sessionId);
                
                return true;
            } else {
                // Direct message (not in a session)
                // Emit message sent event
                this.eventEmitter.emit('messageSent', {
                    agentId,
                    message
                });
                
                // Show the message in a notification
                vscode.window.showInformationMessage(`Message sent to ${agent.name}: ${message}`);
                
                // Simulate agent response as a notification
                await new Promise(resolve => setTimeout(resolve, 1500));
                vscode.window.showInformationMessage(`${agent.name} responded: I received your message: "${message}"`);
                
                return true;
            }
        } catch (error) {
            this.logger.error(`Error sending message to agent ${agentId}:`, error);
            
            vscode.window.showErrorMessage(`Failed to send message to agent: ${error.message}`);
            
            return false;
        }
    }
    
    /**
     * Simulate an agent message (for demo purposes)
     */
    private async simulateAgentMessage(agentId: string, message: string, sessionId: string): Promise<void> {
        const session = this.activeSessions.get(sessionId);
        
        if (!session) {
            return;
        }
        
        // Add agent message to session
        session.messages.push({
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sender: 'agent',
            content: message,
            timestamp: new Date()
        });
        
        // Update session
        this.activeSessions.set(sessionId, session);
        
        // Emit message received event
        this.eventEmitter.emit('messageReceived', {
            agentId,
            message,
            sessionId
        });
    }
    
    /**
     * Simulate an agent response to a user message
     */
    private async simulateAgentResponse(agentId: string, userMessage: string, sessionId: string): Promise<void> {
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const agent = this.agents.get(agentId);
        
        if (!agent) {
            return;
        }
        
        let response = '';
        
        // Generate a contextual response based on agent type and user message
        if (agent.type === 'AI Assistant') {
            if (userMessage.toLowerCase().includes('help')) {
                response = "I'd be happy to help! Please let me know what you need assistance with.";
            } else if (userMessage.toLowerCase().includes('code') || userMessage.toLowerCase().includes('function')) {
                response = "I can help with your code. Would you like me to review it, suggest improvements, or help you implement a new feature?";
            } else {
                response = `I'm your AI coding assistant. I can help you with programming tasks, code reviews, and more. What specific coding task are you working on?`;
            }
        } else if (agent.type === 'Documentation') {
            if (userMessage.toLowerCase().includes('documentation') || userMessage.toLowerCase().includes('docs')) {
                response = "I can help generate documentation for your code. Do you need API docs, user guides, or inline code comments?";
            } else if (userMessage.toLowerCase().includes('example')) {
                response = "I can provide documentation examples. Would you like to see examples for functions, classes, or API endpoints?";
            } else {
                response = "I'm specialized in documentation. I can help document your code, generate API references, or create user guides. What kind of documentation do you need?";
            }
        } else if (agent.type === 'Testing') {
            if (userMessage.toLowerCase().includes('test')) {
                response = "I can help with your tests. Do you need unit tests, integration tests, or help with test strategy?";
            } else if (userMessage.toLowerCase().includes('coverage')) {
                response = "Test coverage is important! I can help analyze your current coverage and suggest areas that need more testing.";
            } else {
                response = "I'm your testing assistant. I can help you create tests, improve test coverage, and develop testing strategies. What testing challenge are you facing?";
            }
        } else {
            response = `Thank you for your message: "${userMessage}". How can I assist you further?`;
        }
        
        // Send the response
        await this.simulateAgentMessage(agentId, response, sessionId);
    }
    
    /**
     * Get HTML for the collaboration webview
     */
    private getCollaborationHtml(webview: vscode.Webview, session: AgentSession): string {
        const cspSource = webview.cspSource;
        
        const messagesHtml = session.messages.map(message => {
            const isAgent = message.sender === 'agent';
            const messageClass = isAgent ? 'agent-message' : 'user-message';
            const alignClass = isAgent ? 'message-left' : 'message-right';
            
            return `
            <div class="message ${alignClass}">
                <div class="message-content ${messageClass}">
                    <div class="message-sender">${isAgent ? session.agentName : 'You'}</div>
                    <div class="message-text">${this.escapeHtml(message.content)}</div>
                    <div class="message-time">${message.timestamp.toLocaleTimeString()}</div>
                </div>
            </div>`;
        }).join('');
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src ${cspSource};">
            <title>Collaboration Session</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-editor-foreground);
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }
                .header {
                    padding: 10px 15px;
                    background-color: var(--vscode-editor-background);
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                .session-title {
                    font-size: 1.2em;
                    margin: 0;
                }
                .session-agent {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                    margin-top: 5px;
                }
                .messages-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 15px;
                }
                .message {
                    margin-bottom: 15px;
                    display: flex;
                    flex-direction: column;
                }
                .message-right {
                    align-items: flex-end;
                }
                .message-left {
                    align-items: flex-start;
                }
                .message-content {
                    max-width: 80%;
                    padding: 10px 15px;
                    border-radius: 8px;
                }
                .user-message {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                .agent-message {
                    background-color: var(--vscode-editor-background);
                }
                .message-sender {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .message-text {
                    white-space: pre-wrap;
                    margin-bottom: 5px;
                }
                .message-time {
                    font-size: 0.8em;
                    opacity: 0.7;
                    text-align: right;
                }
                .input-container {
                    padding: 15px;
                    background-color: var(--vscode-editor-background);
                    border-top: 1px solid var(--vscode-panel-border);
                    display: flex;
                }
                .message-input {
                    flex: 1;
                    padding: 8px 12px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    margin-right: 10px;
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                }
                .send-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .send-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2 class="session-title">${this.escapeHtml(session.topic)}</h2>
                <div class="session-agent">Collaboration with ${this.escapeHtml(session.agentName)}</div>
            </div>
            
            <div class="messages-container" id="messagesContainer">
                ${messagesHtml}
            </div>
            
            <div class="input-container">
                <input type="text" class="message-input" id="messageInput" placeholder="Type a message..." />
                <button class="send-button" id="sendButton">Send</button>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                const messagesContainer = document.getElementById('messagesContainer');
                const messageInput = document.getElementById('messageInput');
                const sendButton = document.getElementById('sendButton');
                
                // Scroll to the bottom of the messages
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                // Send message on button click
                sendButton.addEventListener('click', sendMessage);
                
                // Send message on Enter key press
                messageInput.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        sendMessage();
                    }
                });
                
                function sendMessage() {
                    const text = messageInput.value.trim();
                    
                    if (text) {
                        vscode.postMessage({
                            command: 'sendMessage',
                            text: text
                        });
                        
                        // Clear the input
                        messageInput.value = '';
                    }
                }
            </script>
        </body>
        </html>`;
    }
    
    /**
     * Update status bar item text
     */
    private updateStatusBarItem(text: string) {
        this.statusBarItem.text = text;
    }
    
    /**
     * Update the connection status text based on connected agents
     */
    private updateConnectionStatus() {
        const connectedAgents = Array.from(this.agents.values())
            .filter(agent => agent.status === ConnectionStatus.CONNECTED);
        
        if (connectedAgents.length === 0) {
            this.connectionStatus = ConnectionStatus.DISCONNECTED;
            this.updateStatusBarItem('$(plug) Agents: Disconnected');
        } else {
            this.connectionStatus = ConnectionStatus.CONNECTED;
            this.updateStatusBarItem(`$(plug) Agents: ${connectedAgents.length} Connected`);
        }
    }
    
    /**
     * Add event listener for agent system events
     */
    public on(event: string, listener: (...args: any[]) => void): this {
        this.eventEmitter.on(event, listener);
        return this;
    }
    
    /**
     * Remove event listener
     */
    public off(event: string, listener: (...args: any[]) => void): this {
        this.eventEmitter.off(event, listener);
        return this;
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    private escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    /**
     * Dispose of resources
     */
    public dispose() {
        this.disposables.forEach(d => d.dispose());
        this.statusBarItem.dispose();
        
        // End all active sessions
        this.activeSessions.forEach((session, sessionId) => {
            this.endCollaborationSession(sessionId);
        });
    }
}

/**
 * Information about an agent
 */
export interface AgentInfo {
    id: string;
    name: string;
    type: string;
    description?: string;
    capabilities: string[];
    status: ConnectionStatus;
}

/**
 * Agent collaboration session
 */
export interface AgentSession {
    id: string;
    agentId: string;
    agentName: string;
    topic: string;
    startTime: Date;
    messages: SessionMessage[];
}

/**
 * Message in a collaboration session
 */
export interface SessionMessage {
    id: string;
    sender: 'user' | 'agent';
    content: string;
    timestamp: Date;
}

/**
 * Create and initialize the unified agent system
 */
export function createUnifiedAgentSystem(): UnifiedAgentSystem {
    return new UnifiedAgentSystem();
}