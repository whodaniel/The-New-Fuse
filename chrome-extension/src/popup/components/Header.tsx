import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Tooltip, CircularProgress, Box, Button } from '@mui/material';
import { useStore } from '../../utils/store';
import {
  Brightness4,
  Brightness7,
  ChatBubbleOutline as ChatIcon,
  Wifi as WifiIcon, // Connected
  WifiOff as WifiOffIcon, // Disconnected
  ErrorOutline as ErrorIcon, // Error
  PlayArrow as PlayArrowIcon, // For starting server
  LockOpen as LockOpenIcon, // Authenticating
} from '@mui/icons-material';
import { Logger } from '../../utils/logger';
import { ConnectionStatusMessage } from '../../shared-protocol'; // For status type

const popupLogger = new Logger({ name: 'PopupHeader', level: 'info' });

type WebSocketStatus = ConnectionStatusMessage['payload']['status'];

const Header: React.FC = () => {
  const { isDarkMode, setDarkMode } = useStore();
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [webSocketStatus, setWebSocketStatus] = useState<WebSocketStatus>('disconnected');
  const [webSocketMessage, setWebSocketMessage] = useState<string | undefined>(undefined);
  const [isWebSocketServerRunning, setIsWebSocketServerRunning] = useState<boolean>(false);
  const [isStartingServer, setIsStartingServer] = useState<boolean>(false);

  useEffect(() => {
    // Get initial panel state
    chrome.runtime.sendMessage({ type: 'GET_FLOATING_PANEL_STATE' }, (response) => {
      if (chrome.runtime.lastError) {
        popupLogger.warn('Error getting initial panel state for button:', chrome.runtime.lastError.message);
      } else if (response && typeof response.isVisible === 'boolean') {
        setIsPanelVisible(response.isVisible);
      }
    });

    // Get initial WebSocket status
    chrome.runtime.sendMessage({ type: 'GET_WEBSOCKET_STATUS' }, (response: ConnectionStatusMessage['payload']) => {
      if (chrome.runtime.lastError) {
        popupLogger.error('Error getting initial WebSocket status:', chrome.runtime.lastError.message);
        setWebSocketStatus('error');
        setWebSocketMessage(chrome.runtime.lastError.message);
      } else if (response && response.status) {
        popupLogger.info('Initial WebSocket status:', response);
        setWebSocketStatus(response.status);
        setWebSocketMessage(response.message);
        
        // If we're connected, we can assume the server is running
        if (response.status === 'connected' || response.status === 'connecting') {
          setIsWebSocketServerRunning(true);
        }
      }
    });

    // Listen for WebSocket status updates
    const messageListener = (
      message: {type: string, payload?: ConnectionStatusMessage['payload']}, 
      sender: chrome.runtime.MessageSender, 
      sendResponse: (response?: any) => void
    ) => {
      if (message.type === 'WEBSOCKET_STATUS_UPDATE' && message.payload) {
        popupLogger.info('WebSocket status update received:', message.payload);
        setWebSocketStatus(message.payload.status);
        setWebSocketMessage(message.payload.message);
        
        // If we're connected, we can assume the server is running
        if (message.payload.status === 'connected' || message.payload.status === 'connecting') {
          setIsWebSocketServerRunning(true);
        }
      }
      
      // The following is to satisfy TypeScript that these params are used
      if (false) {
        console.log(sender, sendResponse);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleToggleFloatingPanel = () => {
    const newVisibility = !isPanelVisible;
    chrome.runtime.sendMessage({ type: 'TOGGLE_FLOATING_PANEL', visible: newVisibility }, (response) => {
      if (chrome.runtime.lastError) {
        popupLogger.error('Error toggling floating panel:', chrome.runtime.lastError.message);
        // Optionally revert UI state or show error to user
      } else {
        popupLogger.info('Floating panel toggle message sent. Response:', response);
        if (response && typeof response.visible === 'boolean') {
          setIsPanelVisible(response.visible);
        } else if (response && response.status && response.status.includes("Error")) {
           popupLogger.error('Failed to toggle panel, content script error:', response.error);
        } else {
          // If the response doesn't directly confirm the new state,
          // we might optimistically update or rely on GET_FLOATING_PANEL_STATE.
          // For now, let's assume the toggle was successful if no error.
          setIsPanelVisible(newVisibility);
        }
      }
    });
  };

  const getStatusIndicator = () => {
    switch (webSocketStatus) {
      case 'connected':
        return { icon: <WifiIcon sx={{ color: 'success.main' }} />, text: 'Connected', color: 'success.main' };
      case 'disconnected':
        return { icon: <WifiOffIcon sx={{ color: 'text.secondary' }} />, text: 'Disconnected', color: 'text.secondary' };
      case 'connecting':
        return { icon: <CircularProgress size={20} sx={{ color: 'warning.main' }} />, text: 'Connecting...', color: 'warning.main' };
      case 'authenticating':
        return { icon: <LockOpenIcon sx={{ color: 'info.main' }} />, text: 'Authenticating...', color: 'info.main' };
      case 'error':
        return { icon: <ErrorIcon sx={{ color: 'error.main' }} />, text: webSocketMessage || 'Error', color: 'error.main' };
      default:
        return { icon: <WifiOffIcon sx={{ color: 'text.disabled' }} />, text: 'Unknown', color: 'text.disabled' };
    }
  };

  const statusIndicator = getStatusIndicator();

  // Function to handle starting the WebSocket server
  const handleStartWebSocketServer = () => {
    setIsStartingServer(true);
    
    chrome.runtime.sendMessage({ type: 'START_WEBSOCKET_SERVER' }, (response) => {
      setIsStartingServer(false);
      
      if (chrome.runtime.lastError) {
        popupLogger.error('Error starting WebSocket server:', chrome.runtime.lastError.message);
        // Show error to user
      } else {
        popupLogger.info('WebSocket server start request sent. Response:', response);
        if (response && response.success) {
          setIsWebSocketServerRunning(true);
        } else if (response && response.fallbackLaunched) {
          // Help page was launched, keep state as is
        } else {
          // Something went wrong
          popupLogger.error('Failed to start WebSocket server:', response?.error);
        }
      }
    });
  };
  
  // Function to handle connecting to the WebSocket server
  const handleWebSocketConnect = () => {
    if (webSocketStatus === 'connected' || webSocketStatus === 'connecting') {
      // Disconnect
      chrome.runtime.sendMessage({ type: 'WEBSOCKET_DISCONNECT' }, (response) => {
        if (response && response.success) {
          popupLogger.info('WebSocket disconnected');
        }
      });
    } else {
      // Connect
      chrome.runtime.sendMessage({ type: 'WEBSOCKET_CONNECT' }, (response) => {
        if (response && response.success) {
          popupLogger.info('WebSocket connection initiated');
        }
      });
    }
  };
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          The New Fuse
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', marginRight: 1 }}>
          {!isWebSocketServerRunning ? (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={isStartingServer ? <CircularProgress size={16} /> : <PlayArrowIcon />}
              onClick={handleStartWebSocketServer}
              disabled={isStartingServer}
              sx={{ mr: 1, fontSize: '0.75rem' }}
            >
              {isStartingServer ? 'Starting...' : 'Start Server'}
            </Button>
          ) : (
            <Button
              variant="outlined"
              color={webSocketStatus === 'connected' ? 'error' : 'success'}
              size="small"
              onClick={handleWebSocketConnect}
              sx={{ mr: 1, fontSize: '0.75rem' }}
            >
              {webSocketStatus === 'connected' ? 'Disconnect' : 'Connect'}
            </Button>
          )}
          
          <Tooltip title={webSocketMessage || statusIndicator.text}>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
              {statusIndicator.icon}
              <Typography
                variant="body2"
                sx={{
                  color: statusIndicator.color,
                  marginLeft: 0.5,
                  fontSize: '0.75rem'
                }}
              >
                {statusIndicator.text}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
        
        <Tooltip title={isPanelVisible ? "Hide Floating Panel" : "Show Floating Panel"}>
          <IconButton color="inherit" onClick={handleToggleFloatingPanel} size="small">
            <ChatIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Toggle Theme">
          <IconButton color="inherit" onClick={() => setDarkMode(!isDarkMode)} size="small">
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
