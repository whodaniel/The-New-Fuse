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
  Tab
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '../../styles/theme';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import BugReportIcon from '@mui/icons-material/BugReport';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import HelpIcon from '@mui/icons-material/Help';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LanguageIcon from '@mui/icons-material/Language'; // For Web Integration
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // For Enhanced Features

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
    port: 3711,
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


  useEffect(() => {
    // Load settings
    chrome.storage.local.get(['connectionSettings', 'webIntegrationSettings'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading settings:', chrome.runtime.lastError.message);
        setWebInteractionStatus(`Failed to load settings: ${chrome.runtime.lastError.message}`);
        setWebInteractionStatusType('error');
        // Keep default settings if loading fails
        return;
      }

      if (result.connectionSettings) {
        setSettings(prev => ({
          ...prev,
          port: result.connectionSettings.wsPort || 3711,
          autoReconnect: result.connectionSettings.autoConnect !== false,
          debugMode: !!result.connectionSettings.debug,
          darkMode: !!result.connectionSettings.darkMode
        }));
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
    setSettings(prev => ({
      ...prev,
      darkMode: newDarkMode
    }));
    // Save theme preference immediately
    chrome.storage.local.get(['connectionSettings'], (result) => {
        const currentSettings = result.connectionSettings || {};
        chrome.storage.local.set({
            connectionSettings: { ...currentSettings, darkMode: newDarkMode }
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Failed to save dark mode setting:', chrome.runtime.lastError.message);
                setWebInteractionStatus(`Failed to save theme preference: ${chrome.runtime.lastError.message}`);
                setWebInteractionStatusType('error');
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
      default:
        console.log('Unknown quick action:', action);
    }
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
        console.log('Popup: Sending INJECT_SCRIPT_REQUEST message to tab', tabs[0].id);
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'INJECT_SCRIPT_REQUEST',
          payload: {
            chatInputSelector,
            chatOutputSelector,
            sendButtonSelector
          }
        }, response => {
          if (chrome.runtime.lastError) {
            setWebInteractionStatus(`Error syncing with page: ${chrome.runtime.lastError.message}. Ensure the page is not a restricted URL (e.g., chrome:// pages) and try reloading the page.`);
            setWebInteractionStatusType('error');
            console.error("Error in handleInjectScript:", chrome.runtime.lastError.message);
            return;
          }
          if (response && response.success) {
            setWebInteractionStatus(response.message || 'Successfully synced with page content script.');
            setWebInteractionStatusType('success');
          } else if (response) {
            setWebInteractionStatus(response.message || 'Failed to confirm content script activity. Try reloading the page.');
            setWebInteractionStatusType('warning');
          } else {
            setWebInteractionStatus('No response from content script. The extension might not have permissions for this page, or the page needs a reload.');
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
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="main navigation tabs" variant="fullWidth">
              <Tab icon={<DashboardIcon />} label="Dashboard" id="tab-0" aria-controls="tabpanel-0" sx={{minWidth: "25%"}} />
              <Tab icon={<LanguageIcon />} label="Web" id="tab-1" aria-controls="tabpanel-1" sx={{minWidth: "25%"}} />
              <Tab icon={<AutoAwesomeIcon />} label="Enhanced" id="tab-2" aria-controls="tabpanel-2" sx={{minWidth: "25%"}}/>
              <Tab icon={<SettingsIcon />} label="Settings" id="tab-3" aria-controls="tabpanel-3" sx={{minWidth: "25%"}}/>
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, overflow: 'hidden' /* Changed from auto to hidden to let TabPanel handle scroll */ }}>
            <TabPanel value={activeTab} index={0}>
              {/* Quick Actions */}
              <Typography variant="subtitle1" gutterBottom sx={{mt: -1 /* Adjust if AI platforms removed */}}>Quick Actions</Typography>
              <List dense>
                <ListItem button onClick={() => handleQuickAction('debug')}>
                  <ListItemIcon>
                    <BugReportIcon />
                  </ListItemIcon>
                  <ListItemText primary="Debug Console" />
                </ListItem>
                <ListItem button onClick={() => handleQuickAction('shortcuts')}>
                  <ListItemIcon>
                    <KeyboardIcon />
                  </ListItemIcon>
                  <ListItemText primary="Keyboard Shortcuts" />
                </ListItem>
                <ListItem button onClick={() => handleQuickAction('docs')}>
                  <ListItemIcon>
                    <HelpIcon />
                  </ListItemIcon>
                  <ListItemText primary="Documentation" />
                </ListItem>
              </List>
              <Typography variant="caption" color="text.secondary" sx={{ display:'block', textAlign:'center', mt: 1 }}>
                WebSocket Port: {settings.port}
              </Typography>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Typography variant="subtitle1" gutterBottom>Web Page Integration</Typography>
              <Typography variant="body2" color="text.secondary" sx={{mb:2}}>
                Define CSS selectors to interact with elements on the current web page.
              </Typography>
              <TextField
                fullWidth
                label="Chat Input Selector"
                value={chatInputSelector}
                onChange={(e) => setChatInputSelector(e.target.value)}
                sx={{ mb: 2 }}
                size="small"
                placeholder=".chat-input, #inputField"
              />
              <TextField
                fullWidth
                label="Chat Output/Log Selector"
                value={chatOutputSelector}
                onChange={(e) => setChatOutputSelector(e.target.value)}
                sx={{ mb: 2 }}
                size="small"
                placeholder=".chat-log, #outputArea"
              />
              <TextField
                fullWidth
                label="Send Button Selector"
                value={sendButtonSelector}
                onChange={(e) => setSendButtonSelector(e.target.value)}
                sx={{ mb: 2 }}
                size="small"
                placeholder=".send-button, #submitBtn"
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2}}>
                <Button variant="outlined" onClick={handleInjectScript} size="small" sx={{flexGrow:1, maxWidth: 'calc(50% - 4px)' }} title="Ensure content script is active and selectors are up-to-date on the page. Useful if page interaction isn't working.">Sync with Page</Button>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1.5}}>
                <Button variant="contained" onClick={handleCaptureOutput} size="small" sx={{flex:1}} disabled={!chatOutputSelector.trim()}>Capture Output</Button>
                <Button variant="contained" onClick={handleSendToPage} size="small" sx={{flex:1}} disabled={!chatInputSelector.trim() || !sendButtonSelector.trim() || !textToSendInput.trim()}>Send to Page</Button>
              </Box>
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
              />
              {capturedOutputDisplay && (
                <Box sx={{ mt: 1.5, mb: 1, p:1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, background: (theme) => theme.palette.action.hover }}>
                  <Typography variant="caption" display="block" gutterBottom sx={{fontWeight: 'medium'}}>Captured Output:</Typography>
                  <Typography variant="body2" sx={{whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '100px', overflowY: 'auto'}}>{capturedOutputDisplay}</Typography>
                </Box>
              )}
              {webInteractionStatus && (
                <Alert severity={webInteractionStatusType} sx={{ mt: 1.5, mb:0, fontSize: '0.8rem', p: '4px 10px' }}>
                  {webInteractionStatus}
                </Alert>
              )}
               <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveWebSelectors}
                    fullWidth
                    sx={{ mt: 2.5 }}
                    disabled={loading}
                    size="small"
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Web Selectors'}
                  </Button>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <EnhancedFeaturesTab />
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Typography variant="subtitle1" gutterBottom>Connection Settings</Typography>
              <TextField
                fullWidth
                type="number"
                label="WebSocket Port"
                value={settings.port}
                onChange={(e) => setSettings(prev => ({ ...prev, port: parseInt(e.target.value, 10) || 0 }))}
                sx={{ mb: 2 }}
                size="small"
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
              <Button
                variant="contained"
                onClick={handleSaveConnectionSettings}
                fullWidth
                sx={{ mt: 2 }}
                disabled={loading}
                size="small"
              >
                {loading ? <CircularProgress size={24} /> : 'Save Connection & Reconnect'}
              </Button>
            </TabPanel>
          </Box>
        </Paper>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default Popup;
