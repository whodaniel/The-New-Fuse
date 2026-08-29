// NOTE: this component's styling already lives in the shared
// ../BROWSER_CONTROL_SURFACE.css (see .tnf-browser-detection,
// .detection-header, .platform-info there). A component-scoped
// BrowserDetection.css was referenced here but never created; removed the
// dead import rather than fabricate a duplicate stylesheet.

export interface BrowserDetectionProps {
  currentUrl: string | null;
  isControlling: boolean;
  onStartControl: () => Promise<any>;
  onStopControl: () => void;
}

const PLATFORM_CONFIG: Record<
  string,
  {
    name: string;
    icon: string;
    features: string[];
    color: string;
  }
> = {
  'claude.ai': {
    name: 'Claude',
    icon: '🤖',
    features: ['Conversation History', 'Custom Instructions', 'Agent Delegation'],
    color: 'purple',
  },
  'chatgpt.com': {
    name: 'ChatGPT',
    icon: '🟦',
    features: ['Chat History', 'Memory', 'DAN Mode Support'],
    color: 'blue',
  },
  'gemini.ai': {
    name: 'Gemini',
    icon: '🟡',
    features: ['AI Studio', 'Vision', 'Multi-modal'],
    color: 'yellow',
  },
  'perplexity.ai': {
    name: 'Perplexity',
    icon: '🟣',
    features: ['Research Mode', 'Citation Tracking', 'Source Links'],
    color: 'purple',
  },
  'qwen.ai': {
    name: 'Qwen',
    icon: '🟥',
    features: ['Chinese Support', 'Code Generation', 'Multilingual'],
    color: 'red',
  },
  'kimi.com': {
    name: 'Kimi',
    icon: '🟢',
    features: ['Long Context', 'Document Upload', 'Reasoning Mode'],
    color: 'green',
  },
};

export function BrowserDetection({
  currentUrl,
  isControlling,
  onStartControl,
  onStopControl,
}: BrowserDetectionProps) {
  const getPlatformInfo = () => {
    if (!currentUrl) return null;

    const hostname = new URL(currentUrl).hostname;

    for (const [key, config] of Object.entries(PLATFORM_CONFIG)) {
      if (hostname.includes(key)) {
        return config;
      }
    }

    return {
      name: 'Generic AI Page',
      icon: '🌐',
      features: ['Basic Control'],
      color: 'gray',
    };
  };

  const platformInfo = getPlatformInfo();

  return (
    <div className="tnf-browser-detection">
      <div className="detection-header">
        <h3>Platform Detection</h3>
        <span className="status-badge {isControlling ? 'connected' : 'disconnected'}">
          {isControlling ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>

      {platformInfo && (
        <div className="platform-info">
          <div className="platform-icon">{platformInfo.icon}</div>
          <div className="platform-details">
            <h4>{platformInfo.name}</h4>
            <p className="current-url">{currentUrl || 'Not detected'}</p>
            <ul className="features-list">
              {platformInfo.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="detection-actions">
        {isControlling ? (
          <button onClick={onStopControl} className="btn btn-secondary">
            Stop Control
          </button>
        ) : (
          <button onClick={onStartControl} className="btn btn-primary">
            Start TNF Control
          </button>
        )}
      </div>
    </div>
  );
}
