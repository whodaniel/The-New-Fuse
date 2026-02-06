import React, { useState } from 'react';

interface WebIntegrationPanelProps {
  isMainApp?: boolean;
}

const WebIntegrationPanel: React.FC<WebIntegrationPanelProps> = ({ isMainApp = true }) => {
  const [chatInputSelector, setChatInputSelector] = useState('');
  const [chatOutputSelector, setChatOutputSelector] = useState('');
  const [sendButtonSelector, setSendButtonSelector] = useState('');
  const [textToSend, setTextToSend] = useState('');
  const [capturedOutput, setCapturedOutput] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [autoCapture, setAutoCapture] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Helper function to add status messages
  const addStatus = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setStatus(message);
    setStatusType(type);
  };

  // Send text to page
  const handleSendToPage = async () => {
    if (!textToSend.trim()) {
      addStatus('Please enter text to send', 'warning');
      return;
    }

    if (!chatInputSelector.trim()) {
      addStatus('Please specify input selector', 'warning');
      return;
    }

    try {
      if (isMainApp) {
        // For main app - this would integrate with your web automation system
        addStatus('Text sent to page (main app integration)', 'success');
      } else {
        // For chrome extension - use content script
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(
                tabs[0].id,
                {
                  type: 'SEND_TO_PAGE',
                  selector: chatInputSelector,
                  text: textToSend,
                },
                (response) => {
                  if (chrome.runtime.lastError) {
                    addStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
                  } else if (response?.success) {
                    addStatus('Text sent successfully', 'success');
                    setTextToSend('');
                  } else {
                    addStatus(`Failed: ${response?.error || 'Unknown error'}`, 'error');
                  }
                }
              );
            }
          });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addStatus(`Error sending text: ${errorMsg}`, 'error');
    }
  };

  // Capture output from page
  const handleCaptureOutput = async () => {
    if (!chatOutputSelector.trim()) {
      addStatus('Please specify output selector', 'warning');
      return;
    }

    try {
      if (isMainApp) {
        // For main app - integrate with web scraping system
        setCapturedOutput('Sample captured output (main app integration)');
        addStatus('Output captured successfully', 'success');
      } else {
        // For chrome extension - use content script
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(
                tabs[0].id,
                {
                  type: 'CAPTURE_OUTPUT',
                  selector: chatOutputSelector,
                },
                (response) => {
                  if (chrome.runtime.lastError) {
                    addStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
                  } else if (response?.success) {
                    setCapturedOutput(response.content || 'No content found');
                    addStatus('Output captured successfully', 'success');
                  } else {
                    addStatus(`Failed: ${response?.error || 'Unknown error'}`, 'error');
                  }
                }
              );
            }
          });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addStatus(`Error capturing output: ${errorMsg}`, 'error');
    }
  };

  // Click send button
  const handleClickSendButton = async () => {
    if (!sendButtonSelector.trim()) {
      addStatus('Please specify send button selector', 'warning');
      return;
    }

    try {
      if (isMainApp) {
        addStatus('Send button clicked (main app integration)', 'success');
      } else {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(
                tabs[0].id,
                {
                  type: 'CLICK_BUTTON',
                  selector: sendButtonSelector,
                },
                (response) => {
                  if (chrome.runtime.lastError) {
                    addStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
                  } else if (response?.success) {
                    addStatus('Send button clicked successfully', 'success');
                  } else {
                    addStatus(`Failed: ${response?.error || 'Unknown error'}`, 'error');
                  }
                }
              );
            }
          });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addStatus(`Error clicking button: ${errorMsg}`, 'error');
    }
  };

  // Copy output to clipboard
  const copyToClipboard = async () => {
    if (!capturedOutput) {
      addStatus('No output to copy', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(capturedOutput);
      addStatus('Output copied to clipboard', 'success');
    } catch (error) {
      addStatus('Failed to copy to clipboard', 'error');
    }
  };

  // Clear output
  const clearOutput = () => {
    setCapturedOutput('');
    addStatus('Output cleared', 'info');
  };

  // Toggle monitoring
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    addStatus(isMonitoring ? 'Monitoring stopped' : 'Monitoring started', 'info');
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      {/* Status Alert */}
      {status && (
        <Alert severity={statusType} sx={{ mb: 2 }} onClose={() => setStatus('')}>
          {status}
        </Alert>
      )}

      {/* Selectors Configuration */}
      <Card sx={{ mb: 2 }}>
        <CardBody>
          <Text variant="h6" gutterBottom>
            Page Selectors
          </Text>
          <SimpleGrid container columns={2}>
            <SimpleGrid item xs={12}>
              <Input
                fullWidth
                label="Chat Input Selector"
                placeholder="e.g., #chat-input, .message-input"
                value={chatInputSelector}
                onChange={(e) => setChatInputSelector(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: <CodeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </SimpleGrid>
            <SimpleGrid item xs={12}>
              <Input
                fullWidth
                label="Chat Output Selector"
                placeholder="e.g., .messages, #chat-output"
                value={chatOutputSelector}
                onChange={(e) => setChatOutputSelector(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: <VisibilityIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </SimpleGrid>
            <SimpleGrid item xs={12}>
              <Input
                fullWidth
                label="Send Button Selector"
                placeholder="e.g., #send-btn, .send-button"
                value={sendButtonSelector}
                onChange={(e) => setSendButtonSelector(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: <TouchAppIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </SimpleGrid>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Send to Page */}
      <Card sx={{ mb: 2 }}>
        <CardBody>
          <Text variant="h6" gutterBottom>
            Send to Page
          </Text>
          <Input
            fullWidth
            multiline
            rows={3}
            label="Text to Send"
            placeholder="Enter text to send to the page..."
            value={textToSend}
            onChange={(e) => setTextToSend(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleSendToPage}
              startIcon={<SendIcon />}
              disabled={!textToSend.trim() || !chatInputSelector.trim()}
            >
              Send to Page
            </Button>
            <Button
              variant="outlined"
              onClick={handleClickSendButton}
              startIcon={<TouchAppIcon />}
              disabled={!sendButtonSelector.trim()}
            >
              Click Send Button
            </Button>
          </Box>
        </CardBody>
      </Card>

      {/* Capture Output */}
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
            <Text variant="h6">Captured Output</Text>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormLabel
                control={
                  <Switch
                    checked={autoCapture}
                    onChange={(e) => setAutoCapture(e.target.checked)}
                    size="small"
                  />
                }
                label="Auto"
                sx={{ mr: 1 }}
              />
              <Tooltip title="Start/Stop Monitoring">
                <IconButton
                  size="small"
                  onClick={toggleMonitoring}
                  color={isMonitoring ? 'secondary' : 'default'}
                >
                  {isMonitoring ? <StopIcon /> : <PlayArrowIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Capture Now">
                <IconButton size="small" onClick={handleCaptureOutput}>
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy to Clipboard">
                <IconButton size="small" onClick={copyToClipboard} disabled={!capturedOutput}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear Output">
                <IconButton size="small" onClick={clearOutput} disabled={!capturedOutput}>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: 'background.default',
              minHeight: 120,
              maxHeight: 200,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            }}
          >
            {capturedOutput ? (
              <Text
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                }}
              >
                {capturedOutput}
              </Text>
            ) : (
              <Text variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No output captured yet. Click "Capture Now" or enable auto-capture.
              </Text>
            )}
          </Box>
        </CardBody>
      </Card>

      {/* Monitoring Status */}
      <Card>
        <CardBody>
          <Text variant="h6" gutterBottom>
            Monitoring Status
          </Text>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tag
              label={isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
              color={isMonitoring ? 'success' : 'default'}
              variant="outlined"
            />
            <Tag
              label={autoCapture ? 'Auto-Capture ON' : 'Auto-Capture OFF'}
              color={autoCapture ? 'primary' : 'default'}
              variant="outlined"
            />
            <Tag
              label={`Page: ${isMainApp ? 'Main App' : 'Extension'}`}
              color="info"
              variant="outlined"
            />
          </Box>
        </CardBody>
      </Card>
    </Box>
  );
};

export default WebIntegrationPanel;
