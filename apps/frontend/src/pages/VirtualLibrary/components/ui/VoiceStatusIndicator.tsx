import { useLibraryStore } from '../../store';

export default function VoiceStatusIndicator() {
  const relayStatus = useLibraryStore((s) => s.relayStatus);

  const getStatusColor = () => {
    switch (relayStatus) {
      case 'connected':
        return '#00ff00';
      case 'connecting':
        return '#ffb84d';
      case 'error':
        return '#ff3333';
      case 'disconnected':
        return '#666666';
      default:
        return '#666666';
    }
  };

  const getStatusText = () => {
    switch (relayStatus) {
      case 'connected':
        return 'Relay Connected';
      case 'connecting':
        return 'Connecting to Relay...';
      case 'error':
        return 'Relay Error';
      case 'disconnected':
        return 'Relay Disconnected';
      default:
        return 'Offline';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 100,
        background: 'rgba(10, 10, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(138, 117, 96, 0.3)',
        borderRadius: '8px',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#f0d9b5',
        fontSize: '12px',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div
          style={{
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '10px',
            color: '#8a7560',
          }}
        >
          Voice Engine Status
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: getStatusColor(),
              boxShadow: `0 0 8px ${getStatusColor()}`,
            }}
          />
          <span style={{ color: getStatusColor() }}>{getStatusText()}</span>
        </div>
        <div style={{ fontSize: '10px', color: '#8a7560', marginTop: '2px' }}>
          Routing: {relayStatus === 'connected' ? 'Local KWS (Port 43110)' : 'N/A'}
        </div>
      </div>
    </div>
  );
}
