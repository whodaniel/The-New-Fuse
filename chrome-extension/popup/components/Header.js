import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Tooltip, CircularProgress, Box, Button } from '@mui/material';
import { useStore } from '../../utils/store';
import { Brightness4, Brightness7, ChatBubbleOutline as ChatIcon, Wifi as WifiIcon, // Connected
WifiOff as WifiOffIcon, // Disconnected
ErrorOutline as ErrorIcon, // Error
PlayArrow as PlayArrowIcon, // For starting server
LockOpen as LockOpenIcon, // Authenticating
 } from '@mui/icons-material';
import { Logger } from '../../utils/logger';
const popupLogger = new Logger({ name: 'PopupHeader', level: 'info' });
const Header = () => {
    const { isDarkMode, setDarkMode } = useStore();
    const [isPanelVisible, setIsPanelVisible] = useState(false);
    const [webSocketStatus, setWebSocketStatus] = useState('disconnected');
    const [webSocketMessage, setWebSocketMessage] = useState(undefined);
    const [isWebSocketServerRunning, setIsWebSocketServerRunning] = useState(false);
    const [isStartingServer, setIsStartingServer] = useState(false);
    useEffect(() => {
        // Get initial panel state
        chrome.runtime.sendMessage({ type: 'GET_FLOATING_PANEL_STATE' }, (response) => {
            if (chrome.runtime.lastError) {
                popupLogger.warn('Error getting initial panel state for button:', chrome.runtime.lastError.message);
            }
            else if (response && typeof response.isVisible === 'boolean') {
                setIsPanelVisible(response.isVisible);
            }
        });
        // Get initial WebSocket status
        chrome.runtime.sendMessage({ type: 'GET_WEBSOCKET_STATUS' }, (response) => {
            if (chrome.runtime.lastError) {
                popupLogger.error('Error getting initial WebSocket status:', chrome.runtime.lastError.message);
                setWebSocketStatus('error');
                setWebSocketMessage(chrome.runtime.lastError.message);
            }
            else if (response && response.status) {
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
        const messageListener = (message, sender, sendResponse) => {
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
            }
            else {
                popupLogger.info('Floating panel toggle message sent. Response:', response);
                if (response && typeof response.visible === 'boolean') {
                    setIsPanelVisible(response.visible);
                }
                else if (response && response.status && response.status.includes("Error")) {
                    popupLogger.error('Failed to toggle panel, content script error:', response.error);
                }
                else {
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
                return { icon: _jsx(WifiIcon, { sx: { color: 'success.main' } }), text: 'Connected', color: 'success.main' };
            case 'disconnected':
                return { icon: _jsx(WifiOffIcon, { sx: { color: 'text.secondary' } }), text: 'Disconnected', color: 'text.secondary' };
            case 'connecting':
                return { icon: _jsx(CircularProgress, { size: 20, sx: { color: 'warning.main' } }), text: 'Connecting...', color: 'warning.main' };
            case 'authenticating':
                return { icon: _jsx(LockOpenIcon, { sx: { color: 'info.main' } }), text: 'Authenticating...', color: 'info.main' };
            case 'error':
                return { icon: _jsx(ErrorIcon, { sx: { color: 'error.main' } }), text: webSocketMessage || 'Error', color: 'error.main' };
            default:
                return { icon: _jsx(WifiOffIcon, { sx: { color: 'text.disabled' } }), text: 'Unknown', color: 'text.disabled' };
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
            }
            else {
                popupLogger.info('WebSocket server start request sent. Response:', response);
                if (response && response.success) {
                    setIsWebSocketServerRunning(true);
                }
                else if (response && response.fallbackLaunched) {
                    // Help page was launched, keep state as is
                }
                else {
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
        }
        else {
            // Connect
            chrome.runtime.sendMessage({ type: 'WEBSOCKET_CONNECT' }, (response) => {
                if (response && response.success) {
                    popupLogger.info('WebSocket connection initiated');
                }
            });
        }
    };
    return (_jsx(AppBar, { position: "static", children: _jsxs(Toolbar, { children: [_jsx(Typography, { variant: "h6", component: "div", sx: { flexGrow: 1 }, children: "The New Fuse" }), _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', marginRight: 1 }, children: [!isWebSocketServerRunning ? (_jsx(Button, { variant: "contained", color: "primary", size: "small", startIcon: isStartingServer ? _jsx(CircularProgress, { size: 16 }) : _jsx(PlayArrowIcon, {}), onClick: handleStartWebSocketServer, disabled: isStartingServer, sx: { mr: 1, fontSize: '0.75rem' }, children: isStartingServer ? 'Starting...' : 'Start Server' })) : (_jsx(Button, { variant: "outlined", color: webSocketStatus === 'connected' ? 'error' : 'success', size: "small", onClick: handleWebSocketConnect, sx: { mr: 1, fontSize: '0.75rem' }, children: webSocketStatus === 'connected' ? 'Disconnect' : 'Connect' })), _jsx(Tooltip, { title: webSocketMessage || statusIndicator.text, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mr: 1 }, children: [statusIndicator.icon, _jsx(Typography, { variant: "body2", sx: {
                                            color: statusIndicator.color,
                                            marginLeft: 0.5,
                                            fontSize: '0.75rem'
                                        }, children: statusIndicator.text })] }) })] }), _jsx(Tooltip, { title: isPanelVisible ? "Hide Floating Panel" : "Show Floating Panel", children: _jsx(IconButton, { color: "inherit", onClick: handleToggleFloatingPanel, size: "small", children: _jsx(ChatIcon, {}) }) }), _jsx(Tooltip, { title: "Toggle Theme", children: _jsx(IconButton, { color: "inherit", onClick: () => setDarkMode(!isDarkMode), size: "small", children: isDarkMode ? _jsx(Brightness7, {}) : _jsx(Brightness4, {}) }) })] }) }));
};
export default Header;
//# sourceMappingURL=Header.js.map