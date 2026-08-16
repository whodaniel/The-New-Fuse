import * as Tabs from '@radix-ui/react-tabs';
import { useCallback, useRef, useState } from 'react';
import { useBrowserState } from '../../hooks/useBrowserState';
import { useTnfAuthorization } from '../../hooks/useTnfAuthorization';
import { useTnfFederation } from '../../hooks/useTnfFederation';
import { AgentOrchestrator } from './AgentOrchestrator';
import { BrowserDetection } from './BrowserDetection';
import { ChannelManager } from './ChannelManager';
import { SecurityMonitor } from './SecurityMonitor';
import { TnfHarnessStatusBar } from './TnfHarnessStatusBar';

interface BrowserControlSurfaceProps {
  className?: string;
  debug?: boolean;
}

export function BrowserControlSurface({
  className = '',
  debug = false,
}: BrowserControlSurfaceProps) {
  const [activeTab, setActiveTab] = useState('federation');
  const {
    connected,
    agents,
    channels,
    sendMessage,
    connect,
    disconnect,
    heartbeatStatus,
    governanceStatus,
  } = useTnfFederation();

  const {
    currentUrl,
    targetElement,
    isControlling,
    controlState,
    startControl,
    stopControl,
    executeAction,
  } = useBrowserState();

  const { user, permissions, verifyPermissions } = useTnfAuthorization();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConnect = useCallback(async () => {
    await connect();
  }, [connect]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
  }, [disconnect]);

  const handleSendMessage = useCallback(
    async (channelId: string, content: string) => {
      await sendMessage({ channelId, content });
    },
    [sendMessage]
  );

  const handleExecuteAction = useCallback(
    async (action: any) => {
      await executeAction(action);
    },
    [executeAction]
  );

  if (!verifyPermissions('browser-control')) {
    return (
      <div className="tnf-browser-surface unauthorized">
        <h2>Permission Required</h2>
        <p>Browser control requires authorization. Please check tnf-agent-daemon status.</p>
        <SecurityMonitor />
      </div>
    );
  }

  return (
    <div className={`tnf-browser-surface ${className}`}>
      <TnfHarnessStatusBar
        connected={connected}
        heartbeatStatus={heartbeatStatus}
        governanceStatus={governanceStatus}
        user={user}
      />

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="tnf-tabs-list">
          <Tabs.Trigger className="tnf-tab-trigger" value="federation">
            🤝 Federation
          </Tabs.Trigger>
          <Tabs.Trigger className="tnf-tab-trigger" value="channels">
            📡 Channels
          </Tabs.Trigger>
          <Tabs.Trigger className="tnf-tab-trigger" value="agents">
            🤖 Agents
          </Tabs.Trigger>
          <Tabs.Trigger className="tnf-tab-trigger" value="control">
            🎯 Control
          </Tabs.Trigger>
          <Tabs.Trigger className="tnf-tab-trigger" value="harness">
            🔧 Harness
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content className="tnf-tab-content" value="federation">
          <BrowserDetection
            currentUrl={currentUrl}
            isControlling={isControlling}
            onStartControl={startControl}
            onStopControl={stopControl}
          />

          <div className="tnf-connection-panel">
            {connected ? (
              <button onClick={handleDisconnect} className="btn btn-disconnect">
                Disconnect from Relay
              </button>
            ) : (
              <button onClick={handleConnect} className="btn btn-connect">
                Connect to TNF Relay
              </button>
            )}
          </div>
        </Tabs.Content>

        <Tabs.Content className="tnf-tab-content" value="channels">
          <ChannelManager
            channels={channels}
            onSendMessage={handleSendMessage}
            connected={connected}
          />
        </Tabs.Content>

        <Tabs.Content className="tnf-tab-content" value="agents">
          <AgentOrchestrator
            agents={agents}
            onExecuteAction={handleExecuteAction}
            connected={connected}
          />
        </Tabs.Content>

        <Tabs.Content className="tnf-tab-content" value="control">
          <div className="tnf-control-panel">
            <h3>Browser Control</h3>
            <p>Current URL: {currentUrl || 'Not detected'}</p>
            <p>Status: {controlState}</p>

            <div className="tnf-controls">
              <button
                onClick={() => handleExecuteAction({ type: 'navigate', url: 'https://google.com' })}
                disabled={!connected}
              >
                Navigate to Google
              </button>
              <button
                onClick={() => handleExecuteAction({ type: 'click', selector: 'body' })}
                disabled={!isControlling}
              >
                Click Body
              </button>
              <button
                onClick={() => handleExecuteAction({ type: 'type', text: 'Hello from TNF' })}
                disabled={!isControlling}
              >
                Type Message
              </button>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content className="tnf-tab-content" value="harness">
          <SecurityMonitor
            heartbeatStatus={heartbeatStatus}
            governanceStatus={governanceStatus}
            permissions={permissions}
          />

          <div className="tnf-harness-info">
            <h3>TNF Harness Protocol</h3>
            <ul>
              <li>Inspect → Act → Verify pattern enforced</li>
              <li>Terminal heartbeat monitoring active</li>
              <li>Slash-command guard enabled</li>
              <li>Coordination poll verification</li>
            </ul>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
