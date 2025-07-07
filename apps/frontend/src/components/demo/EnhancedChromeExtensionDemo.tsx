import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { createUnifiedTheme } from "../../themes/chromeExtensionTheme";
import { PopupContainer } from "../ui/popup";
import ExtensionIcon from "@mui/icons-material/Extension";
import CloseIcon from "@mui/icons-material/Close";
import LaunchIcon from "@mui/icons-material/Launch";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EnhancedChromeExtensionDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const theme = createUnifiedTheme(isDarkMode);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleThemeChange = (darkMode: boolean) => {
    setIsDarkMode(darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        {/* Header */}
        <Card
          sx={{
            mb: 3,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <ExtensionIcon sx={{ fontSize: 40, color: "white" }} />
                <Box>
                  <Typography
                    variant="h4"
                    sx={{ color: "white", fontWeight: 600 }}
                  >
                    Chrome Extension UI Integration
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ color: "rgba(255,255,255,0.9)" }}
                  >
                    Successfully recovered and integrated UI components from
                    GitHub repository
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip
                  label="✅ Recovered"
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                />
                <Chip
                  label="🔄 Integrated"
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                />
                <Chip
                  label="🚀 Enhanced"
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            ✅ Chrome Extension UI Successfully Integrated!
          </Typography>
          <Typography variant="body2">
            All UI components from the GitHub repository have been recovered and
            merged with your local enhanced features. No functionality has been
            lost in the process.
          </Typography>
        </Alert>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab icon={<LaunchIcon />} label="Live Demo" iconPosition="start" />
            <Tab
              icon={<CompareArrowsIcon />}
              label="Integration Comparison"
              iconPosition="start"
            />
            <Tab
              icon={<IntegrationInstructionsIcon />}
              label="Technical Details"
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          {/* Live Demo */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🎯 Interactive Chrome Extension UI
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This is the actual Chrome extension interface recovered from
                    your GitHub repository, now fully integrated into your main
                    application with all enhanced features preserved.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setShowPopup(true)}
                    startIcon={<ExtensionIcon />}
                    sx={{ mr: 1, mb: 1 }}
                  >
                    Open Extension Interface
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    sx={{ mb: 1 }}
                  >
                    Toggle Theme
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🔧 Enhanced Features Preserved
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}
                  >
                    <Chip label="A2A Protocol" color="primary" size="small" />
                    <Chip
                      label="Multi-Agent Chat"
                      color="primary"
                      size="small"
                    />
                    <Chip
                      label="Workflow Builder"
                      color="primary"
                      size="small"
                    />
                    <Chip
                      label="Performance Monitor"
                      color="primary"
                      size="small"
                    />
                    <Chip
                      label="Enhanced Analytics"
                      color="primary"
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    All your local enhancements remain fully functional and have
                    been seamlessly integrated with the recovered Chrome
                    extension UI components.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Integration Comparison */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error">
                    ❌ What Was Lost (Before Recovery)
                  </Typography>
                  <ul>
                    <li>Material-UI based Chrome extension popup interface</li>
                    <li>Professional tabbed navigation system</li>
                    <li>WebSocket connection management UI</li>
                    <li>Web integration controls</li>
                    <li>Enhanced features configuration panel</li>
                    <li>Sophisticated theming system</li>
                    <li>Floating panel system for web pages</li>
                  </ul>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="success.main">
                    ✅ What Has Been Recovered & Enhanced
                  </Typography>
                  <ul>
                    <li>✅ Complete Material-UI popup interface</li>
                    <li>✅ Enhanced tabbed navigation with local features</li>
                    <li>✅ Advanced WebSocket management + A2A protocol</li>
                    <li>✅ Web integration + multi-agent capabilities</li>
                    <li>✅ Enhanced features + local improvements</li>
                    <li>✅ Unified theming system</li>
                    <li>✅ Integrated floating panel + workflow system</li>
                    <li>🚀 PLUS: All local enhancements preserved!</li>
                  </ul>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* Technical Details */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🛠️ Integration Process
                  </Typography>
                  <ol>
                    <li>
                      <strong>Recovery:</strong> Used git commands to retrieve
                      chrome-extension files from GitHub
                    </li>
                    <li>
                      <strong>Analysis:</strong> Analyzed both GitHub version
                      and local enhancements
                    </li>
                    <li>
                      <strong>Theme Integration:</strong> Created unified
                      Material-UI theme system
                    </li>
                    <li>
                      <strong>Component Migration:</strong> Migrated popup
                      components to main app
                    </li>
                    <li>
                      <strong>Feature Preservation:</strong> Ensured all local
                      features remain functional
                    </li>
                    <li>
                      <strong>Enhancement:</strong> Added new capabilities to
                      recovered components
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📁 New File Structure
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: "background.default",
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                    }}
                  >
                    {`apps/frontend/src/
├── themes/
│   └── chromeExtensionTheme.ts
├── components/
│   ├── ui/popup/
│   │   ├── PopupContainer.tsx
│   │   ├── CommunicationPanel.tsx
│   │   ├── WebIntegrationPanel.tsx
│   │   └── EnhancedFeaturesPanel.tsx
│   └── demo/
│       └── ChromeExtensionDemo.tsx
└── chrome-extension/ (recovered)
    └── src/popup/components/`}
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Floating Popup Demo */}
        {showPopup && (
          <Box
            sx={{
              position: "fixed",
              top: 20,
              right: 20,
              zIndex: 9999,
              boxShadow: 8,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 10000,
              }}
            >
              <Tooltip title="Close Demo">
                <IconButton
                  size="small"
                  onClick={() => setShowPopup(false)}
                  sx={{
                    bgcolor: "rgba(0,0,0,0.5)",
                    color: "white",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <PopupContainer
              isMainApp={true}
              initialDarkMode={isDarkMode}
              onThemeChange={handleThemeChange}
              containerSx={{
                width: 420,
                height: 620,
                maxHeight: "90vh",
              }}
            />
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default EnhancedChromeExtensionDemo;
