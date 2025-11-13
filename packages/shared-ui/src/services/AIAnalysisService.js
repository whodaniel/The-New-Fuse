"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAnalysisService = void 0;
const events_1 = require("events");
class AIAnalysisService extends events_1.EventEmitter {
    config;
    ws = null;
    isConnected = false;
    activeSessions = new Map();
    connectedAgents = new Map();
    analysisHistory = [];
    constructor(config) {
        super();
        this.config = {
            timeout: 30000,
            maxRetries: 3,
            ...config
        };
    }
    async connect() {
        try {
            await this.connectWebSocket();
            await this.registerPlatform();
            this.isConnected = true;
            this.emit('connected');
        }
        catch (error) {
            console.error('AI Analysis service connection failed:', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.emit('disconnected');
    }
    async startAnalysis(session, analysisTypes) {
        if (!this.isConnected) {
            throw new Error('AI Analysis service not connected');
        }
        try {
            // Update session with analysis types
            session.type = analysisTypes.join(',');
            session.status = 'active';
            // Store session
            this.activeSessions.set(session.id, session);
            // Send analysis request
            this.sendMessage({
                type: 'analysis-request',
                session: session,
                analysisTypes: analysisTypes,
                platform: this.config.platform,
                requestedAgents: this.getRecommendedAgents(analysisTypes)
            });
            this.emit('analysis-started', session);
        }
        catch (error) {
            console.error('Failed to start analysis:', error);
            session.status = 'error';
            this.emit('analysis-error', session);
            throw error;
        }
    }
    async stopAnalysis(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Analysis session ${sessionId} not found);
    }

    this.sendMessage({
      type: 'analysis-stop',
      sessionId: sessionId
    });

    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    this.activeSessions.delete(sessionId);
    this.emit('analysis-stopped', session);
  }

  async getAnalysisHistory(): Promise<AnalysisResult[]> {
    return [...this.analysisHistory].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getConnectedAgents(): Promise<ConnectedAgent[]> {
    return Array.from(this.connectedAgents.values());
  }

  async requestAgentConnection(agentType: string, capabilities: string[] = []): Promise<ConnectedAgent> {
    return new Promise((resolve, reject) => {
      const requestId = this.generateId();
      
      const timeout = setTimeout(() => {
        reject(new Error('Agent connection timeout'));
      }, 10000);

      const handleAgentConnected = (agent: ConnectedAgent) => {
        if (agent.type === agentType) {
          clearTimeout(timeout);
          this.off('agent-connected', handleAgentConnected);
          resolve(agent);
        }
      };

      this.on('agent-connected', handleAgentConnected);

      this.sendMessage({
        type: 'request-agent-connection',
        requestId: requestId,
        agentType: agentType,
        capabilities: capabilities,
        platform: this.config.platform
      });
    });
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.config.apiUrl.replace('http', 'ws') + '/ai-analysis';
      
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Connected to AI Analysis WebSocket');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onclose = () => {
          console.log('AI Analysis WebSocket closed');
          this.isConnected = false;
          this.emit('disconnected');
        };

        this.ws.onerror = (error) => {
          console.error('AI Analysis WebSocket error:', error);
          reject(error);
        };

        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  private async registerPlatform(): Promise<void> {
    this.sendMessage({
      type: 'platform-registration',
      platform: this.config.platform,
      capabilities: this.getPlatformCapabilities(),
      supportedAnalysisTypes: this.getSupportedAnalysisTypes(),
      timestamp: new Date().toISOString()
    });
  }

  private handleMessage(message: any): void {
    console.log('AI Analysis message received:', message.type);

    switch (message.type) {
      case 'registration-confirmed':
        this.handleRegistrationConfirmed(message);
        break;
      case 'agent-connected':
        this.handleAgentConnected(message.agent);
        break;
      case 'agent-disconnected':
        this.handleAgentDisconnected(message.agentId);
        break;
      case 'analysis-started':
        this.handleAnalysisStarted(message);
        break;
      case 'analysis-progress':
        this.handleAnalysisProgress(message);
        break;
      case 'analysis-completed':
        this.handleAnalysisCompleted(message);
        break;
      case 'analysis-error':
        this.handleAnalysisError(message);
        break;
      case 'analysis-result':
        this.handleAnalysisResult(message.result);
        break;
      default:
        console.log('Unknown AI Analysis message:', message.type);
    }
  }

  private handleRegistrationConfirmed(message: any): void {
    console.log('Platform registration confirmed:', message);
    this.emit('registration-confirmed', message);
  }

  private handleAgentConnected(agent: ConnectedAgent): void {
    agent.lastActivity = new Date().toISOString();
    this.connectedAgents.set(agent.id, agent);
    this.emit('agent-connected', agent);`, console.log(`AI Agent connected: ${agent.name}`($, { agent, : .type })));
        }
    }
    handleAgentDisconnected(agentId) {
        const agent = this.connectedAgents.get(agentId);
        if (agent) {
            agent.status = 'offline';
            this.connectedAgents.delete(agentId);
            this.emit('agent-disconnected', agent);
            `
      console.log(`;
            AI;
            Agent;
            disconnected: $;
            {
                agent.name;
            }
            `);
    }
  }

