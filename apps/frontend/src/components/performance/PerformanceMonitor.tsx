import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../../utils/performanceMonitor';

interface PerformanceData {
  componentLoadTimes: Record<string, number>;
  routeLoadTimes: Record<string, number>;
  memoryUsage: number;
  bundleSizes: Record<string, number>;
  recommendations: string[];
}

interface PerformanceMonitorProps {
  isVisible?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = false,
  position = 'bottom-right',
  compact = false
}) => {
  const [data, setData] = useState<PerformanceData>({
    componentLoadTimes: {},
    routeLoadTimes: {},
    memoryUsage: 0,
    bundleSizes: {},
    recommendations: []
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);

  // Update performance data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const report = performanceMonitor.generateReport();
      const recommendations = performanceMonitor.getRecommendations();
      
      setData({
        componentLoadTimes: report.componentLoadTime,
        routeLoadTimes: report.routeLoadTime,
        memoryUsage: report.memoryUsage,
        bundleSizes: report.bundleSize,
        recommendations
      });
      
      setUpdateCount(prev => prev + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Position styles
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  // Format utility functions
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Performance score calculation
  const getPerformanceScore = () => {
    const scores = {
      loadTime: Math.max(0, 100 - (Object.values(data.routeLoadTimes).reduce((avg, time) => avg + time, 0) / Object.keys(data.routeLoadTimes).length || 0) / 10),
      memory: Math.max(0, 100 - (data.memoryUsage / 1024 / 1024 / 100)), // Penalize for memory usage
      bundle: Math.max(0, 100 - Object.values(data.bundleSizes).reduce((total, size) => total + size, 0) / 1024 / 100)
    };
    
    const average = (scores.loadTime + scores.memory + scores.bundle) / 3;
    return Math.round(average);
  };

  const performanceScore = getPerformanceScore();

  if (!isVisible) return null;

  return (
    <div className={`fixed ${positionStyles[position]} z-50 ${compact ? 'w-16 h-16' : 'w-80'}`}>
      {/* Compact Indicator */}
      {compact && !isExpanded && (
        <div
          className="bg-black/80 text-white rounded-full p-3 cursor-pointer hover:bg-black/90 transition-colors"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center space-x-1">
            <div className={`w-3 h-3 rounded-full ${
              performanceScore >= 80 ? 'bg-green-500' :
              performanceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs font-bold">{performanceScore}</span>
          </div>
        </div>
      )}

      {/* Full Monitor */}
      {(isExpanded || !compact) && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  performanceScore >= 80 ? 'bg-green-500' :
                  performanceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Performance Monitor
                </h3>
                {updateCount > 0 && (
                  <span className="text-xs text-gray-500">({updateCount} updates)</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {performanceScore}/100
                </span>
                {compact && (
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {/* Performance Score Details */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-gray-500">Load</div>
                  <div className="font-bold">{Math.max(0, 100 - (Object.values(data.routeLoadTimes).reduce((avg, time) => avg + time, 0) / Object.keys(data.routeLoadTimes).length || 0) / 10)}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Memory</div>
                  <div className="font-bold">{Math.max(0, 100 - (data.memoryUsage / 1024 / 1024 / 100))}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Bundle</div>
                  <div className="font-bold">{Math.max(0, 100 - Object.values(data.bundleSizes).reduce((total, size) => total + size, 0) / 1024 / 100)}</div>
                </div>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Memory Usage</span>
                <span className="font-medium">{formatBytes(data.memoryUsage)}</span>
              </div>
              <div className="mt-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    data.memoryUsage < 30 * 1024 * 1024 ? 'bg-green-500' :
                    data.memoryUsage < 60 * 1024 * 1024 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, (data.memoryUsage / 100 * 1024 * 1024) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Recent Component Loads */}
            {Object.keys(data.componentLoadTimes).length > 0 && (
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Recent Components
                </h4>
                <div className="space-y-1">
                  {Object.entries(data.componentLoadTimes)
                    .slice(-3)
                    .map(([name, time]) => (
                      <div key={name} className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400 truncate">
                          {name.replace('Route: ', '')}
                        </span>
                        <span className={`font-medium ${
                          time < 200 ? 'text-green-600' :
                          time < 500 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {formatTime(time)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Bundle Sizes */}
            {Object.keys(data.bundleSizes).length > 0 && (
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Bundle Sizes
                </h4>
                <div className="space-y-1">
                  {Object.entries(data.bundleSizes)
                    .slice(-3)
                    .map(([name, size]) => (
                      <div key={name} className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400 truncate">
                          {name}
                        </span>
                        <span className={`font-medium ${
                          size < 100 * 1024 ? 'text-green-600' :
                          size < 500 * 1024 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {formatBytes(size)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {data.recommendations.length > 0 && (
              <div className="px-4 py-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  💡 Recommendations
                </h4>
                <div className="space-y-1">
                  {data.recommendations.slice(0, 2).map((rec, index) => (
                    <div key={index} className="text-xs text-yellow-600 dark:text-yellow-400">
                      • {rec}
                    </div>
                  ))}
                  {data.recommendations.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{data.recommendations.length - 2} more...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  performanceMonitor.logSummary();
                  setUpdateCount(0);
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Log Details
              </button>
              <button
                onClick={() => {
                  performanceMonitor.clearCache();
                  setData({
                    componentLoadTimes: {},
                    routeLoadTimes: {},
                    memoryUsage: 0,
                    bundleSizes: {},
                    recommendations: []
                  });
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for easy integration
export const usePerformanceMonitor = () => {
  const [showMonitor, setShowMonitor] = useState(false);

  useEffect(() => {
    // Show monitor in development
    if (process.env.NODE_ENV === 'development') {
      setShowMonitor(true);
    }

    // Keyboard shortcut to toggle monitor (Ctrl+Shift+P)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setShowMonitor(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { showMonitor, setShowMonitor };
};

export default PerformanceMonitor;