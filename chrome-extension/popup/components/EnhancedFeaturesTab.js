import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Speed as PerformanceIcon, Security as SecurityIcon, Chat as ChatIcon, Settings as SettingsIcon, CheckCircle as SuccessIcon, Error as ErrorIcon, Warning as WarningIcon, Info as InfoIcon, Psychology as BrainIcon } from '@mui/icons-material';
const EnhancedFeaturesTab = () => {
    const [features, setFeatures] = useState([]);
    const [performance, setPerformance] = useState({
        memoryUsage: 0,
        cpuUsage: 0,
        networkLatency: 0,
        domOperations: 0,
        errorRate: 0,
        timestamp: Date.now(),
        connectionLatency: 0,
        messageProcessingTime: 0,
        optimizationRecommendations: []
    });
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [autoOptimize, setAutoOptimize] = useState(false);
    const [healthStatus, setHealthStatus] = useState(null);
    const [optimizationSettings, setOptimizationSettings] = useState({
        enableAutoOptimization: false,
        performanceThreshold: 80,
        memoryThreshold: 70,
        cpuThreshold: 60,
        networkThreshold: 1000,
        optimizationInterval: 30000,
        adaptiveOptimization: true,
        aggressiveMode: false
    });
    const [lastOptimization, setLastOptimization] = useState(null);
    useEffect(() => {
        initializeFeatures();
        loadPerformanceMetrics();
        loadHealthStatus();
        loadOptimizationSettings();
        const metricsInterval = setInterval(loadPerformanceMetrics, 5000);
        const healthInterval = setInterval(loadHealthStatus, 30000);
        return () => {
            clearInterval(metricsInterval);
            clearInterval(healthInterval);
        };
    }, []);
    const initializeFeatures = async () => {
        try {
            // Request current feature states from background script
            const response = await chrome.runtime.sendMessage({
                type: 'GET_FEATURE_STATES'
            });
            const defaultFeatures = [
                {
                    id: 'floating-panel-ui',
                    name: 'Floating Panel UI Injection',
                    description: 'Direct page injection with draggable floating interface panel',
                    enabled: response?.features?.['floating-panel-ui'] ?? true,
                    category: 'integration',
                    dependencies: ['ai-element-detection'],
                    healthStatus: 'healthy',
                    metrics: { usage: 67, success: 95, errors: 1, lastUsed: new Date() }
                },
                id, 'ai-element-detection',
                name, 'AI Element Detection',
                description, 'Advanced AI-powered detection of chat elements using ML models',
                enabled, response?.features?.['ai-element-detection'] ?? true,
                category, 'ai',
                dependencies, [],
                healthStatus, 'healthy',
                metrics, { usage: 245, success: 94, errors: 3, lastUsed: new Date() }
            ];
        }
        finally { }
        {
            id: 'smart-reconnection',
                name;
            'Smart WebSocket Reconnection',
                description;
            'Intelligent reconnection with exponential backoff and health checks',
                enabled;
            response?.features?.['smart-reconnection'] ?? true,
                category;
            'performance',
                dependencies;
            [],
                healthStatus;
            'healthy',
                metrics;
            {
                usage: 156, success;
                98, errors;
                1, lastUsed;
                new Date();
            }
        }
        {
            id: 'message-encryption',
                name;
            'End-to-End Encryption',
                description;
            'AES-256 encryption for sensitive chat content and data',
                enabled;
            response?.features?.['message-encryption'] ?? true,
                category;
            'security',
                dependencies;
            [],
                healthStatus;
            'healthy',
                metrics;
            {
                usage: 189, success;
                100, errors;
                0, lastUsed;
                new Date();
            }
        }
        {
            id: 'multi-platform-integration',
                name;
            'Multi-Platform Support',
                description;
            'ChatGPT, Claude, Gemini, Discord, Slack, and custom platforms',
                enabled;
            response?.features?.['multi-platform-integration'] ?? true,
                category;
            'integration',
                dependencies;
            ['ai-element-detection'],
                healthStatus;
            'warning',
                metrics;
            {
                usage: 312, success;
                89, errors;
                8, lastUsed;
                new Date();
            }
        }
        {
            id: 'predictive-caching',
                name;
            'ML-Based Predictive Caching',
                description;
            'Machine learning-powered caching of frequently accessed elements',
                enabled;
            response?.features?.['predictive-caching'] ?? false,
                category;
            'performance',
                dependencies;
            ['ai-element-detection'],
                healthStatus;
            'healthy',
                metrics;
            {
                usage: 78, success;
                87, errors;
                2, lastUsed;
                new Date();
            }
        }
        {
            id: 'behavioral-analysis',
                name;
            'User Behavioral Analysis',
                description;
            'Learn user patterns to improve automation accuracy and speed',
                enabled;
            response?.features?.['behavioral-analysis'] ?? false,
                category;
            'ai',
                dependencies;
            ['ai-element-detection', 'predictive-caching'],
                healthStatus;
            'healthy',
                metrics;
            {
                usage: 0, success;
                0, errors;
                0;
            }
        }
        {
            id: 'performance-monitoring',
                name;
            'Real-time Performance Monitoring',
                description;
            'Continuous monitoring with automatic optimization triggers',
                enabled;
            response?.features?.['performance-monitoring'] ?? true,
                category;
            'performance',
                dependencies;
            [],
                healthStatus;
            'healthy',
                metrics;
            {
                usage: 500, success;
                96, errors;
                2, lastUsed;
                new Date();
            }
        }
        {
            id: 'adaptive-optimization',
                name;
            'Adaptive Performance Optimization',
                description;
            'AI-driven optimization based on usage patterns and system resources',
                enabled;
            response?.features?.['adaptive-optimization'] ?? true,
                category;
            'performance',
                dependencies;
            ['performance-monitoring', 'behavioral-analysis'],
                healthStatus;
            'healthy',
                metrics;
            {
                usage: 123, success;
                92, errors;
                1, lastUsed;
                new Date();
            }
        }
    };
};
;
setFeatures(defaultFeatures);
try { }
catch (error) {
    console.error('Failed to initialize features:', error);
    setFeatures([]);
}
;
const loadPerformanceMetrics = async () => {
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'GET_METRICS'
        });
        if (response?.metrics) {
            setPerformance(prev => ({
                ...prev,
                ...response.metrics,
                connectionLatency: response.metrics.networkLatency || prev.connectionLatency,
                messageProcessingTime: Math.random() * 50 + 10, // Simulated for now
                optimizationRecommendations: response.recommendations || []
            }));
        }
    }
    catch (error) {
        console.error('Failed to load performance metrics:', error);
    }
};
const loadHealthStatus = async () => {
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'HEALTH_CHECK'
        });
        if (response?.health) {
            setHealthStatus(response.health);
            // Update feature health status based on health check
            setFeatures(prev => prev.map(feature => ({
                ...feature,
                healthStatus: response.health.components[feature.id]?.status || feature.healthStatus
            })));
        }
    }
    catch (error) {
        console.error('Failed to load health status:', error);
    }
};
const loadOptimizationSettings = async () => {
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'GET_OPTIMIZATION_SETTINGS'
        });
        if (response?.settings) {
            setOptimizationSettings(response.settings);
            setAutoOptimize(response.settings.enableAutoOptimization);
        }
    }
    catch (error) {
        console.error('Failed to load optimization settings:', error);
    }
};
const toggleFeature = async (featureId) => {
    const feature = features.find(f => f.id === featureId);
    if (!feature)
        return;
    // Check dependencies before disabling
    if (feature.enabled) {
        const dependentFeatures = features.filter(f => f.dependencies?.includes(featureId) && f.enabled);
        if (dependentFeatures.length > 0) {
            alert(`Cannot disable ${feature.name}. The following features depend on it: ${dependentFeatures.map(f => f.name).join(', ')}`);
            return;
        }
    }
    setFeatures(prev => prev.map(f => {
        if (f.id === featureId) {
            const newEnabled = !f.enabled;
            // Send message to background script
            chrome.runtime.sendMessage({
                type: 'TOGGLE_FEATURE',
                payload: { featureId, enabled: newEnabled }
            });
            return { ...f, enabled: newEnabled };
        }
        return f;
    }));
};
const optimizePerformance = async () => {
    try {
        setLastOptimization(new Date());
        // Trigger optimization in background script
        await chrome.runtime.sendMessage({
            type: 'OPTIMIZE_PERFORMANCE',
            payload: {
                aggressive: optimizationSettings.aggressiveMode,
                settings: optimizationSettings
            }
        });
        // Show optimization in progress
        setFeatures(prev => prev.map(feature => feature.category === 'performance'
            ? { ...feature, healthStatus: 'warning' }
            : feature));
        // Reload metrics after optimization
        setTimeout(() => {
            loadPerformanceMetrics();
            loadHealthStatus();
            setFeatures(prev => prev.map(feature => feature.category === 'performance'
                ? { ...feature, healthStatus: 'healthy' }
                : feature));
        }, 3000);
    }
    catch (error) {
        console.error('Optimization failed:', error);
    }
};
const handleAutoOptimizeToggle = async (enabled) => {
    setAutoOptimize(enabled);
    try {
        await chrome.runtime.sendMessage({
            type: 'UPDATE_SETTINGS',
            payload: {
                optimization: {
                    ...optimizationSettings,
                    enableAutoOptimization: enabled
                }
            }
        });
    }
    catch (error) {
        console.error('Failed to update auto-optimize setting:', error);
    }
};
const exportSettings = async () => {
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'EXPORT_SETTINGS'
        });
        if (response?.settings) {
            const blob = new Blob([JSON.stringify(response.settings, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fuse-extension-settings-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }
    catch (error) {
        console.error('Failed to export settings:', error);
    }
};
const importSettings = async (event) => {
    const file = event.target.files?.[0];
    if (!file)
        return;
    try {
        const text = await file.text();
        const settings = JSON.parse(text);
        await chrome.runtime.sendMessage({
            type: 'IMPORT_SETTINGS',
            payload: { settings }
        });
        // Reload all data
        await initializeFeatures();
        await loadOptimizationSettings();
        await loadPerformanceMetrics();
    }
    catch (error) {
        console.error('Failed to import settings:', error);
        alert('Failed to import settings. Please check the file format.');
    }
};
const getCategoryIcon = (category) => {
    switch (category) {
        case 'ai': return _jsx(BrainIcon, {});
        case 'performance': return _jsx(PerformanceIcon, {});
        case 'security': return _jsx(SecurityIcon, {});
        case 'integration': return _jsx(ChatIcon, {});
        default: return _jsx(SettingsIcon, {});
    }
};
const getStatusIcon = (feature) => {
    if (!feature.enabled)
        return _jsx(ErrorIcon, { color: "error" });
    switch (feature.healthStatus) {
        case 'healthy': return _jsx(SuccessIcon, { color: "success" });
        case 'warning': return _jsx(WarningIcon, { color: "warning" });
        case 'critical': return _jsx(ErrorIcon, { color: "error" });
        default: return _jsx(InfoIcon, {});
    }
};
const getStatusColor = (feature) => {
    if (!feature.enabled)
        return 'error';
    switch (feature.healthStatus) {
        case 'healthy': return 'success';
        case 'warning': return 'warning';
        case 'critical': return 'error';
        default: return 'default';
    }
};
const getHealthBadgeCount = () => {
    return features.filter(f => f.healthStatus === 'warning' || f.healthStatus === 'critical').length;
};
const filteredFeatures = selectedCategory === 'all'
    ? features
    : features.filter(f => f.category === selectedCategory);
const getPerformanceColor = (value, thresholds) => {
    if (value <= thresholds.good)
        return 'success';
    if (value <= thresholds.warning)
        return 'warning';
    return 'error';
};
return (_jsxs(Box, { sx: { p: 2 }, children: [healthStatus && healthStatus.status !== 'healthy' && (_jsx(Alert, { severity: healthStatus.status === 'critical' ? 'error' : 'warning', sx: { mb: 2 }, action: _jsx(Button, { size: "small", onClick: optimizePerformance, children: "Fix Issues" }), children: _jsxs(Typography, { variant: "body2", children: ["System health: ", healthStatus.status, ".", healthStatus.issues.length > 0 && ` Issues: ${healthStatus.issues.join(', ')}`] }) })), _jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 2, children: [_jsx(Badge, { badgeContent: getHealthBadgeCount(), color: "warning", children: _jsx(AnalyticsIcon, { sx: { mr: 1 } }) }), _jsx(Typography, { variant: "h6", children: "Performance Metrics" }), _jsx(Box, { flexGrow: 1 }), _jsx(Tooltip, { title: "Last optimization", children: _jsx(Typography, { variant: "caption", sx: { mr: 2 }, children: lastOptimization ? `Optimized ${lastOptimization.toLocaleTimeString()}` : 'Never optimized' }) }), _jsx(Button, { size: "small", onClick: optimizePerformance, startIcon: _jsx(OptimizeIcon, {}), variant: "contained", color: "primary", children: "Optimize Now" })] }), _jsxs(Box, { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "body2", color: "textSecondary", children: "Memory Usage" }), _jsxs(Typography, { variant: "h6", color: getPerformanceColor(performance.memoryUsage, { good: 50, warning: 80 }), children: [performance.memoryUsage.toFixed(0), "%"] }), _jsx(LinearProgress, { variant: "determinate", value: performance.memoryUsage, color: getPerformanceColor(performance.memoryUsage, { good: 50, warning: 80 }), sx: { mt: 0.5 } })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "body2", color: "textSecondary", children: "CPU Usage" }), _jsxs(Typography, { variant: "h6", color: getPerformanceColor(performance.cpuUsage, { good: 30, warning: 60 }), children: [performance.cpuUsage.toFixed(0), "%"] }), _jsx(LinearProgress, { variant: "determinate", value: performance.cpuUsage, color: getPerformanceColor(performance.cpuUsage, { good: 30, warning: 60 }), sx: { mt: 0.5 } })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "body2", color: "textSecondary", children: "Network Latency" }), _jsxs(Typography, { variant: "h6", color: getPerformanceColor(performance.networkLatency, { good: 100, warning: 500 }), children: [performance.networkLatency.toFixed(0), "ms"] }), _jsx(LinearProgress, { variant: "determinate", value: Math.min(performance.networkLatency, 1000) / 10, color: getPerformanceColor(performance.networkLatency, { good: 100, warning: 500 }), sx: { mt: 0.5 } })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "body2", color: "textSecondary", children: "DOM Operations" }), _jsx(Typography, { variant: "h6", color: getPerformanceColor(performance.domOperations, { good: 50, warning: 200 }), children: performance.domOperations }), _jsx(LinearProgress, { variant: "determinate", value: Math.min(performance.domOperations, 500) / 5, color: getPerformanceColor(performance.domOperations, { good: 50, warning: 200 }), sx: { mt: 0.5 } })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "body2", color: "textSecondary", children: "Error Rate" }), _jsxs(Typography, { variant: "h6", color: getPerformanceColor(performance.errorRate, { good: 1, warning: 3 }), children: [performance.errorRate.toFixed(1), "%"] }), _jsx(LinearProgress, { variant: "determinate", value: Math.min(performance.errorRate, 10) * 10, color: getPerformanceColor(performance.errorRate, { good: 1, warning: 3 }), sx: { mt: 0.5 } })] })] }), performance.optimizationRecommendations && performance.optimizationRecommendations.length > 0 && (_jsxs(Box, { mt: 2, children: [_jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Optimization Recommendations:" }), _jsx(Box, { display: "flex", gap: 1, flexWrap: "wrap", children: performance.optimizationRecommendations.map((recommendation, index) => (_jsx(Chip, { label: recommendation, size: "small", color: "info", variant: "outlined" }, index))) })] }))] }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 2, children: [_jsx(AIIcon, { sx: { mr: 1 } }), _jsx(Typography, { variant: "h6", children: "Enhanced Features" }), _jsx(Box, { flexGrow: 1 }), _jsxs(Box, { display: "flex", gap: 1, children: [_jsx("input", { type: "file", accept: ".json", onChange: importSettings, style: { display: 'none' }, id: "import-settings", "aria-label": "Import settings" }), _jsx("label", { htmlFor: "import-settings", children: _jsx(IconButton, { component: "span", size: "small", children: _jsx(ImportIcon, {}) }) }), _jsx(IconButton, { size: "small", onClick: exportSettings, children: _jsx(ExportIcon, {}) }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: autoOptimize, onChange: (e) => handleAutoOptimizeToggle(e.target.checked) }), label: "Auto-optimize" })] })] }), _jsxs(Box, { display: "flex", gap: 2, mb: 2, children: [_jsxs(FormControl, { size: "small", sx: { minWidth: 120 }, children: [_jsx(InputLabel, { children: "Category" }), _jsxs(Select, { value: selectedCategory, label: "Category", onChange: (e) => setSelectedCategory(e.target.value), children: [_jsx(MenuItem, { value: "all", children: "All" }), _jsx(MenuItem, { value: "ai", children: "AI" }), _jsx(MenuItem, { value: "performance", children: "Performance" }), _jsx(MenuItem, { value: "security", children: "Security" }), _jsx(MenuItem, { value: "integration", children: "Integration" })] })] }), autoOptimize && (_jsx(Alert, { severity: "info", sx: { flex: 1 }, children: _jsxs(Typography, { variant: "body2", children: ["Auto-optimization enabled. Monitoring every ", (optimizationSettings.optimizationInterval / 1000).toFixed(0), "s"] }) }))] }), _jsx(List, { children: filteredFeatures.map((feature) => (_jsxs(ListItem, { sx: {
                                border: 1,
                                borderColor: feature.enabled ? 'primary.main' : 'divider',
                                borderRadius: 1,
                                mb: 1,
                                backgroundColor: feature.enabled ? 'action.hover' : 'inherit',
                                opacity: feature.enabled ? 1 : 0.7
                            }, children: [_jsx(ListItemIcon, { children: _jsx(Badge, { badgeContent: feature.healthStatus === 'warning' || feature.healthStatus === 'critical' ? '!' : 0, color: feature.healthStatus === 'critical' ? 'error' : 'warning', children: getCategoryIcon(feature.category) }) }), _jsx(ListItemText, { primary: _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", children: [_jsx(Typography, { variant: "subtitle2", children: feature.name }), _jsx(Chip, { size: "small", label: feature.enabled ? 'enabled' : 'disabled', color: getStatusColor(feature), icon: getStatusIcon(feature) }), feature.dependencies && feature.dependencies.length > 0 && (_jsx(Chip, { size: "small", label: `${feature.dependencies.length} deps`, variant: "outlined", color: "info" }))] }), secondary: _jsxs(Box, { children: [_jsx(Typography, { variant: "body2", color: "textSecondary", sx: { mb: 1 }, children: feature.description }), feature.dependencies && feature.dependencies.length > 0 && (_jsxs(Typography, { variant: "caption", color: "textSecondary", sx: { display: 'block', mb: 1 }, children: ["Dependencies: ", feature.dependencies.join(', ')] })), feature.metrics && (_jsxs(Box, { display: "flex", gap: 2, flexWrap: "wrap", children: [_jsxs(Typography, { variant: "caption", children: ["Usage: ", feature.metrics.usage] }), _jsxs(Typography, { variant: "caption", children: ["Success: ", feature.metrics.success, "%"] }), _jsxs(Typography, { variant: "caption", children: ["Errors: ", feature.metrics.errors] }), feature.metrics.lastUsed && (_jsxs(Typography, { variant: "caption", children: ["Last used: ", feature.metrics.lastUsed.toLocaleTimeString()] }))] }))] }) }), _jsx(Box, { children: _jsx(Tooltip, { title: feature.enabled ? 'Disable feature' : 'Enable feature', children: _jsx(Switch, { checked: feature.enabled, onChange: () => toggleFeature(feature.id) }) }) })] }, feature.id))) }), autoOptimize && (_jsxs(Box, { mt: 3, children: [_jsx(Divider, { sx: { mb: 2 } }), _jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "Optimization Settings" }), _jsxs(Box, { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", children: "Performance Threshold" }), _jsxs(Typography, { variant: "body2", children: [optimizationSettings.performanceThreshold, "%"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", children: "Memory Threshold" }), _jsxs(Typography, { variant: "body2", children: [optimizationSettings.memoryThreshold, "%"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", children: "CPU Threshold" }), _jsxs(Typography, { variant: "body2", children: [optimizationSettings.cpuThreshold, "%"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", children: "Adaptive Mode" }), _jsx(Typography, { variant: "body2", children: optimizationSettings.adaptiveOptimization ? 'Enabled' : 'Disabled' })] })] })] }))] }) })] }));
;
export default EnhancedFeaturesTab;
//# sourceMappingURL=EnhancedFeaturesTab.js.map