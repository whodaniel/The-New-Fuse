import React from 'react';
import { useStore } from '@/store';
import { PerformanceMonitor } from './PerformanceMonitor.js';

interface DevToolsProps {}

export const DevTools: React.React.FC<DevToolsProps> = () => {
  const { isDevelopment } = useStore((state) => state.system);
  
  if (!isDevelopment) return null;

  return (
    <div className="dev-tools-panel fixed bottom-4 right-4 p-4 bg-background border rounded-lg shadow-lg">
      <PerformanceMonitor />
      <div className="dev-tools-controls space-y-2">
        <h3 className="font-semibold">Development Tools</h3>
        <button 
          className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          onClick={() => {}} // Fixed: Added empty function body
        >
          Log Store State
        </button>
      </div>
    </div>
  );
};
