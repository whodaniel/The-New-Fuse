import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress } from '@mui/material';
import { Logger } from '../../utils/logger'; // Assuming a logger utility
const communicationLogger = new Logger({ name: 'CommunicationTab', level: 'info' });
const CommunicationTab = () => {
    const [websocketUrl, setWebsocketUrl] = useState('ws://localhost:3712'); // Default URL
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [statusMessage, setStatusMessage] = useState(undefined);
    const [connectionLog, setConnectionLog] = useState([]); // Use string array for log
    // Real connection logic using the background script
    const handleConnect = () => {
        const logEntry = `[${new Date().toLocaleTimeString()}] Attempting to connect to ${websocketUrl}...`;
        setConnectionLog(prevLog => [...prevLog, logEntry]);
        communicationLogger.info(logEntry);
        setConnectionStatus('connecting');
        setStatusMessage('Connecting...');
        // Save the websocket URL to storage
        chrome.storage.local.set({ websocketUrl }, () => {
            if (chrome.runtime.lastError) {
                communicationLogger.error('Failed to save WebSocket URL:', chrome.runtime.lastError);
            }
        });
        // Send connection request to background script
        chrome.runtime.sendMessage({ type: 'WEBSOCKET_CONNECT' }, (response) => {
            if (chrome.runtime.lastError) {
                const errorMessage = `Connection error: ${chrome.runtime.lastError.message}`;
                setConnectionLog(prevLog => [...prevLog, `[${new Date().toLocaleTimeString()}] ${errorMessage}`]);
                setConnectionStatus('error');
                setStatusMessage(errorMessage);
                communicationLogger.error('Connection error:', chrome.runtime.lastError);
                return;
            }
            if (response && response.success) {
                const connectSuccessLog = `[${new Date().toLocaleTimeString()}] Connection established`;
                setConnectionLog(prevLog => [...prevLog, connectSuccessLog]);
                setConnectionStatus('connected');
                setStatusMessage('Connected');
                communicationLogger.info('WebSocket connection successful');
            }
            else {
                const errorMsg = response?.error || 'Unknown error';
                setConnectionLog(prevLog => [...prevLog, `[${new Date().toLocaleTimeString()}] Connection failed: ${errorMsg}`]);
                setConnectionStatus('error');
                setStatusMessage(`Failed: ${errorMsg}`);
                communicationLogger.error('Connection failed:', errorMsg);
            }
        });
    };
    const handleDisconnect = () => {
        const logEntry = `[${new Date().toLocaleTimeString()}] Disconnecting from ${websocketUrl}...`;
        setConnectionLog(prevLog => [...prevLog, logEntry]);
        communicationLogger.info(logEntry);
        // Send disconnect request to background script
        chrome.runtime.sendMessage({ type: 'WEBSOCKET_DISCONNECT' }, (response) => {
            if (chrome.runtime.lastError) {
                communicationLogger.error('Error during disconnect:', chrome.runtime.lastError);
                return;
            }
            setConnectionStatus('disconnected');
            setStatusMessage('Disconnected');
            setConnectionLog(prevLog => [...prevLog, `[${new Date().toLocaleTimeString()}] Disconnected successfully`]);
            communicationLogger.info('WebSocket disconnected successfully');
        });
    };
    // Placeholder for receiving messages (will need to integrate with background script)
    useEffect(() => {
        // Simulate receiving a system message after connecting
        if (connectionStatus === 'connected' && connectionLog.length <= 2) { // Only add initial message once
            setTimeout(() => {
                const systemMessage = `[${new Date().toLocaleTimeString()}] Received: {"type":"SYSTEM","message":"Connected to The New Fuse WebSocket Server"}`;
                setConnectionLog(prevLog => [...prevLog, systemMessage]);
                communicationLogger.info('Simulated system message received');
            }, 1000);
        }
    }, [connectionStatus, connectionLog.length]);
    const getStatusIndicator = () => {
        switch (connectionStatus) {
            case 'connected':
                return { text: 'Connected', color: 'success.main' };
            case 'disconnected':
                return { text: 'Disconnected', color: 'text.secondary' };
            case 'connecting':
                return { text: 'Connecting...', color: 'warning.main' };
            case 'authenticating':
                return { text: 'Authenticating...', color: 'info.main' };
            case 'error':
                return { text: statusMessage || 'Error', color: 'error.main' };
            default:
                return { text: 'Unknown', color: 'text.disabled' };
        }
    };
    const status = getStatusIndicator();
    return (_jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', height: '100%', p: 2 }, children: [" ", _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 2 }, children: [_jsx(Typography, { variant: "subtitle1", sx: { mr: 1, minWidth: '100px' }, children: "WebSocket URL:" }), " ", _jsx(TextField, { variant: "outlined", size: "small", value: websocketUrl, onChange: (e) => setWebsocketUrl(e.target.value), sx: { flexGrow: 1, mr: 1 } }), _jsx(Button, { variant: "contained", onClick: handleConnect, disabled: connectionStatus === 'connecting' || connectionStatus === 'connected', children: "Connect" }), _jsx(Button, { variant: "outlined", onClick: handleDisconnect, disabled: connectionStatus === 'disconnected', children: "Disconnect" })] }), _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 2 }, children: [_jsx(Typography, { variant: "subtitle1", sx: { mr: 1 }, children: "Status:" }), connectionStatus === 'connecting' && _jsx(CircularProgress, { size: 20, sx: { mr: 1 } }), _jsx(Typography, { variant: "body1", sx: { color: status.color }, children: status.text })] }), _jsx(Typography, { variant: "h6", sx: { mb: 1 }, children: "Connection Log" }), _jsx(Paper, { elevation: 1, sx: { flexGrow: 1, overflowY: 'auto', p: 1, mb: 2 }, children: connectionLog.map((log, index) => (_jsx(Typography, { variant: "body2", component: "pre", sx: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', mb: 0.5 }, children: log }, index))) })] }));
};
export default CommunicationTab;
//# sourceMappingURL=CommunicationTab.js.map