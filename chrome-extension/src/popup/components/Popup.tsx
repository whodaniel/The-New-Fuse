import React, { useEffect, useState } from 'react';
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
  MenuItem
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '../../styles/theme';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useStore } from '../../utils/store'; // Import useStore
import LightModeIcon from '@mui/icons-material/LightMode';
import BugReportIcon from '@mui/icons-material/BugReport';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { CONFIG } from '../../config';
import HelpIcon from '@mui/icons-material/Help';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LanguageIcon from '@mui/icons-material/Language'; // For Web Integration
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // For Enhanced Features
import BuildIcon from '@mui/icons-material/Build'; // For Tools tab
import MonitorIcon from '@mui/icons-material/Monitor';
import HistoryIcon from '@mui/icons-material/History';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ClearIcon from '@mui/icons-material/Clear';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import NotificationsIcon from '@mui/icons-material/Notifications';
import TuneIcon from '@mui/icons-material/Tune';

import { ConnectionStatusMessage } from '../../shared-protocol';
import ErrorBoundary from './ErrorBoundary';
import EnhancedFeaturesTab from './EnhancedFeaturesTab';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ height: '100%', overflowY: 'auto' }}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}


const Popup: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusMessage['payload']>({
    status: 'uninitialized',
    message: 'Initializing connection...'
  });
  const [settings, setSettings] = useState({
    port: CONFIG.WS_PORT,
    autoReconnect: true,
    debugMode: false,
    darkMode: false
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [chatInputSelector, setChatInputSelector] = useState('');
  const [chatOutputSelector, setChatOutputSelector] = useState('');
  const [sendButtonSelector, setSendButtonSelector] = useState('');
  const [textToSendInput, setTextToSendInput] = useState(''); // For "Send to Page"
  const [capturedOutputDisplay, setCapturedOutputDisplay] = useState(''); // For "Capture Output"
  const [webInteractionStatus, setWebInteractionStatus] = useState(''); // For status/errors
  const [webInteractionStatusType, setWebInteractionStatusType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // New state for enhanced UI controls
  const [performanceStats, setPerformanceStats] = useState({
    memoryUsage: 0,
    cpuUsage: 0,
    networkStatus: 'unknown'
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [connectionHistory, setConnectionHistory] = useState<Array<{timestamp: string, status: string, message: string}>>([]);
  const [extensionLogs, setExtensionLogs] = useState<Array<{timestamp: string, level: string, message: string}>>([]);
  const [notifications, setNotifications] = useState(true);
  const [autoCapture, setAutoCapture] = useState(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);


  useEffect(() => {
    // Load settings
    chrome.storage.local.get(['connectionSettings', 'webIntegrationSettings'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading settings:', chrome.runtime.lastError.message);
        setWebInteractionStatus(`Failed to load settings: ${chrome.runtime.lastError.message}`);
        setWebInteractionStatusType('error');
        // Keep default settings if loading fails
        // Still hydrate with default if settings load fails, so Zustand is in sync with Popup's initial state
        useStore.getState().hydrateDarkMode(settings.darkMode);
        return;
      }

      if (result.connectionSettings) {
        const loadedDarkMode = !!result.connectionSettings.darkMode;
        setSettings(prev => ({
          ...prev,
          port: result.connectionSettings.wsPort || CONFIG.WS_PORT,
          autoReconnect: result.connectionSettings.autoConnect !== false,
          debugMode: !!result.connectionSettings.debug,
          darkMode: loadedDarkMode // This is Popup.tsx's local React state for the theme
        }));
        useStore.getState().hydrateDarkMode(loadedDarkMode); // Hydrate Zustand store
      } else {
        // If no connectionSettings found, hydrate Zustand with its own initial default
        // or the default from Popup.tsx's initial settings state.
        useStore.getState().hydrateDarkMode(settings.darkMode);
      }
      if (result.webIntegrationSettings) {
        setChatInputSelector(result.webIntegrationSettings.chatInputSelector || '');
        setChatOutputSelector(result.webIntegrationSettings.chatOutputSelector || '');
        setSendButtonSelector(result.webIntegrationSettings.sendButtonSelector || '');
      }
    });

    // Listen for various runtime messages
    const handleRuntimeMessages = (
      message: any // Using 'any' for now as payload structure varies significantly
    ) => {
      if (!message || !message.type) {
        console.warn('Received malformed message:', message);
        return;
      }

      switch (message.type) {
        case 'CONNECTION_STATUS':
          setConnectionStatus(message.payload);
          break;
        case 'PAGE_OUTPUT_CAPTURED': // Response from content script after CAPTURE_PAGE_OUTPUT
          if (message.success) { // Content script sends { success: true, type: 'PAGE_OUTPUT_CAPTURED', text }
            setCapturedOutputDisplay(message.text || 'No text found.');
            setWebInteractionStatus('Output captured successfully.');
            setWebInteractionStatusType('success');
          } else {
            setWebInteractionStatus(`Error capturing output: ${message.error}`);
            setWebInteractionStatusType('error');
            setCapturedOutputDisplay('');
          }
          break;
        case 'SENT_TO_PAGE_CONFIRMED':
          if (message.success) {
            setWebInteractionStatus('Text sent to page successfully.');
            setWebInteractionStatusType('success');
          } else {
            setWebInteractionStatus(`Error sending to page: ${message.error}`);
            setWebInteractionStatusType('error');
          }
          break;
        case 'CONTENT_SCRIPT_ERROR':
          setWebInteractionStatus(`Content Script Error: ${message.payload?.error || 'Unknown content script error'}`);
          setWebInteractionStatusType('error');
          break;
        case 'INJECT_SCRIPT_RESPONSE':
          if (message.payload?.success) {
            setWebInteractionStatus(message.payload.message || 'Script communication established.');
            setWebInteractionStatusType('info');
          } else {
            setWebInteractionStatus(`Error with script injection/communication: ${message.payload?.error || 'Unknown injection error'}`);
            setWebInteractionStatusType('error');
          }
          break;
        default:
          // console.warn('Received unknown message type in popup via runtime.onMessage:', message.type);
          break;
      }
    };

    chrome.runtime.onMessage.addListener(handleRuntimeMessages);

    // Request current status
    console.log('Popup: Sending GET_CONNECTION_STATUS message');
    chrome.runtime.sendMessage({ type: 'GET_CONNECTION_STATUS' });

    return () => {
      chrome.runtime.onMessage.removeListener(handleRuntimeMessages);
    };
  }, []);

  useEffect(() => {
    // Setup auto-reconnect if enabled
    if (settings.autoReconnect &&
        connectionStatus.status !== 'connected' &&
        connectionStatus.status !== 'connecting') {
      const reconnectTimer = setInterval(handleReconnect, 30000); // Try every 30 seconds
      return () => clearInterval(reconnectTimer);
    }
  }, [settings.autoReconnect, connectionStatus.status]);


  const handleReconnect = () => {
    console.log('Popup: Sending RECONNECT message');
    chrome.runtime.sendMessage({ type: 'RECONNECT' });
  };

  const handleSaveWebSelectors = async () => {
    setLoading(true);
    try {
      const newWebIntegrationSettings = {
        chatInputSelector,
        chatOutputSelector,
        sendButtonSelector
      };
      chrome.storage.local.set({ webIntegrationSettings: newWebIntegrationSettings }, () => {
        setLoading(false);
        if (chrome.runtime.lastError) {
          console.error('Failed to save web integration settings:', chrome.runtime.lastError.message);
          setWebInteractionStatus(`Failed to save web selectors: ${chrome.runtime.lastError.message}`);
          setWebInteractionStatusType('error');
        } else {
          setActiveTab(0); // Switch to Dashboard tab after saving
          setWebInteractionStatus('Web selectors saved successfully!');
          setWebInteractionStatusType('success');
        }
      });
    } catch (error: any) { // Catch synchronous errors, though unlikely with chrome.storage.local.set
      console.error('Unexpected error during save web integration settings:', error);
      setWebInteractionStatus(`Unexpected error saving web selectors: ${error.message || 'Unknown error'}`);
      setWebInteractionStatusType('error');
      setLoading(false);
    }
  };

  const handleSaveConnectionSettings = async () => {
    setLoading(true);
    try {
      const newConnectionSettings = {
        wsPort: settings.port,
        autoConnect: settings.autoReconnect,
        debug: settings.debugMode,
        darkMode: settings.darkMode
      };
      chrome.storage.local.set({ connectionSettings: newConnectionSettings }, () => {
        setLoading(false);
        if (chrome.runtime.lastError) {
          console.error('Failed to save connection settings:', chrome.runtime.lastError.message);
          setWebInteractionStatus(`Failed to save connection settings: ${chrome.runtime.lastError.message}`);
          setWebInteractionStatusType('error');
        } else {
          // Notify background script of debug mode change
          if (settings.debugMode) {
            console.log('Popup: Sending ENABLE_DEBUG_MODE message');
            chrome.runtime.sendMessage({ type: 'ENABLE_DEBUG_MODE' });
          } else {
            console.log('Popup: Sending DISABLE_DEBUG_MODE message');
            chrome.runtime.sendMessage({ type: 'DISABLE_DEBUG_MODE' });
          }
          setActiveTab(0);
          setWebInteractionStatus('Connection settings saved. Attempting to reconnect...');
          setWebInteractionStatusType('info');
          handleReconnect();
        }
      });
    } catch (error: any) { // Catch synchronous errors
      console.error('Unexpected error during save connection settings:', error);
      setWebInteractionStatus(`Unexpected error saving connection settings: ${error.message || 'Unknown error'}`);
      setWebInteractionStatusType('error');
      setLoading(false);
    }
  };

  const handleToggleTheme = () => {
    const newDarkMode = !settings.darkMode;
    // setSettings(prev => ({ ...prev, darkMode: newDarkMode })); // This updates local React state for UI

    chrome.storage.local.get(['connectionSettings'], (result) => {
        const currentSettings = result.connectionSettings || {
            wsPort: settings.port, // ensure other settings are preserved
            autoConnect: settings.autoReconnect,
            debug: settings.debugMode
            // darkMode will be set by newDarkMode
        };
        const newConnectionSettings = {
          ...currentSettings,
          darkMode: newDarkMode
        };
        chrome.storage.local.set({ connectionSettings: newConnectionSettings }, () => {
            if (chrome.runtime.lastError) {
                console.error('Failed to save dark mode setting:', chrome.runtime.lastError.message);
                setWebInteractionStatus(`Failed to save theme preference: ${chrome.runtime.lastError.message}`);
                setWebInteractionStatusType('error');
                // Potentially revert UI state if save fails
            } else {
                // Successfully saved to storage, now update React state and Zustand state
                setSettings(prev => ({ ...prev, darkMode: newDarkMode }));
                useStore.getState().setDarkMode(newDarkMode); // Update Zustand store
            }
        });
    });
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'debug':
        // Open debug console in a new tab
        chrome.tabs.create({ url: 'chrome-extension://' + chrome.runtime.id + '/debug.html' });
        break;
      case 'shortcuts':
        chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
        break;
      case 'docs':
        // Open documentation in a new tab
        chrome.tabs.create({ url: 'https://github.com/your-repo/docs' });
        break;
      case 'monitor':
        // Toggle performance monitoring
        setPerformanceStats(prev => ({...prev, networkStatus: 'monitoring'}));
        break;
      case 'history':
        // Show connection history
        setActiveTab(3); // Switch to Tools tab
        break;
      case 'restart':
        // Restart extension background script
        chrome.runtime.sendMessage({ type: 'RESTART_BACKGROUND' });
        break;
      case 'export':
        // Export settings and logs
        handleExportData();
        break;
      case 'clear-logs':
        // Clear all logs
        setExtensionLogs([]);
        setConnectionHistory([]);
        break;
      default:
        console.log('Unknown quick action:', action);
    }
  };

  const handleExportData = () => {
    const exportData = {
      settings,
      connectionHistory,
      extensionLogs,
      webSelectors: {
        chatInputSelector,
        chatOutputSelector,
        sendButtonSelector
      },
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: `new-fuse-export-${new Date().toISOString().split('T')[0]}.json`,
      saveAs: true
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        // Import settings
        if (importData.settings) {
          setSettings(prev => ({ ...prev, ...importData.settings }));
        }
        
        // Import selectors
        if (importData.webSelectors) {
          setChatInputSelector(importData.webSelectors.chatInputSelector || '');
          setChatOutputSelector(importData.webSelectors.chatOutputSelector || '');
          setSendButtonSelector(importData.webSelectors.sendButtonSelector || '');
        }
        
        setWebInteractionStatus('Settings imported successfully!');
        setWebInteractionStatusType('success');
      } catch (error) {
        setWebInteractionStatus('Error importing data: Invalid file format');
        setWebInteractionStatusType('error');
      }
    };
    reader.readAsText(file);
  };

  const handleTestSelectors = () => {
    if (!chatInputSelector.trim() && !chatOutputSelector.trim() && !sendButtonSelector.trim()) {
      setWebInteractionStatus('At least one selector must be provided for testing');
      setWebInteractionStatusType('error');
      return;
    }

    setWebInteractionStatus('Testing selectors on current page...');
    setWebInteractionStatusType('info');
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'TEST_SELECTORS',
          payload: {
            chatInputSelector,
            chatOutputSelector,
            sendButtonSelector
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            setWebInteractionStatus(`Error testing selectors: ${chrome.runtime.lastError.message}`);
            setWebInteractionStatusType('error');
            return;
          }
          
          if (response?.success) {
            setWebInteractionStatus(`Selectors tested: ${response.results}`);
            setWebInteractionStatusType('success');
          } else {
            setWebInteractionStatus(`Selector test failed: ${response?.error || 'Unknown error'}`);
            setWebInteractionStatusType('error');
          }
        });
      }
    });
  };

  const handleToggleFloatingPanel = () => {
    setWebInteractionStatus('Toggling floating panel...');
    setWebInteractionStatusType('info');
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'TOGGLE_FLOATING_PANEL'
        }, (response) => {
          if (chrome.runtime.lastError) {
            setWebInteractionStatus(`Error toggling floating panel: ${chrome.runtime.lastError.message}`);
            setWebInteractionStatusType('error');
            return;
          }
          
          if (response?.success) {
            setWebInteractionStatus(response.message || 'Floating panel toggled successfully!');
            setWebInteractionStatusType('success');
          } else {
            setWebInteractionStatus(`Failed to toggle floating panel: ${response?.error || 'Unknown error'}`);
            setWebInteractionStatusType('error');
          }
        });
      } else {
        setWebInteractionStatus('No active tab found to toggle floating panel.');
        setWebInteractionStatusType('error');
      }
    });
  };

  const handleAutoDetectSelectors = () => {
    setWebInteractionStatus('Auto-detecting selectors on current page...');
    setWebInteractionStatusType('info');
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'AUTO_DETECT_SELECTORS'
        }, (response) => {
          if (chrome.runtime.lastError) {
            setWebInteractionStatus(`Error auto-detecting: ${chrome.runtime.lastError.message}`);
            setWebInteractionStatusType('error');
            return;
          }
          
          if (response?.success) {
            if (response.selectors.input) setChatInputSelector(response.selectors.input);
            if (response.selectors.output) setChatOutputSelector(response.selectors.output);
            if (response.selectors.button) setSendButtonSelector(response.selectors.button);
            
            setWebInteractionStatus('Selectors auto-detected and applied!');
            setWebInteractionStatusType('success');
          } else {
            setWebInteractionStatus(`Auto-detection failed: ${response?.error || 'No suitable elements found'}`);
            setWebInteractionStatusType('warning');
          }
        });
      }
    });
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'success.main';
      case 'disconnected':
        return 'error.main';
      case 'connecting':
        return 'warning.main';
      case 'authenticating':
        return 'info.main';
      case 'error':
        return 'error.main';
      default:
        return 'grey.500';
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInjectScript = () => {
    setWebInteractionStatus('Attempting to sync with page...');
    setWebInteractionStatusType('info');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tabId = tabs[0].id;
        console.log('Popup: Sending BG_INJECT_SCRIPT_REQUEST message to background for tab', tabId);
        // Send a message to the background script
        chrome.runtime.sendMessage({
          type: 'BG_INJECT_SCRIPT_REQUEST',
          payload: {
            tabId: tabId,
            chatInputSelector,
            chatOutputSelector,
            sendButtonSelector
          }
        }, response => {
          // The existing response handling logic can be adapted here
          if (chrome.runtime.lastError) {
            setWebInteractionStatus(`Error communicating with background script: ${chrome.runtime.lastError.message}.`);
            setWebInteractionStatusType('error');
            console.error("Error sending BG_INJECT_SCRIPT_REQUEST to background:", chrome.runtime.lastError.message);
            return;
          }
          // Assuming background script sends back a similar response structure
          if (response && response.success) {
            setWebInteractionStatus(response.message || 'Successfully synced with page content script.');
            setWebInteractionStatusType('success');
          } else if (response) {
            setWebInteractionStatus(response.message || 'Failed to sync with page content script after retries.');
            setWebInteractionStatusType(response.isRetrying ? 'warning' : 'error'); // Optional: indicate retrying
          } else {
            setWebInteractionStatus('No response from background script for sync request.');
            setWebInteractionStatusType('error');
          }
        });
      } else {
        setWebInteractionStatus('No active tab found to sync with.');
        setWebInteractionStatusType('error');
      }
    });
  };

  const handleCaptureOutput = () => {
    if (!chatOutputSelector.trim()) {
      setWebInteractionStatus('Chat Output Selector is required to capture output.');
      setWebInteractionStatusType('error');
      return;
    }
    setWebInteractionStatus('Requesting to capture output...');
    setWebInteractionStatusType('info');
    setCapturedOutputDisplay('');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        console.log('Popup: Sending CAPTURE_PAGE_OUTPUT message to tab', tabs[0].id);
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            type: 'CAPTURE_PAGE_OUTPUT',
            payload: { chatOutputSelector: chatOutputSelector }
          },
          (response) => {
            if (chrome.runtime.lastError) {
              setWebInteractionStatus(`Error sending capture request: ${chrome.runtime.lastError.message}. Check console for details.`);
              setWebInteractionStatusType('error');
              console.error("Error sending CAPTURE_PAGE_OUTPUT:", chrome.runtime.lastError.message);
              return;
            }
            // Response with data is handled by the main chrome.runtime.onMessage listener (PAGE_OUTPUT_CAPTURED)
            // This callback can handle immediate send errors or confirmations if the content script replies directly here.
            if (response && !response.success && response.error) {
                setWebInteractionStatus(`Capture request immediately failed: ${response.error}`);
                setWebInteractionStatusType('error');
            }
          }
        );
      } else {
        setWebInteractionStatus('No active tab found to capture output from.');
        setWebInteractionStatusType('error');
      }
    });
  };

  const handleSendToPage = () => {
    if (!chatInputSelector.trim()) {
      setWebInteractionStatus('Chat Input Selector is required to send text.');
      setWebInteractionStatusType('error');
      return;
    }
    if (!sendButtonSelector.trim()) {
      setWebInteractionStatus('Send Button Selector is required to send text.');
      setWebInteractionStatusType('error');
      return;
    }
    if (!textToSendInput.trim()) {
        setWebInteractionStatus('Text to send cannot be empty.');
        setWebInteractionStatusType('error');
        return;
    }
    setWebInteractionStatus('Requesting to send text to page...');
    setWebInteractionStatusType('info');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        console.log('Popup: Sending SEND_TO_PAGE_INPUT message to tab', tabs[0].id);
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            type: 'SEND_TO_PAGE_INPUT',
            payload: {
              chatInputSelector: chatInputSelector,
              sendButtonSelector: sendButtonSelector,
              text: textToSendInput
            }
          },
          (response) => {
            if (chrome.runtime.lastError) {
              setWebInteractionStatus(`Error sending text to page: ${chrome.runtime.lastError.message}. Check console for details.`);
              setWebInteractionStatusType('error');
              console.error("Error sending SEND_TO_PAGE_INPUT:", chrome.runtime.lastError.message);
              return;
            }
            // Response with confirmation is handled by the main chrome.runtime.onMessage listener (SENT_TO_PAGE_CONFIRMED)
            if (response && !response.success && response.error) {
                setWebInteractionStatus(`Send request immediately failed: ${response.error}`);
                setWebInteractionStatusType('error');
            }
          }
        );
      } else {
        setWebInteractionStatus('No active tab found to send text to.');
        setWebInteractionStatusType('error');
      }
    });
  };


  return (
    <ThemeProvider theme={settings.darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <ErrorBoundary>
        <Paper sx={{ width: 400, height: 'auto', minHeight: 500, maxHeight: 600, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">The New Fuse</Typography>
              <Box>
                <IconButton onClick={handleToggleTheme} title={settings.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                  {settings.darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
                <IconButton onClick={() => setActiveTab(3)} title="Settings"> {/* Tab index 3 for Settings */}
                  <SettingsIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Connection Status */}
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: getStatusColor(),
              transition: 'background-color 0.3s'
            }}
          />
          <Typography variant="body2" sx={{ flex: 1 }}>
            VS Code: {connectionStatus.status.charAt(0).toUpperCase() + connectionStatus.status.slice(1)}
          </Typography>
          <IconButton
            onClick={handleReconnect}
            disabled={connectionStatus.status === 'connecting' || connectionStatus.status === 'authenticating'}
            size="small"
            title="Reconnect to VS Code"
          >
            {connectionStatus.status === 'connecting' || connectionStatus.status === 'authenticating' ? (
              <CircularProgress size={20} />
            ) : (
              <RefreshIcon />
            )}
          </IconButton>
        </Box>

        {/* Error Message */}
        {connectionStatus.message && (connectionStatus.status === 'error' || connectionStatus.status === 'disconnected') && (
          <Alert severity={connectionStatus.status === 'error' ? 'error' : 'warning'} sx={{ mt: 1, mb: 0 }}>
            {connectionStatus.message}
          </Alert>
        )}
        </Box>          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="main navigation tabs" variant="scrollable" scrollButtons="auto">
              <Tab icon={<DashboardIcon />} label="Dashboard" id="tab-0" aria-controls="tabpanel-0" sx={{minWidth: "20%"}} />
              <Tab icon={<LanguageIcon />} label="Web" id="tab-1" aria-controls="tabpanel-1" sx={{minWidth: "20%"}} />
              <Tab icon={<AutoAwesomeIcon />} label="Enhanced" id="tab-2" aria-controls="tabpanel-2" sx={{minWidth: "20%"}}/>
              <Tab icon={<BuildIcon />} label="Tools" id="tab-3" aria-controls="tabpanel-3" sx={{minWidth: "20%"}}/>
              <Tab icon={<SettingsIcon />} label="Settings" id="tab-4" aria-controls="tabpanel-4" sx={{minWidth: "20%"}}/>
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, overflow: 'hidden' /* Changed from auto to hidden to let TabPanel handle scroll */ }}>
            <TabPanel value={activeTab} index={0}>
              {/* Status Overview Cards */}
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Card sx={{ p: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">VS Code</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getStatusColor() }} />
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {connectionStatus.status.charAt(0).toUpperCase() + connectionStatus.status.slice(1)}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ p: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Port</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'medium' }}>
                      {settings.port}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Quick Actions */}
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}>Quick Actions</Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<MonitorIcon />}
                    onClick={() => handleQuickAction('monitor')}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Monitor
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<HistoryIcon />}
                    onClick={() => handleQuickAction('history')}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    History
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<RestartAltIcon />}
                    onClick={() => handleQuickAction('restart')}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Restart
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<FileDownloadIcon />}
                    onClick={() => handleQuickAction('export')}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Export
                  </Button>
                </Grid>
              </Grid>

              {/* Traditional List Actions */}
              <List dense>
                <ListItem button onClick={() => handleQuickAction('debug')}>
                  <ListItemIcon>
                    <BugReportIcon />
                  </ListItemIcon>
                  <ListItemText primary="Debug Console" secondary="Open debugging tools" />
                </ListItem>
                <ListItem button onClick={() => handleQuickAction('shortcuts')}>
                  <ListItemIcon>
                    <KeyboardIcon />
                  </ListItemIcon>
                  <ListItemText primary="Keyboard Shortcuts" secondary="Manage extension shortcuts" />
                </ListItem>
                <ListItem button onClick={() => handleQuickAction('docs')}>
                  <ListItemIcon>
                    <HelpIcon />
                  </ListItemIcon>
                  <ListItemText primary="Documentation" secondary="View help and guides" />
                </ListItem>
                <ListItem button onClick={() => handleQuickAction('clear-logs')}>
                  <ListItemIcon>
                    <ClearIcon />
                  </ListItemIcon>
                  <ListItemText primary="Clear Logs" secondary="Reset connection history" />
                </ListItem>
              </List>

              {/* Performance Stats */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Performance</Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <MemoryIcon color="action" sx={{ fontSize: 16 }} />
                    <Typography variant="caption" display="block">Memory</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {performanceStats.memoryUsage}MB
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <SpeedIcon color="action" sx={{ fontSize: 16 }} />
                    <Typography variant="caption" display="block">CPU</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {performanceStats.cpuUsage}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <NetworkCheckIcon color="action" sx={{ fontSize: 16 }} />
                    <Typography variant="caption" display="block">Network</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {performanceStats.networkStatus}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Typography variant="subtitle1" gutterBottom>Web Page Integration</Typography>
              <Typography variant="body2" color="text.secondary" sx={{mb:2}}>
                Define CSS selectors to interact with elements on the current web page.
              </Typography>

              {/* Enhanced Selector Configuration */}
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Chat Input Selector"
                    value={chatInputSelector}
                    onChange={(e) => setChatInputSelector(e.target.value)}
                    size="small"
                    placeholder=".chat-input, #inputField"
                  />
                </Grid>
                <Grid item xs={4}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleTestSelectors()}
                    sx={{ height: '40px' }}
                  >
                    Test
                  </Button>
                </Grid>
              </Grid>

              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Chat Output/Log Selector"
                    value={chatOutputSelector}
                    onChange={(e) => setChatOutputSelector(e.target.value)}
                    size="small"
                    placeholder=".chat-log, #outputArea"
                  />
                </Grid>
                <Grid item xs={4}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<CodeIcon />}
                    onClick={handleAutoDetectSelectors}
                    sx={{ height: '40px' }}
                  >
                    Auto
                  </Button>
                </Grid>
              </Grid>

              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Send Button Selector"
                    value={sendButtonSelector}
                    onChange={(e) => setSendButtonSelector(e.target.value)}
                    size="small"
                    placeholder=".send-button, #submitBtn"
                  />
                </Grid>
                <Grid item xs={4}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<ContentCopyIcon />}
                    onClick={() => {
                      navigator.clipboard.writeText(sendButtonSelector);
                      setWebInteractionStatus('Selector copied to clipboard');
                      setWebInteractionStatusType('info');
                    }}
                    sx={{ height: '40px' }}
                  >
                    Copy
                  </Button>
                </Grid>
              </Grid>

              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Button 
                    variant="contained" 
                    size="small" 
                    fullWidth
                    startIcon={<NetworkCheckIcon />}
                    onClick={handleInjectScript}
                  >
                    Sync
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button 
                    variant="contained" 
                    size="small" 
                    fullWidth
                    startIcon={<VisibilityIcon />}
                    onClick={handleCaptureOutput} 
                    disabled={!chatOutputSelector.trim()}
                  >
                    Capture
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button 
                    variant="contained" 
                    size="small" 
                    fullWidth
                    startIcon={<FileUploadIcon />}
                    onClick={handleSendToPage} 
                    disabled={!chatInputSelector.trim() || !sendButtonSelector.trim() || !textToSendInput.trim()}
                  >
                    Send
                  </Button>
                </Grid>
              </Grid>

              {/* Floating Panel Control */}
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    fullWidth
                    startIcon={<AutoAwesomeIcon />}
                    onClick={handleToggleFloatingPanel}
                    sx={{ 
                      borderStyle: 'dashed',
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      borderColor: '#8b5cf6',
                      '&:hover': {
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        borderColor: '#7c3aed'
                      }
                    }}
                  >
                    🎯 Toggle Floating Panel (Direct UI Injection)
                  </Button>
                </Grid>
              </Grid>

              {/* Auto-capture toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={autoCapture}
                    onChange={(e) => setAutoCapture(e.target.checked)}
                    size="small"
                  />
                }
                label="Auto-capture output changes"
                sx={{ mb: 1 }}
              />

              <TextField
                fullWidth
                label="Text to Send to Page"
                value={textToSendInput}
                onChange={(e) => setTextToSendInput(e.target.value)}
                sx={{ mt: 1, mb: 1.5 }}
                size="small"
                variant="outlined"
                multiline
                minRows={2}
                maxRows={4}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setTextToSendInput('')}
                      size="small"
                      sx={{ mt: -2 }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )
                }}
              />

              {capturedOutputDisplay && (
                <Card sx={{ mt: 1.5, mb: 1 }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'medium' }}>Captured Output:</Typography>
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(capturedOutputDisplay);
                          setWebInteractionStatus('Output copied to clipboard');
                          setWebInteractionStatusType('info');
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        whiteSpace: 'pre-wrap', 
                        wordBreak: 'break-word', 
                        maxHeight: '100px', 
                        overflowY: 'auto',
                        backgroundColor: (theme) => theme.palette.action.hover,
                        p: 1,
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}
                    >
                      {capturedOutputDisplay}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {webInteractionStatus && (
                <Alert severity={webInteractionStatusType} sx={{ mt: 1.5, mb: 1, fontSize: '0.8rem', p: '4px 10px' }}>
                  {webInteractionStatus}
                </Alert>
              )}

              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveWebSelectors}
                fullWidth
                sx={{ mt: 2 }}
                disabled={loading}
                size="small"
                startIcon={<StorageIcon />}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Web Selectors'}
              </Button>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <EnhancedFeaturesTab />
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Typography variant="subtitle1" gutterBottom>Developer Tools</Typography>
              
              {/* Connection History */}
              <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">Connection History</Typography>
                    <Badge badgeContent={connectionHistory.length} color="primary" max={99}>
                      <HistoryIcon />
                    </Badge>
                  </Box>
                  {connectionHistory.length > 0 ? (
                    <Box sx={{ maxHeight: '120px', overflowY: 'auto' }}>
                      {connectionHistory.slice(-5).reverse().map((entry, index) => (
                        <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {entry.timestamp}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {entry.status}: {entry.message}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No connection history yet
                    </Typography>
                  )}
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={() => setConnectionHistory([])}
                    sx={{ mt: 1 }}
                  >
                    Clear History
                  </Button>
                </CardContent>
              </Card>

              {/* Debug Panel */}
              <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">Debug Panel</Typography>
                    <IconButton
                      size="small"
                      onClick={() => setDebugPanelOpen(!debugPanelOpen)}
                    >
                      {debugPanelOpen ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </Box>
                  {debugPanelOpen && (
                    <Box>
                      <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={6}>
                          <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            startIcon={<BugReportIcon />}
                            onClick={() => chrome.tabs.create({ url: 'chrome-extension://' + chrome.runtime.id + '/debug.html' })}
                          >
                            Debug Console
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            startIcon={<CodeIcon />}
                            onClick={() => chrome.tabs.create({ url: 'chrome://extensions/' })}
                          >
                            Extensions
                          </Button>
                        </Grid>
                      </Grid>
                      <Typography variant="caption" color="text.secondary">
                        Extension ID: {chrome.runtime.id}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Data Management</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExportData}
                      >
                        Export Data
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        startIcon={<FileUploadIcon />}
                        component="label"
                      >
                        Import Data
                        <input
                          type="file"
                          accept=".json"
                          hidden
                          onChange={handleImportData}
                        />
                      </Button>
                    </Grid>
                  </Grid>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<ClearIcon />}
                    onClick={() => {
                      chrome.storage.local.clear();
                      setWebInteractionStatus('All extension data cleared');
                      setWebInteractionStatusType('info');
                    }}
                    sx={{ mt: 1 }}
                    color="error"
                  >
                    Clear All Data
                  </Button>
                </CardContent>
              </Card>

              {/* Extension Logs */}
              <Card>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">Extension Logs</Typography>
                    <Badge badgeContent={extensionLogs.length} color="secondary" max={99}>
                      <CodeIcon />
                    </Badge>
                  </Box>
                  {extensionLogs.length > 0 ? (
                    <Box sx={{ maxHeight: '100px', overflowY: 'auto' }}>
                      {extensionLogs.slice(-3).reverse().map((log, index) => (
                        <Box key={index} sx={{ mb: 0.5, p: 0.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {log.timestamp} [{log.level}]
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                            {log.message}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No logs available
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={4}>
              <Typography variant="subtitle1" gutterBottom>Settings</Typography>
              
              {/* Connection Settings */}
              <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Connection</Typography>
                  <TextField
                    fullWidth
                    type="number"
                    label="WebSocket Port"
                    value={settings.port}
                    onChange={(e) => setSettings(prev => ({ ...prev, port: parseInt(e.target.value, 10) || 0 }))}
                    sx={{ mb: 2 }}
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Default port is 8765">
                          <HelpIcon fontSize="small" color="action" />
                        </Tooltip>
                      )
                    }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoReconnect}
                        onChange={(e) => setSettings(prev => ({ ...prev, autoReconnect: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Auto Reconnect to VS Code"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.debugMode}
                        onChange={(e) => setSettings(prev => ({ ...prev, debugMode: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Enable Debug Mode"
                  />
                </CardContent>
              </Card>

              {/* UI Preferences */}
              <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>User Interface</Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications}
                        onChange={(e) => setNotifications(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Enable Notifications"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoCapture}
                        onChange={(e) => setAutoCapture(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Auto-capture Web Output"
                  />
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>Theme</Typography>
                    <Button
                      variant={settings.darkMode ? "contained" : "outlined"}
                      size="small"
                      startIcon={settings.darkMode ? <DarkModeIcon /> : <LightModeIcon />}
                      onClick={handleToggleTheme}
                      fullWidth
                    >
                      {settings.darkMode ? 'Dark Mode' : 'Light Mode'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Advanced Settings */}
              <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">Advanced</Typography>
                    <IconButton
                      size="small"
                      onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    >
                      {showAdvancedSettings ? <VisibilityOffIcon /> : <TuneIcon />}
                    </IconButton>
                  </Box>
                  
                  {showAdvancedSettings && (
                    <Box>
                      <TextField
                        fullWidth
                        label="Connection Timeout (ms)"
                        type="number"
                        defaultValue="5000"
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      
                      <TextField
                        fullWidth
                        label="Retry Attempts"
                        type="number"
                        defaultValue="3"
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      
                      <FormControlLabel
                        control={<Switch size="small" />}
                        label="Enable Performance Monitoring"
                      />
                      
                      <FormControlLabel
                        control={<Switch size="small" />}
                        label="Verbose Logging"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SecurityIcon sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="subtitle2">Security</Typography>
                  </Box>
                  
                  <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem', p: '4px 8px' }}>
                    Extension uses secure WebSocket connections to VS Code
                  </Alert>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    • All communication is local to your machine<br/>
                    • No data is sent to external servers<br/>
                    • WebSocket connections are authenticated
                  </Typography>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button
                variant="contained"
                onClick={handleSaveConnectionSettings}
                fullWidth
                disabled={loading}
                size="medium"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <StorageIcon />}
                sx={{ mb: 1 }}
              >
                {loading ? 'Saving...' : 'Save Settings & Reconnect'}
              </Button>

              {/* Reset Button */}
              <Button
                variant="outlined"
                onClick={() => {
                  setSettings({
                    port: CONFIG.WS_PORT,
                    autoReconnect: true,
                    debugMode: false,
                    darkMode: false
                  });
                  setWebInteractionStatus('Settings reset to defaults');
                  setWebInteractionStatusType('info');
                }}
                fullWidth
                size="small"
                startIcon={<RestartAltIcon />}
                color="secondary"
              >
                Reset to Defaults
              </Button>
            </TabPanel>
          </Box>
        </Paper>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default Popup;
