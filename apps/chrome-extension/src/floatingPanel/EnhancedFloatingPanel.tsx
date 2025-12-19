import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Draggable from 'react-draggable';

const FloatingPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    websocketStatus: 'DISCONNECTED',
    aiSessionActive: false,
  });
  const [elementStatus, setElementStatus] = useState({
    inputField: false,
    sendButton: false,
    outputArea: false,
  });
  const [currentTab, setCurrentTab] = useState('status');
  const nodeRef = useRef(null);

  useEffect(() => {
    const messageListener = (message, sender, sendResponse) => {
      if (message.type === 'TOGGLE_FLOATING_PANEL') {
        setIsVisible((prev) => !prev);
        sendResponse({ status: 'Panel visibility toggled' });
      } else if (message.type === 'WEBSOCKET_STATUS_UPDATE') {
        setConnectionStatus((prev) => ({
          ...prev,
          websocketStatus: message.payload.status.toUpperCase(),
          connected: message.payload.status === 'connected',
        }));
      } else if (message.type === 'ELEMENT_SELECTED') {
        setElementStatus((prev) => ({
          ...prev,
          [message.payload.elementType]: true,
        }));
      }
      return true;
    };

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(messageListener);

      // Request initial state
      chrome.runtime.sendMessage({ type: 'GET_FLOATING_PANEL_STATE' }, (response) => {
        if (response && typeof response.isVisible === 'boolean') {
          setIsVisible(response.isVisible);
        }
      });

      return () => chrome.runtime.onMessage.removeListener(messageListener);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'SET_FLOATING_PANEL_STATE',
        state: { isVisible: false },
      });
    }
  };

  const handleAutoDetect = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'AUTO_DETECT_ELEMENTS',
          });
        }
      });
    }
  };

  const handleStartSession = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      setConnectionStatus((prev) => ({ ...prev, aiSessionActive: true }));
      chrome.runtime.sendMessage({ type: 'START_AI_SESSION' });
    }
  };

  const handleEndSession = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      setConnectionStatus((prev) => ({ ...prev, aiSessionActive: false }));
      chrome.runtime.sendMessage({ type: 'END_AI_SESSION' });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Draggable handle=".drag-handle" nodeRef={nodeRef}>
      <div
        ref={nodeRef}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '300px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          color: 'white',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          zIndex: 10000,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="drag-handle"
          style={{
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'move',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🚀</span>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>The New Fuse</span>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <button
            onClick={() => setCurrentTab('status')}
            style={{
              flex: '1',
              padding: '8px',
              border: 'none',
              background: currentTab === 'status' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: 'white',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Status
          </button>
          <button
            onClick={() => setCurrentTab('controls')}
            style={{
              flex: '1',
              padding: '8px',
              border: 'none',
              background: currentTab === 'controls' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: 'white',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Controls
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          {currentTab === 'status' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                  Connection Status
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: connectionStatus.connected ? '#2ed573' : '#ff4757',
                    }}
                  ></div>
                  {connectionStatus.websocketStatus}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                  Elements
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}
                  >
                    <span>Input:</span>
                    <span>{elementStatus.inputField ? '✅' : '❌'}</span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}
                  >
                    <span>Button:</span>
                    <span>{elementStatus.sendButton ? '✅' : '❌'}</span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}
                  >
                    <span>Output:</span>
                    <span>{elementStatus.outputArea ? '✅' : '❌'}</span>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                  AI Session
                </div>
                <div
                  style={{
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    textAlign: 'center',
                  }}
                >
                  {connectionStatus.aiSessionActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          )}

          {currentTab === 'controls' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleAutoDetect}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #2ed573 0%, #17a085 100%)',
                  color: 'white',
                }}
              >
                🔍 Auto-Detect
              </button>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={handleStartSession}
                  disabled={connectionStatus.aiSessionActive}
                  style={{
                    flex: '1',
                    padding: '8px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '600',
                    cursor: connectionStatus.aiSessionActive ? 'not-allowed' : 'pointer',
                    background: connectionStatus.aiSessionActive
                      ? '#666'
                      : 'linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%)',
                    color: 'white',
                  }}
                >
                  🚀 Start
                </button>
                <button
                  onClick={handleEndSession}
                  disabled={!connectionStatus.aiSessionActive}
                  style={{
                    flex: '1',
                    padding: '8px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '600',
                    cursor: !connectionStatus.aiSessionActive ? 'not-allowed' : 'pointer',
                    background: !connectionStatus.aiSessionActive
                      ? '#666'
                      : 'linear-gradient(135deg, #ff5f6d 0%, #ffc371 100%)',
                    color: 'white',
                  }}
                >
                  🛑 End
                </button>
              </div>

              <button
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)',
                  color: 'white',
                }}
                onClick={() => {
                  if (typeof chrome !== 'undefined' && chrome.tabs) {
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                      if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                          type: 'VALIDATE_ELEMENTS',
                        });
                      }
                    });
                  }
                }}
              >
                ✅ Validate
              </button>
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
};

// Initialize the floating panel
const container = document.getElementById('floating-panel-root');
if (container) {
  const root = createRoot(container);
  root.render(<FloatingPanel />);
} else {
  console.error('Floating panel root container not found');
}

export default FloatingPanel;
