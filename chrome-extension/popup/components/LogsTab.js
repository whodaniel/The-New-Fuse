import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react'; // Added useRef
import { Box, Typography, Paper } from '@mui/material';
// import { Logger } from '../../utils/logger';
// const logsLogger = new Logger({ name: 'LogsTab', level: 'info' }); // Logger for LogsTab itself, if needed
const LogsTab = () => {
    const [logMessages, setLogMessages] = useState([]);
    const logsEndRef = useRef(null); // For auto-scrolling
    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
        // Request historical logs
        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ type: 'GET_ALL_LOGS' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error getting all logs:', chrome.runtime.lastError.message);
                    // setLogMessages([{ timestamp: new Date().toISOString(), name: 'LogsTab', level: 'error', message: `Failed to load logs: ${chrome.runtime.lastError.message}` }]);
                    return;
                }
                if (response && response.success && Array.isArray(response.logs)) {
                    setLogMessages(response.logs);
                }
                else if (response && !response.success) {
                    console.error('Failed to fetch logs:', response.error);
                    // setLogMessages([{ timestamp: new Date().toISOString(), name: 'LogsTab', level: 'error', message: `Failed to load logs: ${response.error}` }]);
                }
            });
        }
        // Listener for new log messages
        const messageListener = (message, sender, sendResponse) => {
            if (message && message.type === 'NEW_LOG_ENTRY' && message.payload) {
                setLogMessages(prevLogs => [...prevLogs, message.payload]);
            }
            // Note: ALL_LOGS_RESPONSE is handled by the callback in sendMessage, not here.
        };
        if (chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener(messageListener);
        }
        return () => {
            if (chrome.runtime && chrome.runtime.onMessage) {
                chrome.runtime.onMessage.removeListener(messageListener);
            }
        };
    }, []);
    useEffect(scrollToBottom, [logMessages]); // Scroll to bottom when logs change
    const formatLogEntry = (log) => {
        const date = new Date(log.timestamp);
        const timeString = date.toLocaleTimeString();
        let messageStr = '';
        if (typeof log.message === 'string') {
            messageStr = log.message;
        }
        else {
            try {
                messageStr = JSON.stringify(log.message);
            }
            catch (e) {
                messageStr = '[Unserializable log message]';
            }
        }
        let dataStr = '';
        if (log.data !== undefined) {
            try {
                dataStr = ` Data: ${JSON.stringify(log.data)}`;
            }
            catch (e) {
                dataStr = ' Data: [Unserializable Data]';
            }
        }
        return `${timeString} [${log.name}] [${log.level.toUpperCase()}] ${messageStr}${dataStr}`;
    };
    return (_jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', height: '100%', p: 1 }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 1, ml: 1 }, children: "Logs" }), _jsxs(Paper, { elevation: 1, sx: { flexGrow: 1, overflowY: 'auto', p: 1,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                    border: (theme) => `1px solid ${theme.palette.divider}`
                }, children: [logMessages.length === 0 && (_jsx(Typography, { sx: { p: 1, color: 'text.secondary' }, children: "No logs available." })), logMessages.map((log, index) => (_jsx(Typography, { variant: "body2", component: "pre", sx: {
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            mb: 0.5,
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            px: 0.5
                        }, children: formatLogEntry(log) }, index))), _jsx("div", { ref: logsEndRef })] })] }));
};
export default LogsTab;
//# sourceMappingURL=LogsTab.js.map