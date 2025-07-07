import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Grid,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  AutoAwesome as AutoAwesomeIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  VolumeUp as VolumeUpIcon,
  Keyboard as KeyboardIcon,
  Language as LanguageIcon,
  CloudSync as CloudSyncIcon,
  Analytics as AnalyticsIcon,
  Psychology as PsychologyIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

interface EnhancedFeaturesPanelProps {
  isMainApp?: boolean;
}

const EnhancedFeaturesPanel: React.FC<EnhancedFeaturesPanelProps> = ({
  isMainApp = true,
}) => {
  // Enhanced Features State
  const [features, setFeatures] = useState({
    aiAssistant: true,
    smartSuggestions: false,
    autoComplete: true,
    voiceCommands: false,
    gestureControls: false,
    smartSync: true,
    advancedAnalytics: false,
    contextAware: true,
    predictiveText: false,
    intelligentRouting: true,
  });

  // Performance Settings
  const [performance, setPerformance] = useState({
    processingSpeed: 75,
    memoryOptimization: 80,
    batchSize: 50,
    cacheLevel: 60,
  });

  // Personalization Settings
  const [personalization, setPersonalization] = useState({
    theme: "auto",
    language: "en",
    notifications: true,
    soundEffects: false,
    animations: true,
    compactMode: false,
  });

  // Status messages
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");

  // Helper function to add status messages
  const addStatus = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) => {
    setStatus(message);
    setStatusType(type);
    setTimeout(() => setStatus(""), 3000);
  };

  // Handle feature toggle
  const handleFeatureToggle = (feature: keyof typeof features) => {
    setFeatures((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
    addStatus(
      `${feature} ${!features[feature] ? "enabled" : "disabled"}`,
      "success",
    );
  };

  // Handle performance change
  const handlePerformanceChange = (
    setting: keyof typeof performance,
    value: number,
  ) => {
    setPerformance((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  // Handle personalization change
  const handlePersonalizationChange = (
    setting: keyof typeof personalization,
    value: any,
  ) => {
    setPersonalization((prev) => ({
      ...prev,
      [setting]: value,
    }));
    addStatus(`${setting} updated`, "success");
  };

  // Save settings
  const saveSettings = () => {
    // Here you would save to chrome.storage or your app's state management
    addStatus("Settings saved successfully", "success");
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setFeatures({
      aiAssistant: true,
      smartSuggestions: false,
      autoComplete: true,
      voiceCommands: false,
      gestureControls: false,
      smartSync: true,
      advancedAnalytics: false,
      contextAware: true,
      predictiveText: false,
      intelligentRouting: true,
    });
    setPerformance({
      processingSpeed: 75,
      memoryOptimization: 80,
      batchSize: 50,
      cacheLevel: 60,
    });
    setPersonalization({
      theme: "auto",
      language: "en",
      notifications: true,
      soundEffects: false,
      animations: true,
      compactMode: false,
    });
    addStatus("Settings reset to defaults", "info");
  };

  const featureList = [
    {
      key: "aiAssistant",
      label: "AI Assistant",
      icon: <PsychologyIcon />,
      description: "Intelligent assistance and recommendations",
    },
    {
      key: "smartSuggestions",
      label: "Smart Suggestions",
      icon: <AutoAwesomeIcon />,
      description: "Context-aware suggestions",
    },
    {
      key: "autoComplete",
      label: "Auto Complete",
      icon: <KeyboardIcon />,
      description: "Predictive text completion",
    },
    {
      key: "voiceCommands",
      label: "Voice Commands",
      icon: <VolumeUpIcon />,
      description: "Voice-activated controls",
    },
    {
      key: "gestureControls",
      label: "Gesture Controls",
      icon: <SpeedIcon />,
      description: "Touch and gesture navigation",
    },
    {
      key: "smartSync",
      label: "Smart Sync",
      icon: <CloudSyncIcon />,
      description: "Intelligent data synchronization",
    },
    {
      key: "advancedAnalytics",
      label: "Advanced Analytics",
      icon: <AnalyticsIcon />,
      description: "Detailed usage analytics",
    },
    {
      key: "contextAware",
      label: "Context Awareness",
      icon: <SecurityIcon />,
      description: "Context-sensitive features",
    },
    {
      key: "predictiveText",
      label: "Predictive Text",
      icon: <LanguageIcon />,
      description: "Smart text prediction",
    },
    {
      key: "intelligentRouting",
      label: "Intelligent Routing",
      icon: <SpeedIcon />,
      description: "Optimized request routing",
    },
  ];

  return (
    <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
      {/* Status Alert */}
      {status && (
        <Alert
          severity={statusType}
          sx={{ mb: 2 }}
          onClose={() => setStatus("")}
        >
          {status}
        </Alert>
      )}

      {/* Enhanced Features */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <AutoAwesomeIcon />
            Enhanced Features
          </Typography>

          <List dense>
            {featureList.map((feature) => (
              <ListItem key={feature.key} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {feature.icon}
                </ListItemIcon>
                <ListItemText
                  primary={feature.label}
                  secondary={feature.description}
                  primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
                <Switch
                  checked={features[feature.key as keyof typeof features]}
                  onChange={() =>
                    handleFeatureToggle(feature.key as keyof typeof features)
                  }
                  size="small"
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <SpeedIcon />
            Performance Settings
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Processing Speed: {performance.processingSpeed}%
              </Typography>
              <Slider
                value={performance.processingSpeed}
                onChange={(_, value) =>
                  handlePerformanceChange("processingSpeed", value as number)
                }
                min={10}
                max={100}
                step={5}
                marks
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Memory Optimization: {performance.memoryOptimization}%
              </Typography>
              <Slider
                value={performance.memoryOptimization}
                onChange={(_, value) =>
                  handlePerformanceChange("memoryOptimization", value as number)
                }
                min={10}
                max={100}
                step={5}
                marks
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Batch Size: {performance.batchSize}
              </Typography>
              <Slider
                value={performance.batchSize}
                onChange={(_, value) =>
                  handlePerformanceChange("batchSize", value as number)
                }
                min={10}
                max={100}
                step={10}
                marks
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Cache Level: {performance.cacheLevel}%
              </Typography>
              <Slider
                value={performance.cacheLevel}
                onChange={(_, value) =>
                  handlePerformanceChange("cacheLevel", value as number)
                }
                min={0}
                max={100}
                step={10}
                marks
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Personalization */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <PaletteIcon />
            Personalization
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Theme</InputLabel>
                <Select
                  value={personalization.theme}
                  label="Theme"
                  onChange={(e) =>
                    handlePersonalizationChange("theme", e.target.value)
                  }
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="auto">Auto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Language</InputLabel>
                <Select
                  value={personalization.language}
                  label="Language"
                  onChange={(e) =>
                    handlePersonalizationChange("language", e.target.value)
                  }
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                  <MenuItem value="zh">Chinese</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={personalization.notifications}
                      onChange={(e) =>
                        handlePersonalizationChange(
                          "notifications",
                          e.target.checked,
                        )
                      }
                      size="small"
                    />
                  }
                  label="Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={personalization.soundEffects}
                      onChange={(e) =>
                        handlePersonalizationChange(
                          "soundEffects",
                          e.target.checked,
                        )
                      }
                      size="small"
                    />
                  }
                  label="Sound Effects"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={personalization.animations}
                      onChange={(e) =>
                        handlePersonalizationChange(
                          "animations",
                          e.target.checked,
                        )
                      }
                      size="small"
                    />
                  }
                  label="Animations"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={personalization.compactMode}
                      onChange={(e) =>
                        handlePersonalizationChange(
                          "compactMode",
                          e.target.checked,
                        )
                      }
                      size="small"
                    />
                  }
                  label="Compact Mode"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Status
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            <Chip
              label={`${Object.values(features).filter(Boolean).length}/${Object.keys(features).length} Features Active`}
              color="primary"
              size="small"
            />
            <Chip
              label={`Performance: ${Math.round(Object.values(performance).reduce((a, b) => a + b, 0) / Object.keys(performance).length)}%`}
              color="success"
              size="small"
            />
            <Chip
              label={`Theme: ${personalization.theme}`}
              color="info"
              size="small"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={saveSettings}
              startIcon={<SettingsIcon />}
            >
              Save Settings
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={resetToDefaults}
              startIcon={<RefreshIcon />}
            >
              Reset to Defaults
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EnhancedFeaturesPanel;
