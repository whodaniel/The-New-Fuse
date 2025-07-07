import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  CssBaseline,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  Switch,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Tooltip,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Badge,
  Menu,
  MenuItem,
  ThemeProvider,
} from "@mui/material";
import { createUnifiedTheme } from "../../../themes/chromeExtensionTheme";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import BugReportIcon from "@mui/icons-material/BugReport";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import HelpIcon from "@mui/icons-material/Help";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LanguageIcon from "@mui/icons-material/Language";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BuildIcon from "@mui/icons-material/Build";
import MonitorIcon from "@mui/icons-material/Monitor";
import HistoryIcon from "@mui/icons-material/History";
import CodeIcon from "@mui/icons-material/Code";
import StorageIcon from "@mui/icons-material/Storage";
import SecurityIcon from "@mui/icons-material/Security";
import SpeedIcon from "@mui/icons-material/Speed";

// Import tab components
import CommunicationPanel from "./CommunicationPanel";
import WebIntegrationPanel from "./WebIntegrationPanel";
import EnhancedFeaturesPanel from "./EnhancedFeaturesPanel";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`popup-tabpanel-${index}`}
      aria-labelledby={`popup-tab-${index}`}
      {...other}
      style={{ height: "100%", overflowY: "auto" }}
    >
      {value === index && <Box sx={{ p: 2, height: "100%" }}>{children}</Box>}
    </div>
  );
}

export interface PopupContainerProps {
  /** Whether this is being used in the main app (true) or as chrome extension (false) */
  isMainApp?: boolean;
  /** Initial dark mode state */
  initialDarkMode?: boolean;
  /** Callback when theme changes */
  onThemeChange?: (isDarkMode: boolean) => void;
  /** Additional styling for container */
  containerSx?: any;
}

const PopupContainer: React.FC<PopupContainerProps> = ({
  isMainApp = true,
  initialDarkMode = false,
  onThemeChange,
  containerSx = {},
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(initialDarkMode);
  const [loading, setLoading] = useState(false);

  const theme = createUnifiedTheme(isDarkMode);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleThemeToggle = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (onThemeChange) {
      onThemeChange(newMode);
    }
  };

  const tabs = [
    {
      label: "Communication",
      icon: <DashboardIcon />,
      component: <CommunicationPanel isMainApp={isMainApp} />,
    },
    {
      label: "Web Integration",
      icon: <LanguageIcon />,
      component: <WebIntegrationPanel isMainApp={isMainApp} />,
    },
    {
      label: "Enhanced Features",
      icon: <AutoAwesomeIcon />,
      component: <EnhancedFeaturesPanel isMainApp={isMainApp} />,
    },
    {
      label: "Tools",
      icon: <BuildIcon />,
      component: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Development Tools
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <MonitorIcon sx={{ mb: 1 }} />
                  <Typography variant="h6">System Monitor</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitor system performance and health
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <CodeIcon sx={{ mb: 1 }} />
                  <Typography variant="h6">Debug Console</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Access debugging tools and logs
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ),
    },
  ];

  const containerStyles = {
    width: isMainApp ? "100%" : 420,
    height: isMainApp ? "100%" : 620,
    maxHeight: isMainApp ? "none" : "90vh",
    display: "flex",
    flexDirection: "column",
    bgcolor: "background.default",
    borderRadius: isMainApp ? 2 : 0,
    overflow: "hidden",
    ...containerSx,
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={containerStyles}>
        {/* Header */}
        <Box
          sx={{
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1,
          }}
        >
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            The New Fuse
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip
              title={
                isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
              }
            >
              <IconButton onClick={handleThemeToggle} size="small">
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton size="small">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 48 }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{ minHeight: 48, textTransform: "none" }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
          {tabs.map((tab, index) => (
            <TabPanel key={index} value={activeTab} index={index}>
              {tab.component}
            </TabPanel>
          ))}
        </Box>

        {/* Footer Status */}
        <Box
          sx={{
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Chip size="small" label="Ready" color="success" variant="outlined" />
          <Typography variant="caption" color="text.secondary">
            v2.0.0 {isMainApp ? "(Integrated)" : "(Extension)"}
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default PopupContainer;
