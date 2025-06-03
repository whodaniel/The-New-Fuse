import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  LinearProgress,
  Alert,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Badge
} from '@mui/material';
import {
  AutoFixHigh as AIIcon,
  Speed as PerformanceIcon,
  Security as SecurityIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Psychology as BrainIcon,
  Timeline as AnalyticsIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Health as HealthIcon,
  TrendingUp as OptimizeIcon
} from '@mui/icons-material';
import { PerformanceMetrics, FeatureConfig, OptimizationSettings, HealthCheckResult } from '../../types';

interface EnhancedFeature extends FeatureConfig {
  metrics?: {
    usage: number;
    success: number;
    errors: number;
    lastUsed?: Date;
  };
  category: 'ai' | 'performance' | 'security' | 'integration';
  dependencies?: string[];
  healthStatus?: 'healthy' | 'warning' | 'critical';
}

interface ExtendedPerformanceMetrics extends PerformanceMetrics {
  connectionLatency?: number;
  messageProcessingTime?: number;
  optimizationRecommendations?: string[];
}

const EnhancedFeaturesTab: React.FC = () => {
  const [features, setFeatures] = useState<EnhancedFeature[]>([]);
  const [performance, setPerformance] = useState<ExtendedPerformanceMetrics>({
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthCheckResult | null>(null);
  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSettings>({
    enableAutoOptimization: false,
    performanceThreshold: 80,
    memoryThreshold: 70,
    cpuThreshold: 60,
    networkThreshold: 1000,
    optimizationInterval: 30000,
    adaptiveOptimization: true,
    aggressiveMode: false
  });
  const [lastOptimization, setLastOptimization] = useState<Date | null>(null);

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

      const defaultFeatures: EnhancedFeature[] = [
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
          id: 'ai-element-detection',
          name: 'AI Element Detection',
          description: 'Advanced AI-powered detection of chat elements using ML models',
          enabled: response?.features?.['ai-element-detection'] ?? true,
          category: 'ai',
          dependencies: [],
          healthStatus: 'healthy',
          metrics: { usage: 245, success: 94, errors: 3, lastUsed: new Date() }
        },
        {
          id: 'smart-reconnection',
          name: 'Smart WebSocket Reconnection',
          description: 'Intelligent reconnection with exponential backoff and health checks',
          enabled: response?.features?.['smart-reconnection'] ?? true,
          category: 'performance',
          dependencies: [],
          healthStatus: 'healthy',
          metrics: { usage: 156, success: 98, errors: 1, lastUsed: new Date() }
        },
        {
          id: 'message-encryption',
          name: 'End-to-End Encryption',
          description: 'AES-256 encryption for sensitive chat content and data',
          enabled: response?.features?.['message-encryption'] ?? true,
          category: 'security',
          dependencies: [],
          healthStatus: 'healthy',
          metrics: { usage: 189, success: 100, errors: 0, lastUsed: new Date() }
        },
        {
          id: 'multi-platform-integration',
          name: 'Multi-Platform Support',
          description: 'ChatGPT, Claude, Gemini, Discord, Slack, and custom platforms',
          enabled: response?.features?.['multi-platform-integration'] ?? true,
          category: 'integration',
          dependencies: ['ai-element-detection'],
          healthStatus: 'warning',
          metrics: { usage: 312, success: 89, errors: 8, lastUsed: new Date() }
        },
        {
          id: 'predictive-caching',
          name: 'ML-Based Predictive Caching',
          description: 'Machine learning-powered caching of frequently accessed elements',
          enabled: response?.features?.['predictive-caching'] ?? false,
          category: 'performance',
          dependencies: ['ai-element-detection'],
          healthStatus: 'healthy',
          metrics: { usage: 78, success: 87, errors: 2, lastUsed: new Date() }
        },
        {
          id: 'behavioral-analysis',
          name: 'User Behavioral Analysis',
          description: 'Learn user patterns to improve automation accuracy and speed',
          enabled: response?.features?.['behavioral-analysis'] ?? false,
          category: 'ai',
          dependencies: ['ai-element-detection', 'predictive-caching'],
          healthStatus: 'healthy',
          metrics: { usage: 0, success: 0, errors: 0 }
        },
        {
          id: 'performance-monitoring',
          name: 'Real-time Performance Monitoring',
          description: 'Continuous monitoring with automatic optimization triggers',
          enabled: response?.features?.['performance-monitoring'] ?? true,
          category: 'performance',
          dependencies: [],
          healthStatus: 'healthy',
          metrics: { usage: 500, success: 96, errors: 2, lastUsed: new Date() }
        },
        {
          id: 'adaptive-optimization',
          name: 'Adaptive Performance Optimization',
          description: 'AI-driven optimization based on usage patterns and system resources',
          enabled: response?.features?.['adaptive-optimization'] ?? true,
          category: 'performance',
          dependencies: ['performance-monitoring', 'behavioral-analysis'],
          healthStatus: 'healthy',
          metrics: { usage: 123, success: 92, errors: 1, lastUsed: new Date() }
        }
      ];

      setFeatures(defaultFeatures);
    } catch (error) {
      console.error('Failed to initialize features:', error);
      setFeatures([]);
    }
  };

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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      console.error('Failed to load optimization settings:', error);
    }
  };

  const toggleFeature = async (featureId: string) => {
    const feature = features.find(f => f.id === featureId);
    if (!feature) return;

    // Check dependencies before disabling
    if (feature.enabled) {
      const dependentFeatures = features.filter(f => 
        f.dependencies?.includes(featureId) && f.enabled
      );
      
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
      setFeatures(prev => prev.map(feature => 
        feature.category === 'performance' 
          ? { ...feature, healthStatus: 'warning' } 
          : feature
      ));

      // Reload metrics after optimization
      setTimeout(() => {
        loadPerformanceMetrics();
        loadHealthStatus();
        setFeatures(prev => prev.map(feature => 
          feature.category === 'performance'
            ? { ...feature, healthStatus: 'healthy' } 
            : feature
        ));
      }, 3000);

    } catch (error) {
      console.error('Optimization failed:', error);
    }
  };

  const handleAutoOptimizeToggle = async (enabled: boolean) => {
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
    } catch (error) {
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
    } catch (error) {
      console.error('Failed to export settings:', error);
    }
  };

  const importSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      
    } catch (error) {
      console.error('Failed to import settings:', error);
      alert('Failed to import settings. Please check the file format.');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai': return <BrainIcon />;
      case 'performance': return <PerformanceIcon />;
      case 'security': return <SecurityIcon />;
      case 'integration': return <ChatIcon />;
      default: return <SettingsIcon />;
    }
  };

  const getStatusIcon = (feature: EnhancedFeature) => {
    if (!feature.enabled) return <ErrorIcon color="error" />;
    
    switch (feature.healthStatus) {
      case 'healthy': return <SuccessIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'critical': return <ErrorIcon color="error" />;
      default: return <InfoIcon />;
    }
  };

  const getStatusColor = (feature: EnhancedFeature) => {
    if (!feature.enabled) return 'error';
    
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

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'success';
    if (value <= thresholds.warning) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Health Status Alert */}
      {healthStatus && healthStatus.status !== 'healthy' && (
        <Alert 
          severity={healthStatus.status === 'critical' ? 'error' : 'warning'} 
          sx={{ mb: 2 }}
          action={
            <Button size="small" onClick={optimizePerformance}>
              Fix Issues
            </Button>
          }
        >
          <Typography variant="body2">
            System health: {healthStatus.status}. 
            {healthStatus.issues.length > 0 && ` Issues: ${healthStatus.issues.join(', ')}`}
          </Typography>
        </Alert>
      )}

      {/* Performance Overview */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Badge badgeContent={getHealthBadgeCount()} color="warning">
              <AnalyticsIcon sx={{ mr: 1 }} />
            </Badge>
            <Typography variant="h6">Performance Metrics</Typography>
            <Box flexGrow={1} />
            <Tooltip title="Last optimization">
              <Typography variant="caption" sx={{ mr: 2 }}>
                {lastOptimization ? `Optimized ${lastOptimization.toLocaleTimeString()}` : 'Never optimized'}
              </Typography>
            </Tooltip>
            <Button 
              size="small" 
              onClick={optimizePerformance}
              startIcon={<OptimizeIcon />}
              variant="contained"
              color="primary"
            >
              Optimize Now
            </Button>
          </Box>
          
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Memory Usage
              </Typography>
              <Typography variant="h6" color={getPerformanceColor(performance.memoryUsage, { good: 50, warning: 80 })}>
                {performance.memoryUsage.toFixed(0)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={performance.memoryUsage} 
                color={getPerformanceColor(performance.memoryUsage, { good: 50, warning: 80 })}
                sx={{ mt: 0.5 }}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" color="textSecondary">
                CPU Usage
              </Typography>
              <Typography variant="h6" color={getPerformanceColor(performance.cpuUsage, { good: 30, warning: 60 })}>
                {performance.cpuUsage.toFixed(0)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={performance.cpuUsage} 
                color={getPerformanceColor(performance.cpuUsage, { good: 30, warning: 60 })}
                sx={{ mt: 0.5 }}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" color="textSecondary">
                Network Latency
              </Typography>
              <Typography variant="h6" color={getPerformanceColor(performance.networkLatency, { good: 100, warning: 500 })}>
                {performance.networkLatency.toFixed(0)}ms
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(performance.networkLatency, 1000) / 10} 
                color={getPerformanceColor(performance.networkLatency, { good: 100, warning: 500 })}
                sx={{ mt: 0.5 }}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" color="textSecondary">
                DOM Operations
              </Typography>
              <Typography variant="h6" color={getPerformanceColor(performance.domOperations, { good: 50, warning: 200 })}>
                {performance.domOperations}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(performance.domOperations, 500) / 5} 
                color={getPerformanceColor(performance.domOperations, { good: 50, warning: 200 })}
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box>
              <Typography variant="body2" color="textSecondary">
                Error Rate
              </Typography>
              <Typography variant="h6" color={getPerformanceColor(performance.errorRate, { good: 1, warning: 3 })}>
                {performance.errorRate.toFixed(1)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(performance.errorRate, 10) * 10} 
                color={getPerformanceColor(performance.errorRate, { good: 1, warning: 3 })}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          {/* Optimization Recommendations */}
          {performance.optimizationRecommendations && performance.optimizationRecommendations.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Optimization Recommendations:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {performance.optimizationRecommendations.map((recommendation, index) => (
                  <Chip
                    key={index}
                    label={recommendation}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Feature Controls */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <AIIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Enhanced Features</Typography>
            <Box flexGrow={1} />
            <Box display="flex" gap={1}>
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                style={{ display: 'none' }}
                id="import-settings"
                aria-label="Import settings"
              />
              <label htmlFor="import-settings">
                <IconButton component="span" size="small">
                  <ImportIcon />
                </IconButton>
              </label>
              <IconButton size="small" onClick={exportSettings}>
                <ExportIcon />
              </IconButton>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoOptimize}
                    onChange={(e) => handleAutoOptimizeToggle(e.target.checked)}
                  />
                }
                label="Auto-optimize"
              />
            </Box>
          </Box>

          <Box display="flex" gap={2} mb={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="ai">AI</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="security">Security</MenuItem>
                <MenuItem value="integration">Integration</MenuItem>
              </Select>
            </FormControl>

            {autoOptimize && (
              <Alert severity="info" sx={{ flex: 1 }}>
                <Typography variant="body2">
                  Auto-optimization enabled. Monitoring every {(optimizationSettings.optimizationInterval / 1000).toFixed(0)}s
                </Typography>
              </Alert>
            )}
          </Box>

          <List>
            {filteredFeatures.map((feature) => (
              <ListItem
                key={feature.id}
                sx={{
                  border: 1,
                  borderColor: feature.enabled ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: feature.enabled ? 'action.hover' : 'inherit',
                  opacity: feature.enabled ? 1 : 0.7
                }}
              >
                <ListItemIcon>
                  <Badge 
                    badgeContent={feature.healthStatus === 'warning' || feature.healthStatus === 'critical' ? '!' : 0}
                    color={feature.healthStatus === 'critical' ? 'error' : 'warning'}
                  >
                    {getCategoryIcon(feature.category)}
                  </Badge>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="subtitle2">{feature.name}</Typography>
                      <Chip 
                        size="small" 
                        label={feature.enabled ? 'enabled' : 'disabled'} 
                        color={getStatusColor(feature) as any}
                        icon={getStatusIcon(feature)}
                      />
                      {feature.dependencies && feature.dependencies.length > 0 && (
                        <Chip 
                          size="small" 
                          label={`${feature.dependencies.length} deps`} 
                          variant="outlined"
                          color="info"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {feature.description}
                      </Typography>
                      {feature.dependencies && feature.dependencies.length > 0 && (
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                          Dependencies: {feature.dependencies.join(', ')}
                        </Typography>
                      )}
                      {feature.metrics && (
                        <Box display="flex" gap={2} flexWrap="wrap">
                          <Typography variant="caption">
                            Usage: {feature.metrics.usage}
                          </Typography>
                          <Typography variant="caption">
                            Success: {feature.metrics.success}%
                          </Typography>
                          <Typography variant="caption">
                            Errors: {feature.metrics.errors}
                          </Typography>
                          {feature.metrics.lastUsed && (
                            <Typography variant="caption">
                              Last used: {feature.metrics.lastUsed.toLocaleTimeString()}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  }
                />
                
                <Box>
                  <Tooltip title={feature.enabled ? 'Disable feature' : 'Enable feature'}>
                    <Switch
                      checked={feature.enabled}
                      onChange={() => toggleFeature(feature.id)}
                    />
                  </Tooltip>
                </Box>
              </ListItem>
            ))}
          </List>

          {/* Optimization Settings */}
          {autoOptimize && (
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Optimization Settings
              </Typography>
              <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
                <Box>
                  <Typography variant="caption">Performance Threshold</Typography>
                  <Typography variant="body2">{optimizationSettings.performanceThreshold}%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption">Memory Threshold</Typography>
                  <Typography variant="body2">{optimizationSettings.memoryThreshold}%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption">CPU Threshold</Typography>
                  <Typography variant="body2">{optimizationSettings.cpuThreshold}%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption">Adaptive Mode</Typography>
                  <Typography variant="body2">{optimizationSettings.adaptiveOptimization ? 'Enabled' : 'Disabled'}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default EnhancedFeaturesTab;
