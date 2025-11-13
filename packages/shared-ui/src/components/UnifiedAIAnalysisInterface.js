"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedAIAnalysisInterface = void 0;
const react_1 = __importStar(require("react"));
const WebRTCService_1 = require("../services/WebRTCService");
const AIAnalysisService_1 = require("../services/AIAnalysisService");
const UnifiedAIAnalysisInterface = ({ platform, onAnalysisComplete, onAgentConnect, initialAnalysisTypes = ['ui-analysis', 'accessibility-audit', 'general-vision'], showStreamingControls = true, showFileUpload = false, allowCustomSource = false }) => {
    // State Management
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    const [activeSessions, setActiveSessions] = (0, react_1.useState)([]);
    const [connectedAgents, setConnectedAgents] = (0, react_1.useState)([]);
    const [selectedAnalysisTypes, setSelectedAnalysisTypes] = (0, react_1.useState)(initialAnalysisTypes);
    const [isStreaming, setIsStreaming] = (0, react_1.useState)(false);
    const [streamingSource, setStreamingSource] = (0, react_1.useState)('');
    const [analysisHistory, setAnalysisHistory] = (0, react_1.useState)([]);
    // Service References
    const webrtcService = (0, react_1.useRef)(null);
    const aiService = (0, react_1.useRef)(null);
    // Platform-specific configurations
    const platformConfig = {
        web: {
            streamingSources: ['desktop', 'camera'],
            analysisTypes: ['ui-analysis', 'accessibility-audit', 'text-extraction', 'general-vision'],
            showUploadButton: true
        },
        electron: {
            streamingSources: ['desktop', 'application', 'screen'],
            analysisTypes: ['ui-analysis', 'accessibility-audit', 'security-scan', 'performance-analysis'],
            showNativeIntegration: true
        },
        vscode: {
            streamingSources: ['workspace', 'file'],
            analysisTypes: ['code-review', 'security-scan', 'performance-analysis', 'accessibility-audit'],
            showFileTree: true
        },
        chrome: {
            streamingSources: ['tab', 'page'],
            analysisTypes: ['ui-analysis', 'accessibility-audit', 'text-extraction', 'design-review'],
            showPageCapture: true
        }
    };
    const currentConfig = platformConfig[platform];
    // Initialize services
    (0, react_1.useEffect)(() => {
        initializeServices();
        return () => cleanupServices();
    }, []);
    const initializeServices = async () => {
        try {
            // Initialize WebRTC service
            webrtcService.current = new WebRTCService_1.WebRTCService({
                signalingServer: 'ws://localhost:3710',
                platform: platform
            });
            // Initialize AI Analysis service
            aiService.current = new AIAnalysisService_1.AIAnalysisService({
                apiUrl: 'http://localhost:3001/api',
                platform: platform
            });
            // Set up event listeners
            webrtcService.current.on('connected', () => setIsConnected(true));
            webrtcService.current.on('disconnected', () => setIsConnected(false));
            webrtcService.current.on('streaming-started', handleStreamingStarted);
            webrtcService.current.on('streaming-stopped', handleStreamingStopped);
            aiService.current.on('agent-connected', handleAgentConnected);
            aiService.current.on('analysis-started', handleAnalysisStarted);
            aiService.current.on('analysis-completed', handleAnalysisCompleted);
            aiService.current.on('analysis-error', handleAnalysisError);
            // Connect to services
            await webrtcService.current.connect();
            await aiService.current.connect();
        }
        catch (error) {
            console.error('Failed to initialize Unified AI Analysis Interface:', error);
        }
    };
    const cleanupServices = () => {
        webrtcService.current?.disconnect();
        aiService.current?.disconnect();
    };
    // Event Handlers
    const handleStreamingStarted = (source) => {
        setIsStreaming(true);
        setStreamingSource(source);
    };
    const handleStreamingStopped = () => {
        setIsStreaming(false);
        setStreamingSource('');
    };
    const handleAgentConnected = (agent) => {
        setConnectedAgents(prev => {
            const existing = prev.find(a => a.id === agent.id);
            if (existing) {
                return prev.map(a => a.id === agent.id ? agent : a);
            }
            return [...prev, agent];
        });
        onAgentConnect?.(agent);
    };
    const handleAnalysisStarted = (session) => {
        setActiveSessions(prev => [...prev, session]);
    };
    const handleAnalysisCompleted = (session) => {
        setActiveSessions(prev => prev.filter(s => s.id !== session.id));
        setAnalysisHistory(prev => [session, ...prev]);
        onAnalysisComplete?.(session);
    };
    const handleAnalysisError = (session) => {
        setActiveSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: 'error' } : s));
    };
    // Action Handlers
    const startDesktopStreaming = async () => {
        try {
            if (!webrtcService.current)
                throw new Error('WebRTC service not initialized');
            await webrtcService.current.startDesktopStreaming({
                audio: false,
                video: true,
                frameRate: 30
            });
        }
        catch (error) {
            console.error('Failed to start desktop streaming:', error);
        }
    };
    const stopStreaming = async () => {
        try {
            if (!webrtcService.current)
                throw new Error('WebRTC service not initialized');
            await webrtcService.current.stopStreaming();
        }
        catch (error) {
            console.error('Failed to stop streaming:', error);
        }
    };
    const startAnalysis = async (source, type = 'immediate') => {
        try {
            if (!aiService.current)
                throw new Error('AI service not initialized');
            const session = {
                id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)},
        type: type,
        status: 'pending',
        startedAt: new Date().toISOString(),
        agents: connectedAgents.map(a => a.id),
        source: source
      };

      await aiService.current.startAnalysis(session, selectedAnalysisTypes);
    } catch (error) {
      console.error('Failed to start analysis:', error);
    }
  };

  const captureAndAnalyze = async () => {
    try {
      let source;
      
      switch (platform) {
        case 'chrome':
          source = { type: 'tab', identifier: 'current' };
          break;
        case 'vscode':
          source = { type: 'file', identifier: 'active-editor' };
          break;
        case 'electron':
          source = { type: 'desktop', identifier: 'screen-capture' };
          break;
        default:
          source = { type: 'custom', identifier: 'user-selected' };
      }

      await startAnalysis(source, 'immediate');
    } catch (error) {
      console.error('Failed to capture and analyze:', error);
    }
  };

  const toggleAnalysisType = (type: string) => {
    setSelectedAnalysisTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Render Components
  const renderConnectionStatus = () => (`
                    < div, className = { connection } - status, $
            }, { isConnected, 'connected': , 'disconnected':  };
            `>
      <div className={status-indicator ${isConnected ? 'online' : 'offline'}`;
        }
        finally { }
        />
            < span;
        className = "status-text" >
            { isConnected, 'Connected to AI Hub': 'Disconnected' };
    };
};
exports.UnifiedAIAnalysisInterface = UnifiedAIAnalysisInterface;
span >
;
div >
;
;
const renderStreamingControls = () => {
    if (!showStreamingControls)
        return null;
    return (<div className="streaming-controls">
        <h3>Real-time Streaming</h3>
        <div className="streaming-status">
          {isStreaming ? (<div className="streaming-active">
              <div className="streaming-indicator pulse"/>
              <span>Streaming {streamingSource}</span>
              <button className="btn-stop" onClick={stopStreaming}>
                Stop Streaming
              </button>
            </div>) : (<div className="streaming-inactive">
              {currentConfig.streamingSources.map(source => (<button key={source} className="btn-start-stream" onClick={() => startDesktopStreaming()}>
                  Stream {source}
                </button>))}
            </div>)}
        </div>
      </div>);
};
const renderAnalysisTypes = () => (<div className="analysis-types">
      <h3>Analysis Options</h3>
      <div className="analysis-grid">
        {currentConfig.analysisTypes.map(type => (<label key={type} className="analysis-type-item">
            <input type="checkbox" checked={selectedAnalysisTypes.includes(type)} onChange={() => toggleAnalysisType(type)}/>
            <span className="analysis-type-name">
              {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </label>))}
      </div>
    </div>);
const renderConnectedAgents = () => (<div className="connected-agents">
      <h3>AI Agents ({connectedAgents.length})</h3>
      <div className="agents-list">
        {connectedAgents.length > 0 ? (connectedAgents.map(agent => (<div key={agent.id} className={agent - card} $ {...agent.status}/>))) : }>
              <div className="agent-icon">
                {agent.type === 'vision' ? '👁️' :
        agent.type === 'code' ? '💻' :
            agent.type === 'accessibility' ? '♿' :
                agent.type === 'security' ? '🔒' :
                    agent.type === 'performance' ? '⚡' : '🤖'}
              </div>
              <div className="agent-info">
                <div className="agent-name">{agent.name}</div>
                <div className="agent-status">{agent.status}</div>
                <div className="agent-capabilities">
                  {agent.capabilities.slice(0, 2).join(', ')}`
                  {agent.capabilities.length > 2 && +$}{agent.capabilities.length - 2}`
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-agents">
            <span className="icon">🔌</span>
            <span>No AI agents connected</span>
          </div>
        )}
      </div>);
div >
;
;
const renderActiveSessions = () => (<div className="active-sessions">
      <h3>Active Analysis ({activeSessions.length})</h3>
      <div className="sessions-list">
        {activeSessions.length > 0 ? (activeSessions.map(session => (<div key={session.id} className={session - card} $ {...session.status}/>))) : }>
              <div className="session-icon">
                {session.status === 'pending' ? '⏳' :
        session.status === 'active' ? '🔍' :
            session.status === 'error' ? '❌' : '✅'}
              </div>
              <div className="session-info">
                <div className="session-type">{session.type}</div>
                <div className="session-source">
                  {session.source.type}: {session.source.identifier}
                </div>
                <div className="session-agents">
                  {session.agents.length} agents working
                </div>
              </div>
              {session.status === 'active' && (<div className="session-progress">
                  <div className="progress-bar">
                    <div className="progress-fill animate-pulse"/>
                  </div>
                </div>)}
            </div>
          ))
        ) : (
          <div className="no-sessions">
            <span className="icon">💤</span>
            <span>No active analysis sessions</span>
          </div>
        )}
      </div>);
div >
;
;
const renderActionButtons = () => (<div className="action-buttons">
      <button className="btn-primary" onClick={captureAndAnalyze} disabled={!isConnected || connectedAgents.length === 0}>
        <span className="icon">🔍</span>
        Start Analysis
      </button>
      
      {showStreamingControls && (<button className="btn-secondary" onClick={isStreaming ? stopStreaming : startDesktopStreaming} disabled={!isConnected}>
          <span className="icon">{isStreaming ? '⏹️' : '📹'}</span>
          {isStreaming ? 'Stop Stream' : 'Start Stream'}
        </button>)}

      {showFileUpload && (<button className="btn-secondary">
          <span className="icon">📁</span>
          Upload File
        </button>)}
    </div>);
`
`;
return (<div className={unified - ai - analysis - interface} platform-$ {...platform}>
      <div className="interface-header">
        <h2>🎯 Universal AI Vision System</h2>
        {renderConnectionStatus()}
      </div>

      <div className="interface-content">
        {renderStreamingControls()}
        {renderAnalysisTypes()}
        {renderConnectedAgents()}
        {renderActiveSessions()}
      </div>

      <div className="interface-actions">
        {renderActionButtons()}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: 
            .unified - ai - analysis - interface
    }} {...display}/>: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-primary, #ffffff);
          border-radius: 8px;
          overflow: hidden;
        }

        .interface-header {padding}: 16px;
          border-bottom: 1px solid var(--border-color, #e5e5e5);
          background: var(--bg-secondary, #f8f9fa);
        }

        .interface-header h2 {margin}: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .connection-status {display}: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {width}: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--status-color, #dc3545);
        }

        .status-indicator.online {background}: var(--success-color, #28a745);
        }

        .interface-content {flex}: 1;
          padding: 16px;
          overflow-y: auto;
        }

        .streaming-controls, .analysis-types, .connected-agents, .active-sessions {margin - bottom}: 24px;
        }

        .streaming-controls h3, .analysis-types h3, .connected-agents h3, .active-sessions h3 {margin}: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary, #6c757d);
        }

        .streaming-active {display}: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: var(--success-bg, #d4edda);
          border-radius: 6px;
        }

        .streaming-indicator.pulse {width}: 8px;
          height: 8px;
          background: var(--success-color, #28a745);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {0 % { opacity: 1 }}
          50% {opacity}: 0.5; }
          100% {opacity}: 1; }
        }

        .analysis-grid {display}: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
        }

        .analysis-type-item {display}: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border: 1px solid var(--border-color, #e5e5e5);
          border-radius: 4px;
          cursor: pointer;
        }

        .analysis-type-item:hover {background}: var(--hover-bg, #f8f9fa);
        }

        .agents-list, .sessions-list {display}: flex;
          flex-direction: column;
          gap: 8px;
        }

        .agent-card, .session-card {display}: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid var(--border-color, #e5e5e5);
          border-radius: 6px;
          background: var(--bg-primary, #ffffff);
        }

        .agent-card.connected {border - color}: var(--success-color, #28a745);
        }

        .session-card.active {border - color}: var(--primary-color, #007bff);
        }

        .no-agents, .no-sessions {display}: flex;
          align-items: center;
          gap: 8px;
          padding: 24px;
          text-align: center;
          color: var(--text-muted, #6c757d);
          border: 2px dashed var(--border-color, #e5e5e5);
          border-radius: 6px;
        }

        .interface-actions {padding}: 16px;
          border-top: 1px solid var(--border-color, #e5e5e5);
          background: var(--bg-secondary, #f8f9fa);
        }

        .action-buttons {display}: flex;
          gap: 8px;
        }

        .btn-primary, .btn-secondary {display}: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {background}: var(--primary-color, #007bff);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {background}: var(--primary-dark, #0056b3);
        }

        .btn-secondary {background}: var(--secondary-color, #6c757d);
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {background}: var(--secondary-dark, #545b62);
        }

        .btn-primary:disabled, .btn-secondary:disabled {opacity}: 0.6;
          cursor: not-allowed;
        }

        .progress-bar {width}: 100%;
          height: 4px;
          background: var(--bg-secondary, #f8f9fa);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {height}: 100%;
          background: var(--primary-color, #007bff);
          animation: progress 2s infinite;
        }

        @keyframes progress {0 % { width: 0 %  }}
          50% {width}: 70%; }
          100% {width}: 0%; }
        }

        .platform-vscode {--bg - primary}: var(--vscode-editor-background);
          --bg-secondary: var(--vscode-panel-background);
          --text-primary: var(--vscode-editor-foreground);
          --border-color: var(--vscode-panel-border);
        }

        .platform-chrome {font - family}: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui;
        }

        .platform-electron {`
          --bg-primary: #ffffff;`}
          --bg-secondary: #f5f5f5;`
        }
      `}} />
    </div>);
;
exports.default = exports.UnifiedAIAnalysisInterface;
//# sourceMappingURL=UnifiedAIAnalysisInterface.js.map