  private handleAnalysisStarted(message: any): void {
    const session = this.activeSessions.get(message.sessionId);
    if (session) {
      session.status = 'active';
      session.agents = message.assignedAgents || [];
      this.emit('analysis-started', session);
    }
  }

  private handleAnalysisProgress(message: any): void {
    const session = this.activeSessions.get(message.sessionId);
    if (session) {
      this.emit('analysis-progress', {
        session,
        progress: message.progress,
        currentTask: message.currentTask,
        estimatedTimeRemaining: message.estimatedTimeRemaining
      });
    }
  }

  private handleAnalysisCompleted(message: any): void {
    const session = this.activeSessions.get(message.sessionId);
    if (session) {
      session.status = 'completed';
      session.completedAt = new Date().toISOString();
      session.results = message.results;
      
      this.activeSessions.delete(message.sessionId);
      this.emit('analysis-completed', session);
    }
  }

  private handleAnalysisError(message: any): void {
    const session = this.activeSessions.get(message.sessionId);
    if (session) {
      session.status = 'error';
      this.emit('analysis-error', session, message.error);
    }
  }

  private handleAnalysisResult(result: AnalysisResult): void {
    this.analysisHistory.unshift(result);
    
    // Keep only last 100 results in memory
    if (this.analysisHistory.length > 100) {
      this.analysisHistory = this.analysisHistory.slice(0, 100);
    }

    this.emit('analysis-result', result);
  }

  private getPlatformCapabilities(): string[] {
    const base = ['ai-analysis', 'multi-agent'];
    
    switch (this.config.platform) {
      case 'web':
        return [...base, 'screenshot-capture', 'dom-analysis', 'performance-metrics'];
      case 'electron':
        return [...base, 'native-capture', 'file-system-access', 'cross-platform'];
      case 'vscode':
        return [...base, 'code-analysis', 'workspace-context', 'editor-integration'];
      case 'chrome':
        return [...base, 'tab-capture', 'page-analysis', 'browser-extension'];
      default:
        return base;
    }
  }

  private getSupportedAnalysisTypes(): string[] {
    const base = ['general-vision', 'ui-analysis'];
    
    switch (this.config.platform) {
      case 'web':
        return [...base, 'accessibility-audit', 'performance-analysis', 'text-extraction'];
      case 'electron':
        return [...base, 'accessibility-audit', 'security-scan', 'native-ui-analysis'];
      case 'vscode':
        return [...base, 'code-review', 'security-scan', 'performance-analysis'];
      case 'chrome':
        return [...base, 'accessibility-audit', 'text-extraction', 'design-review'];
      default:
        return base;
    }
  }

  private getRecommendedAgents(analysisTypes: string[]): string[] {
    const agentMap: { [key: string]: string[] } = {
      'general-vision': ['claude-vision', 'gpt-4-vision'],
      'ui-analysis': ['claude-vision', 'gemini-vision'],
      'accessibility-audit': ['accessibility-specialist', 'claude-vision'],
      'code-review': ['claude-code', 'copilot-agent'],
      'security-scan': ['security-specialist', 'claude-security'],
      'performance-analysis': ['performance-specialist', 'lighthouse-agent'],
      'text-extraction': ['ocr-specialist', 'claude-vision'],
      'design-review': ['design-specialist', 'claude-vision']
    };

    const recommendedAgents = new Set<string>();
    analysisTypes.forEach(type => {
      agentMap[type]?.forEach(agent => recommendedAgents.add(agent));
    });

    return Array.from(recommendedAgents);
  }

  private sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...message,
        platform: this.config.platform,
        timestamp: new Date().toISOString()
      }));
    }
  }

  private generateId(): string {
    return ${this.config.platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        // Public getters
        get;
        connected();
        boolean;
        {
            return this.isConnected;
        }
        get;
        activeSessionCount();
        number;
        {
            return this.activeSessions.size;
        }
        get;
        connectedAgentCount();
        number;
        {
            return this.connectedAgents.size;
        }
        get;
        historyCount();
        number;
        {
            return this.analysisHistory.length;
        }
    }
}
exports.AIAnalysisService = AIAnalysisService;
//# sourceMappingURL=AIAnalysisService.js.map