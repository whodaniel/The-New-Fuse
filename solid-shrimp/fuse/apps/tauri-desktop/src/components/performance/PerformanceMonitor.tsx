import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface PerformanceMetrics {
  memoryUsage: number | null;
  cpuTime: number | null;
  renderCount: number;
  lastRenderTime: number;
}

interface PerformanceContextType {
  metrics: PerformanceMetrics;
  showMonitor: boolean;
  toggleMonitor: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const usePerformanceMonitor = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    // Return defaults if used outside provider
    return {
      metrics: { memoryUsage: null, cpuTime: null, renderCount: 0, lastRenderTime: 0 },
      showMonitor: false,
      toggleMonitor: () => {},
    };
  }
  return context;
};

interface PerformanceProviderProps {
  children: ReactNode;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ children }) => {
  const [showMonitor, setShowMonitor] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: null,
    cpuTime: null,
    renderCount: 0,
    lastRenderTime: performance.now(),
  });

  const toggleMonitor = useCallback(() => {
    setShowMonitor((prev) => !prev);
  }, []);

  // Keyboard shortcut: Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        toggleMonitor();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMonitor]);

  // Update metrics periodically
  useEffect(() => {
    if (!showMonitor) return;

    const interval = setInterval(() => {
      const memory = (performance as any).memory;
      setMetrics((prev) => ({
        memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : null,
        cpuTime: performance.now(),
        renderCount: prev.renderCount + 1,
        lastRenderTime: performance.now(),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [showMonitor]);

  return (
    <PerformanceContext.Provider value={{ metrics, showMonitor, toggleMonitor }}>
      {children}
    </PerformanceContext.Provider>
  );
};

interface PerformanceMonitorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  position = 'bottom-right',
  compact = false,
}) => {
  const { metrics, showMonitor, toggleMonitor } = usePerformanceMonitor();

  if (!showMonitor) return null;

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: 16, left: 16 },
    'top-right': { top: 16, right: 16 },
    'bottom-left': { bottom: 16, left: 16 },
    'bottom-right': { bottom: 16, right: 16 },
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: compact ? '8px 12px' : '12px 16px',
        color: '#f8fafc',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: compact ? '11px' : '12px',
        zIndex: 9999,
        minWidth: compact ? '140px' : '180px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: compact ? 4 : 8,
        }}
      >
        <span style={{ fontWeight: 600 }}>📊 Performance</span>
        <button
          onClick={toggleMonitor}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ×
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {metrics.memoryUsage !== null && (
          <div>
            <span style={{ color: '#10b981' }}>MEM:</span> {metrics.memoryUsage.toFixed(1)} MB
          </div>
        )}
        <div>
          <span style={{ color: '#3b82f6' }}>FPS:</span> ~
          {Math.round(1000 / (performance.now() - metrics.lastRenderTime + 16))}
        </div>
        <div>
          <span style={{ color: '#f59e0b' }}>Renders:</span> {metrics.renderCount}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
