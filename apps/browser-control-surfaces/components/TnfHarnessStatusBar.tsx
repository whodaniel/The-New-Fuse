import { TnfUser } from '../hooks/useTnfAuthorization';

interface TnfHarnessStatusBarProps {
  connected: boolean;
  heartbeatStatus: 'healthy' | 'degraded' | 'not-connected';
  governanceStatus: Record<string, boolean>;
  user: TnfUser | null;
}

export function TnfHarnessStatusBar({
  connected,
  heartbeatStatus,
  governanceStatus,
  user,
}: TnfHarnessStatusBarProps) {
  const getHeartbeatColor = () => {
    switch (heartbeatStatus) {
      case 'healthy':
        return '#10b981';
      case 'degraded':
        return '#f59e0b';
      default:
        return '#ef4444';
    }
  };

  const getGovernanceHealth = () => {
    const gates = Object.values(governanceStatus || {});
    return gates.every((g) => g === true);
  };

  return (
    <div className="tnf-harness-status-bar">
      <div className="status-section">
        <span className="status-label">Federation:</span>
        <span className={`status-value ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="status-section">
        <span className="status-label">Heartbeat:</span>
        <span className="status-indicator" style={{ color: getHeartbeatColor() }}>
          {heartbeatStatus === 'healthy' && '✅'}
          {heartbeatStatus === 'degraded' && '⚠️'}
          {heartbeatStatus === 'not-connected' && '❌'}
        </span>
      </div>

      <div className="status-section">
        <span className="status-label">Governance:</span>
        <span className={`status-value ${getGovernanceHealth() ? 'healthy' : 'unhealthy'}`}>
          {getGovernanceHealth() ? '✅ OK' : '⚠️ Issues'}
        </span>
      </div>

      {user && (
        <div className="status-section user-info">
          <span className="user-role">{user.role}</span>
          <span className="user-email">{user.email}</span>
        </div>
      )}

      <div className="status-section version">
        <span>TNF v2.0</span>
      </div>
    </div>
  );
}
