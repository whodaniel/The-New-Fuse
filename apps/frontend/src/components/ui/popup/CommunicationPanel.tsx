// @ts-nocheck
import React, { useState } from 'react';
import { getWebSocketUrl } from '../../../config/ports';

interface CommunicationPanelProps {
  isMainApp?: boolean;
}

type WebSocketStatus =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'authenticating'
  | 'error'
  | 'unknown';

const CommunicationPanel: React.FC<CommunicationPanelProps> = ({ isMainApp = true }) => {
  const [websocketUrl, setWebsocketUrl] = useState(getWebSocketUrl());
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>('disconnected');
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);
  const [connectionLog, setConnectionLog] = useState<string[]>([]);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Add log entry helper
  const addLogEntry = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setConnectionLog((prevLog) => [...prevLog.slice(-9), logEntry]); // Keep last 10 entries
  };

  // Handle connection
  const handleConnect = async () => {
    if (isConnecting) return;

    setIsConnecting(true);
    setConnectionStatus('connecting');
    setStatusMessage('Connecting...');
    addLogEntry(`Attempting to connect to ${websocketUrl}...`);

    try {
      if (isMainApp) {
        // For main app - implement WebSocket connection
        // This would connect to your actual WebSocket service
        const ws = new WebSocket(websocketUrl);

        ws.onopen = () => {
          setConnectionStatus('connected');
          setStatusMessage('Connected');
          addLogEntry('Connection established');
          setIsConnecting(false);
        };

        ws.onerror = (error) => {
          setConnectionStatus('error');
          setStatusMessage('Connection failed');
          addLogEntry(`Connection error: ${error}`);
          setIsConnecting(false);
        };

        ws.onclose = () => {
          setConnectionStatus('disconnected');
          setStatusMessage('Disconnected');
          addLogEntry('Connection closed');
          setIsConnecting(false);
        };

        // Store WebSocket reference for later cleanup
        // You might want to use a ref or context for this
      } else {
        // For chrome extension - use chrome.runtime messaging
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({ type: 'WEBSOCKET_CONNECT' }, (response) => {
            if (chrome.runtime.lastError) {
              const errorMessage = `Connection error: ${chrome.runtime.lastError.message}`;
              addLogEntry(errorMessage);
              setConnectionStatus('error');
              setStatusMessage(errorMessage);
              setIsConnecting(false);
              return;
            }

            if (response && response.success) {
              addLogEntry('Connection established');
              setConnectionStatus('connected');
              setStatusMessage('Connected');
            } else {
              const errorMsg = response?.error || 'Unknown error';
              addLogEntry(`Connection failed: ${errorMsg}`);
              setConnectionStatus('error');
              setStatusMessage(`Failed: ${errorMsg}`);
            }
            setIsConnecting(false);
          });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLogEntry(`Connection failed: ${errorMsg}`);
      setConnectionStatus('error');
      setStatusMessage(`Failed: ${errorMsg}`);
      setIsConnecting(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    addLogEntry(`Disconnecting from ${websocketUrl}...`);

    if (isMainApp) {
      // Close WebSocket connection
      setConnectionStatus('disconnected');
      setStatusMessage('Disconnected');
      addLogEntry('Disconnected successfully');
    } else {
      // For chrome extension
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'WEBSOCKET_DISCONNECT' }, (response) => {
          setConnectionStatus('disconnected');
          setStatusMessage('Disconnected');
          addLogEntry('Disconnected successfully');
        });
      }
    }
  };

  // Get status indicator
  const getStatusIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <CheckCircleIcon color="success" />,
          text: 'Connected',
          color: 'success.main',
          chipColor: 'success' as const,
        };
      case 'disconnected':
        return {
          icon: <WifiOffIcon color="disabled" />,
          text: 'Disconnected',
          color: 'text.secondary',
          chipColor: 'default' as const,
        };
      case 'connecting':
        return {
          icon: <CircularProgress size={20} />,
          text: 'Connecting...',
          color: 'warning.main',
          chipColor: 'warning' as const,
        };
      case 'error':
        return {
          icon: <ErrorIcon color="error" />,
          text: 'Error',
          color: 'error.main',
          chipColor: 'error' as const,
        };
      default:
        return {
          icon: <WifiOffIcon />,
          text: 'Unknown',
          color: 'text.secondary',
          chipColor: 'default' as const,
        };
    }
  };

  const statusInfo = getStatusIndicator();

  // Clear logs
  const clearLogs = () => {
    setConnectionLog([]);
    addLogEntry('Logs cleared');
  };

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Connection Status */}
      <Card sx={{ mb: 2 }}>
        <CardBody>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Text variant="h6">Connection Status</Text>
            <Tag
              icon={statusInfo.icon}
              label={statusInfo.text}
              color={statusInfo.chipColor}
              variant="outlined"
            />
          </Box>

          {statusMessage && (
            <Alert
              severity={
                connectionStatus === 'connected'
                  ? 'success'
                  : connectionStatus === 'error'
                    ? 'error'
                    : 'info'
              }
              sx={{ mb: 2 }}
            >
              {statusMessage}
            </Alert>
          )}

          <Input
            fullWidth
            label="WebSocket URL"
            value={websocketUrl}
            onChange={(e) => setWebsocketUrl(e.target.value)}
            disabled={connectionStatus === 'connected' || isConnecting}
            size="small"
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleConnect}
              disabled={connectionStatus === 'connected' || isConnecting}
              startIcon={isConnecting ? <CircularProgress size={16} /> : <WifiIcon />}
              sx={{ flex: 1 }}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleDisconnect}
              disabled={connectionStatus !== 'connected'}
              startIcon={<WifiOffIcon />}
              sx={{ flex: 1 }}
            >
              Disconnect
            </Button>
          </Box>

          <FormLabel
            control={
              <Switch
                checked={autoReconnect}
                onChange={(e) => setAutoReconnect(e.target.checked)}
              />
            }
            label="Auto-reconnect"
          />
        </CardBody>
      </Card>

      {/* Connection Log */}
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <CardBody sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Text variant="h6">Connection Log</Text>
            <Box>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={() => addLogEntry('Log refreshed')}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear logs">
                <IconButton size="small" onClick={clearLogs}>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box
            variant="outlined"
            sx={{
              flexGrow: 1,
              p: 1,
              bgcolor: 'background.default',
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
            }}
          >
            {connectionLog.length === 0 ? (
              <Text variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No log entries yet...
              </Text>
            ) : (
              connectionLog.map((entry, index) => (
                <Text
                  key={index}
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    lineHeight: 1.4,
                    mb: 0.5,
                    '&:last-child': { mb: 0 },
                  }}
                >
                  {entry}
                </Text>
              ))
            )}
          </Box>
        </CardBody>
      </Card>
    </Box>
  );
};

export default CommunicationPanel;
