import React from 'react';
interface PerformanceMonitorProps {
    isVisible?: boolean;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    compact?: boolean;
}
declare const PerformanceMonitor: React.FC<PerformanceMonitorProps>;
export declare const usePerformanceMonitor: () => {
    showMonitor: boolean;
    setShowMonitor: React.Dispatch<React.SetStateAction<boolean>>;
};
export default PerformanceMonitor;
