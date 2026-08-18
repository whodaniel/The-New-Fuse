import { useEffect, useState } from 'react';

interface SecurityMonitorProps {
  heartbeatStatus: 'healthy' | 'degraded' | 'not-connected';
  governanceStatus: Record<string, boolean>;
  permissions: Record<string, boolean>;
}

interface SecurityEvent {
  timestamp: string;
  type: 'heartbeat_missed' | 'gate_violation' | 'permission_denied' | 'safe_mode';
  details: string;
  resolved: boolean;
}

export function SecurityMonitor({
  heartbeatStatus,
  governanceStatus,
  permissions,
}: SecurityMonitorProps) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [lastCheck, setLastCheck] = useState<string>(new Date().toISOString());

  useEffect(() => {
    const checkInterval = setInterval(() => {
      setLastCheck(new Date().toISOString());

      if (heartbeatStatus === 'not-connected') {
        setEvents((prev) => [
          {
            timestamp: new Date().toISOString(),
            type: 'heartbeat_missed',
            details: 'Terminal heartbeat signal not received from relay',
            resolved: false,
          },
          ...prev.slice(0, 4),
        ]);
      }
    }, 30000);

    return () => clearInterval(checkInterval);
  }, [heartbeatStatus]);

  const getHeartbeatDisplay = () => {
    switch (heartbeatStatus) {
      case 'healthy':
        return <span className="status-indicator healthy">✅ Healthy</span>;
      case 'degraded':
        return <span className="status-indicator warning">⚠️ Degraded</span>;
      default:
        return <span className="status-indicator error">❌ Not Connected</span>;
    }
  };

  const getGovernanceStatus = () => {
    const gates = Object.entries(governanceStatus || {});
    const requiredGates = ['TENANT_SCOPE_GATE', 'TRACE_CONTINUITY_GATE', 'CHANNEL_MEMBERSHIP_GATE'];
    const missingGates = requiredGates.filter((gate) => !gates.find(([key]) => key === gate)?.[1]);

    if (missingGates.length > 0) {
      return (
        <div className="governance-warning">
          <p>Missing gate decisions: {missingGates.join(', ')}</p>
        </div>
      );
    }

    return <span className="status-indicator healthy">✅ All Gates Passed</span>;
  };

  const getPermissionStatus = () => {
    const requiredPermissions = ['browser-control', 'federation-connect'];
    const missing = requiredPermissions.filter((p) => !permissions?.[p]);

    if (missing.length > 0) {
      return (
        <div className="permission-warning">
          <p>Missing permissions: {missing.join(', ')}</p>
        </div>
      );
    }

    return <span className="status-indicator healthy">✅ All Permissions Granted</span>;
  };

  return (
    <div className="tnf-security-monitor">
      <h3>Security & Governance</h3>

      <div className="security-section">
        <h4>Terminal Heartbeat</h4>
        {getHeartbeatDisplay()}
        <p className="last-check">Last check: {lastCheck}</p>
      </div>

      <div className="security-section">
        <h4>Governance Gates</h4>
        {getGovernanceStatus()}
      </div>

      <div className="security-section">
        <h4>Permissions</h4>
        {getPermissionStatus()}
      </div>

      <div className="security-events">
        <h4>Recent Events ({events.length})</h4>
        {events.length === 0 ? (
          <p>No security events</p>
        ) : (
          <ul className="events-list">
            {events.map((event, idx) => (
              <li key={idx} className={`event-item ${event.resolved ? 'resolved' : 'active'}`}>
                <span className="event-type">{event.type}</span>
                <span className="event-timestamp">{event.timestamp}</span>
                <span className="event-details">{event.details}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="protocol-info">
        <h4>TNF Harness Protocol</h4>
        <ul>
          <li>✅ Inspect → Act → Verify pattern</li>
          <li>✅ Terminal heartbeat monitoring</li>
          <li>✅ Slash-command guard enabled</li>
          <li>✅ Coordination poll verification</li>
          <li>✅ AppleScript circuit breaker</li>
        </ul>
      </div>
    </div>
  );
}
