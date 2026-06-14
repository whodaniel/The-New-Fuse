"use strict";
/**
 * Interactive Agent Implementation
 * An agent designed for interactive, conversational workflows with users
 * Supports multi-turn dialogues, context retention, and dynamic responses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractiveAgent = void 0;
class InteractiveAgent {
    constructor(config) {
        this.type = 'interactive';
        this.capabilities = [
            'conversation',
            'context_retention',
            'sentiment_analysis',
            'intent_detection',
            'dynamic_responses',
            'action_suggestions',
        ];
        this.memory = new Map();
        this.state = {};
        this.isInitialized = false;
        this.sessions = new Map();
        this.id = config.agentId;
        this.name = config.name;
        this.config = {
            personality: 'helpful and friendly assistant',
            welcomeMessage: 'Hello! How can I help you today?',
            maxContextLength: 50,
            responseTimeout: 30000,
            ...config,
        };
    }
    async initialize() {
        console.log(`[InteractiveAgent:${this.id}] Initializing...`);
        this.state = {
            status: 'ready',
            personality: this.config.personality,
            lastActive: new Date().toISOString(),
            totalSessions: 0,
            totalMessages: 0,
        };
        this.isInitialized = true;
        console.log(`[InteractiveAgent:${this.id}] Ready`);
    }
    async process(message) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        const { action, payload } = message;
        switch (action) {
            case 'start_session':
                return this.startSession(payload.userId);
            case 'chat':
                return this.chat(payload.sessionId, payload.content);
            case 'end_session':
                return this.endSession(payload.sessionId);
            case 'get_session':
                return this.getSession(payload.sessionId);
            case 'set_context':
                return this.setSessionContext(payload.sessionId, payload.context);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    async learn(data) {
        const patterns = (await this.retrieveFromMemory('interaction_patterns')) || [];
        await this.saveToMemory('interaction_patterns', [...patterns, data]);
    }
    async saveToMemory(key, value) {
        this.memory.set(key, value);
    }
    async retrieveFromMemory(key) {
        return this.memory.get(key);
    }
    async getState() {
        return {
            ...this.state,
            isInitialized: this.isInitialized,
            activeSessions: Array.from(this.sessions.values()).filter((s) => s.status === 'active')
                .length,
        };
    }
    async setState(state) {
        this.state = { ...this.state, ...state };
    }
    async sendMessage(message) {
        console.log(`[InteractiveAgent:${this.id}] Sending:`, message);
    }
    async receiveMessage(message) {
        console.log(`[InteractiveAgent:${this.id}] Received:`, message);
        await this.process(message);
    }
    async handleError(error) {
        console.error(`[InteractiveAgent:${this.id}] Error:`, error.message);
        this.state = { ...this.state, lastError: error.message, status: 'error' };
    }
    // Interactive-specific methods
    async startSession(userId) {
        const sessionId = `session-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`;
        const welcomeMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: this.config.welcomeMessage || 'Hello!',
            timestamp: new Date(),
        };
        const session = {
            sessionId,
            userId,
            messages: [welcomeMessage],
            context: {},
            startTime: new Date(),
            lastActivity: new Date(),
            status: 'active',
        };
        this.sessions.set(sessionId, session);
        this.state = {
            ...this.state,
            totalSessions: (this.state.totalSessions || 0) + 1,
            lastActive: new Date().toISOString(),
        };
        console.log(`[InteractiveAgent:${this.id}] Started session: ${sessionId}`);
        return session;
    }
    async chat(sessionId, content) {
        const session = this.sessions.get(sessionId);
        if (!session || session.status !== 'active') {
            throw new Error(`Invalid or inactive session: ${sessionId}`);
        }
        // Add user message
        const userMessage = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content,
            timestamp: new Date(),
            metadata: {
                sentiment: this.analyzeSentiment(content),
                intent: this.detectIntent(content),
                entities: this.extractEntities(content),
            },
        };
        session.messages.push(userMessage);
        // Generate response
        const response = await this.generateResponse(session, userMessage);
        // Add assistant message
        session.messages.push(response.message);
        session.lastActivity = new Date();
        // Trim context if needed
        if (session.messages.length > (this.config.maxContextLength || 50)) {
            const systemMessages = session.messages.filter((m) => m.role === 'system');
            const recentMessages = session.messages.slice(-(this.config.maxContextLength || 50));
            session.messages = [...systemMessages, ...recentMessages];
        }
        this.state = {
            ...this.state,
            totalMessages: (this.state.totalMessages || 0) + 2,
            lastActive: new Date().toISOString(),
        };
        return response;
    }
    async generateResponse(session, userMessage) {
        // In production, this would call an LLM
        const intent = userMessage.metadata?.intent || 'general';
        let responseContent;
        let suggestions = [];
        let actions = [];
        switch (intent) {
            case 'greeting':
                responseContent = "Hello! It's great to hear from you. How can I assist you today?";
                suggestions = [
                    'Tell me about your features',
                    'I need help with a task',
                    'Show me examples',
                ];
                break;
            case 'help':
                responseContent =
                    "I'm here to help! I can assist you with conversations, answer questions, and guide you through various tasks.";
                actions = [
                    { type: 'button', label: 'View Features', value: 'features' },
                    { type: 'button', label: 'Get Started', value: 'start' },
                ];
                break;
            case 'farewell':
                responseContent = 'Goodbye! Feel free to come back anytime you need assistance. Take care!';
                break;
            case 'question':
                responseContent = `That's a great question! Let me think about "${userMessage.content.substring(0, 50)}..."`;
                break;
            default:
                responseContent = `I understand you're saying: "${userMessage.content.substring(0, 100)}". How would you like me to help with this?`;
                suggestions = ['Tell me more', 'Take action', 'Explain further'];
        }
        const assistantMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: responseContent,
            timestamp: new Date(),
        };
        return {
            message: assistantMessage,
            suggestions,
            actions,
            shouldContinue: intent !== 'farewell',
        };
    }
    analyzeSentiment(content) {
        const positive = ['good', 'great', 'awesome', 'love', 'thanks', 'thank', 'happy', 'excellent'];
        const negative = ['bad', 'hate', 'terrible', 'awful', 'angry', 'frustrated', 'disappointed'];
        const lowerContent = content.toLowerCase();
        if (positive.some((word) => lowerContent.includes(word)))
            return 'positive';
        if (negative.some((word) => lowerContent.includes(word)))
            return 'negative';
        return 'neutral';
    }
    detectIntent(content) {
        const lowerContent = content.toLowerCase();
        if (/^(hi|hello|hey|greetings)/i.test(lowerContent))
            return 'greeting';
        if (/^(bye|goodbye|see you|farewell)/i.test(lowerContent))
            return 'farewell';
        if (/help|assist|support|how (do|can|to)/i.test(lowerContent))
            return 'help';
        if (/\?$/.test(content))
            return 'question';
        return 'general';
    }
    extractEntities(content) {
        // Simple entity extraction - in production, use NLP
        const entities = [];
        // Extract quoted strings
        const quoted = content.match(/"([^"]+)"/g);
        if (quoted)
            entities.push(...quoted.map((q) => q.replace(/"/g, '')));
        // Extract capitalized words (potential proper nouns)
        const words = content.split(/\s+/);
        words.forEach((word) => {
            if (word.length > 2 &&
                word[0] === word[0].toUpperCase() &&
                word[0] !== word[0].toLowerCase()) {
                entities.push(word);
            }
        });
        return [...new Set(entities)];
    }
    async endSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.status = 'ended';
            console.log(`[InteractiveAgent:${this.id}] Ended session: ${sessionId}`);
            return session;
        }
        return null;
    }
    async getSession(sessionId) {
        return this.sessions.get(sessionId) || null;
    }
    async setSessionContext(sessionId, context) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.context = { ...session.context, ...context };
            return true;
        }
        return false;
    }
}
exports.InteractiveAgent = InteractiveAgent;
exports.default = InteractiveAgent;
//# sourceMappingURL=interactive_agent.js.map