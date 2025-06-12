import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import { Wifi as WifiIcon, WifiOff as WifiOffIcon, ErrorOutline as ErrorIcon, LockOpen as LockOpenIcon } from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Logger } from '../utils/logger';
import ErrorBoundary from '../popup/components/ErrorBoundary';
import { themeManager } from '../utils/enhanced-theme';
const panelLogger = new Logger({ name: 'FloatingPanel', level: 'info' });
// Enhanced theme with purple/blue gradient
const panelTheme = themeManager.getMaterialUITheme();
const FloatingPanel = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const nodeRef = useRef(null);
    const [webSocketStatus, setWebSocketStatus] = useState('disconnected');
    const [webSocketMessage, setWebSocketMessage] = useState(undefined);
    useEffect(() => {
        // Listener for general messages (like toggle) and WebSocket status updates
        const messageListener = (message, sender, sendResponse) => {
            if (message.type === 'TOGGLE_FLOATING_PANEL') {
                panelLogger.info(`TOGGLE_FLOATING_PANEL received, current visibility: ${isVisible}`);
                setIsVisible((prev) => {
                    const newVisibility = !prev;
                    chrome.runtime.sendMessage({
                        type: 'CONTROL_IFRAME_VISIBILITY',
                        visible: newVisibility,
                    }).catch(err => panelLogger.error("Error sending CONTROL_IFRAME_VISIBILITY message:", err));
                    return newVisibility;
                });
                sendResponse({ status: 'Panel visibility toggled', newVisibility: !isVisible });
            }
            else if (message.type === 'WEBSOCKET_STATUS_UPDATE' && message.payload) {
                panelLogger.info('WebSocket status update received in floating panel:', message.payload);
                setWebSocketStatus(message.payload.status);
                setWebSocketMessage(message.payload.message);
            }
            return true; // Keep channel open for async response
        };
        chrome.runtime.onMessage.addListener(messageListener);
        panelLogger.info('FloatingPanel mounted and listeners added.');
        // Request initial visibility state
        chrome.runtime.sendMessage({ type: 'GET_FLOATING_PANEL_STATE' }, (response) => {
            if (chrome.runtime.lastError) {
                panelLogger.warn('Error getting initial panel state:', chrome.runtime.lastError.message);
            }
            else if (response && typeof response.isVisible === 'boolean') {
                panelLogger.info('Initial panel visibility state received:', response.isVisible);
                setIsVisible(response.isVisible);
                if (response.position) {
                    setPosition(response.position);
                }
            }
        });
        // Request initial WebSocket status
        chrome.runtime.sendMessage({ type: 'GET_WEBSOCKET_STATUS' }, (response) => {
            if (chrome.runtime.lastError) {
                panelLogger.error('Error getting initial WebSocket status for panel:', chrome.runtime.lastError.message);
                setWebSocketStatus('error');
                setWebSocketMessage(chrome.runtime.lastError.message);
            }
            else if (response && response.status) {
                panelLogger.info('Initial WebSocket status for panel:', response);
                setWebSocketStatus(response.status);
                setWebSocketMessage(response.message);
            }
        });
        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
            panelLogger.info('FloatingPanel unmounted and listeners removed.');
        };
    }, []); // isVisible is not needed here as it's managed by the message listener
    const handleClose = () => {
        setIsVisible(false);
        chrome.runtime.sendMessage({
            type: 'CONTROL_IFRAME_VISIBILITY',
            visible: false,
        }).catch(err => panelLogger.error("Error sending CONTROL_IFRAME_VISIBILITY on close:", err));
        // Persist closed state
        chrome.runtime.sendMessage({ type: 'SET_FLOATING_PANEL_STATE', state: { isVisible: false, position } })
            .catch(err => panelLogger.error("Error setting panel state on close:", err));
    };
    const handleDragStop = (e, data) => {
        const newPosition = { x: data.x, y: data.y };
        setPosition(newPosition);
        // Persist new position
        chrome.runtime.sendMessage({ type: 'SET_FLOATING_PANEL_STATE', state: { isVisible, position: newPosition } })
            .catch(err => panelLogger.error("Error setting panel state on drag stop:", err));
    };
    // The Draggable component wraps the Paper.
    // The visibility of the Draggable (and thus the Paper) is controlled by isVisible.
    // The iframe itself is controlled by the content script.
    // This component only needs to render its content when it's supposed to be visible.
    if (!isVisible) {
        // It's important that this component *does not* render null when !isVisible,
        // because the iframe itself will be hidden by the content script.
        // If this component renders null, the iframe might be empty but still visible.
        // Instead, the content script should hide the iframe.
        // This component should always render its structure, and the `TOGGLE_FLOATING_PANEL`
        // message should trigger the content script to show/hide the iframe.
        // The `isVisible` state here is more for internal logic if needed, or can be removed
        // if the iframe's display is the sole source of truth for visibility.
        // For now, let's assume the iframe is made visible, and then this component shows.
        // This logic needs to be coordinated with content/index.ts's iframe visibility control.
        // The current logic: this component tells the content script to hide the iframe.
        // So, when isVisible is false, this component effectively becomes "dormant" inside a hidden iframe.
        return null;
    }
    const getStatusIndicator = () => {
        switch (webSocketStatus) {
            case 'connected':
                return { icon: _jsx(WifiIcon, { sx: { color: 'success.main', fontSize: '1rem' } }), text: 'Connected', color: 'success.main' };
            case 'disconnected':
                return { icon: _jsx(WifiOffIcon, { sx: { color: 'text.secondary', fontSize: '1rem' } }), text: 'Disconnected', color: 'text.secondary' };
            case 'connecting':
                return { icon: _jsx(CircularProgress, { size: 16, sx: { color: 'warning.main' } }), text: 'Connecting...', color: 'warning.main' };
            case 'authenticating':
                return { icon: _jsx(LockOpenIcon, { sx: { color: 'info.main', fontSize: '1rem' } }), text: 'Authenticating...', color: 'info.main' };
            case 'error':
                return { icon: _jsx(ErrorIcon, { sx: { color: 'error.main', fontSize: '1rem' } }), text: webSocketMessage || 'Error', color: 'error.main' };
            default:
                return { icon: _jsx(WifiOffIcon, { sx: { color: 'text.disabled', fontSize: '1rem' } }), text: 'Unknown', color: 'text.disabled' };
        }
    };
    const statusIndicator = getStatusIndicator();
    return (_jsx(ErrorBoundary, { children: _jsxs(ThemeProvider, { theme: panelTheme, children: [_jsx(CssBaseline, {}), _jsx(Draggable, { handle: ".drag-handle", defaultPosition: position, onStop: handleDragStop, nodeRef: nodeRef, children: _jsxs(Paper, { ref: nodeRef, elevation: 3, sx: {
                            position: 'fixed', // Draggable handles this, but good for context
                            // The iframe is already positioned by content script.
                            // This Paper is at 0,0 within the iframe.
                            // Draggable moves this Paper within the iframe.
                            // If we want the Paper to be draggable on the main page,
                            // the iframe itself needs to be draggable, or use a different injection.
                            // For now, this setup means the panel is fixed *within* its iframe bounds.
                            // To make the *iframe* draggable, that's a content script job.
                            // Let's assume the iframe is fixed and this panel is draggable *within* it.
                            // This is not ideal. The iframe itself should be draggable.
                            // For now, let's simplify: the Paper fills the iframe, and the iframe is made draggable by content script.
                            // OR, the Paper is draggable within a larger, fixed iframe.
                            // The current setup with `position: 'fixed'` on Paper inside Draggable is a bit redundant
                            // if the iframe itself is the draggable element.
                            // Let's assume the Paper is the draggable element *within* the iframe viewport.
                        }, children: [_jsxs(Box, { className: "drag-handle", sx: {
                                    padding: '8px 16px',
                                    backgroundColor: 'primary.main',
                                    color: 'common.white',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'move',
                                    borderTopLeftRadius: '8px', // Match paper
                                    borderTopRightRadius: '8px', // Match paper
                                }, children: [_jsx(Typography, { variant: "h6", component: "div", sx: { fontSize: '1rem', flexGrow: 1 }, children: "Fuse AI Panel" }), _jsx(Tooltip, { title: webSocketMessage || statusIndicator.text, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', marginRight: 1 }, children: [statusIndicator.icon, _jsx(Typography, { variant: "caption" // Smaller text for panel header
                                                    , sx: {
                                                        color: 'common.white', // Assuming header background is dark
                                                        marginLeft: 0.5,
                                                    }, children: statusIndicator.text })] }) }), _jsx(IconButton, { onClick: handleClose, size: "small", sx: { color: 'common.white' }, children: _jsx(CloseIcon, { fontSize: "small" }) })] }), _jsx(Box, { sx: { padding: '16px', flexGrow: 1, overflowY: 'auto' }, children: _jsx(Typography, { variant: "body1", children: "Floating Panel Content Goes Here." }) })] }) })] }) }));
};
export default FloatingPanel;
//# sourceMappingURL=FloatingPanel.js.map