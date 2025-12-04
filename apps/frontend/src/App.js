import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from './providers/ThemeProvider';
import { LayoutProvider } from './contexts/LayoutContext';
import ErrorBoundary from './components/core/ErrorBoundary';
import { usePerformanceMonitor } from './components/performance/PerformanceMonitor';
import PerformanceMonitor from './components/performance/PerformanceMonitor';
// Using ComprehensiveRouter (stable implementation)
import ComprehensiveRouter from './ComprehensiveRouter';
var queryClient = new QueryClient();
// App performance wrapper
var AppContent = function () {
    var showMonitor = usePerformanceMonitor().showMonitor;
    return (_jsxs(_Fragment, { children: [_jsx(ComprehensiveRouter, {}), showMonitor && (_jsx(PerformanceMonitor, { position: "bottom-right", compact: true }))] }));
};
export function App() {
    // Performance monitoring in development
    React.useEffect(function () {
        if (process.env.NODE_ENV === 'development') {
            console.log('🚀 Performance-optimized The New Fuse App starting...');
            console.log('📊 Bundle analysis: Run "pnpm build:analyze" to view detailed bundle analysis');
            console.log('🎯 Performance monitor: Press Ctrl+Shift+P to toggle performance monitor');
            // Log initial performance metrics
            setTimeout(function () {
                var _a, _b;
                console.log('📈 Initial Performance Report:');
                console.log('- Memory usage:', ((_a = performance.memory) === null || _a === void 0 ? void 0 : _a.usedJSHeapSize) ?
                    "".concat((performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1), "MB") : 'N/A');
                console.log('- Navigation timing:', ((_b = performance.getEntriesByType('navigation')[0]) === null || _b === void 0 ? void 0 : _b.loadEventEnd) ?
                    "".concat((performance.getEntriesByType('navigation')[0].loadEventEnd / 1000).toFixed(2), "s") : 'N/A');
            }, 2000);
        }
    }, []);
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(ThemeProvider, { children: _jsx(LayoutProvider, { children: _jsx(ErrorBoundary, { children: _jsx(AppContent, {}) }) }) }) }));
}
