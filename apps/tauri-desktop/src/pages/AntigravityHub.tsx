/**
 * Antigravity Agent Hub
 *
 * Premium control center for the Antigravity AI Agent
 * Integrates browser automation, cascade management, and screen recording
 */

import React, { useCallback, useEffect, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import { useModalA11y } from '../hooks/useModalA11y';
import { AntigravityService, type AntigravityStatus, type PageInfo } from '../services';

// ============================================================================
// TYPES
// ============================================================================

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (serverAddress: string, csrfToken: string) => void;
}

// ============================================================================
// CONNECTION MODAL
// ============================================================================

const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [serverAddress, setServerAddress] = useState('http://localhost:3000');
  const [csrfToken, setCsrfToken] = useState('');
  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="antigravity-connect-title"
      >
        <div className="modal-header">
          <h2 id="antigravity-connect-title">🔮 Connect to Antigravity</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label>Server Address</label>
            <input
              type="url"
              value={serverAddress}
              onChange={(e) => setServerAddress(e.target.value)}
              placeholder="http://localhost:3000"
            />
          </div>
          <div className="form-group">
            <label>CSRF Token (optional)</label>
            <input
              type="password"
              value={csrfToken}
              onChange={(e) => setCsrfToken(e.target.value)}
              placeholder="Enter CSRF token if required"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onConnect(serverAddress, csrfToken)}
          >
            Connect
          </button>
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          .modal-container {
            background: linear-gradient(135deg, rgba(26, 27, 38, 0.95), rgba(36, 37, 48, 0.95));
            border: 1px solid rgba(138, 43, 226, 0.3);
            border-radius: 16px;
            width: 100%;
            max-width: 480px;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
          }
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .modal-header h2 {
            font-size: 1.25rem;
            color: #fff;
            margin: 0;
          }
          .close-btn {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            font-size: 24px;
            cursor: pointer;
            padding: 0;
          }
          .close-btn:hover {
            color: #fff;
          }
          .modal-content {
            padding: 24px;
          }
          .form-group {
            margin-bottom: 16px;
          }
          .form-group label {
            display: block;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
            margin-bottom: 8px;
          }
          .form-group input {
            width: 100%;
            padding: 12px 16px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #fff;
            font-size: 1rem;
          }
          .form-group input:focus {
            outline: none;
            border-color: rgba(138, 43, 226, 0.5);
          }
          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 16px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          .btn-primary {
            background: linear-gradient(135deg, #8B5CF6, #6366F1);
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
          }
          .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AntigravityHub: React.FC = () => {
  const [status, setStatus] = useState<AntigravityStatus | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    // Subscribe to Antigravity events
    const unsubConnected = AntigravityService.on('connected', () => {
      loadData();
    });

    const unsubDisconnected = AntigravityService.on('disconnected', () => {
      setStatus(null);
      setPages([]);
    });

    const unsubStatusChanged = AntigravityService.on<AntigravityStatus>(
      'status_changed',
      (newStatus) => {
        if (newStatus) setStatus(newStatus);
      }
    );

    // Initial load if already connected
    if (AntigravityService.isConnected()) {
      loadData();
    }

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubStatusChanged();
    };
  }, []);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadData = useCallback(async () => {
    const [statusData, pagesData] = await Promise.all([
      AntigravityService.getStatus(),
      AntigravityService.listPages(),
    ]);
    setStatus(statusData);
    setPages(pagesData);
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleConnect = async (serverAddress: string, csrfToken: string) => {
    setIsConnecting(true);
    setShowConnectionModal(false);

    try {
      const connected = await AntigravityService.initialize({
        serverAddress,
        csrfToken,
      });

      if (connected) {
        await loadData();
      }
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await AntigravityService.disconnect();
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const handleStartRecording = async () => {
    const success = await AntigravityService.startScreenRecording('demo-conversation');
    if (success) setIsRecording(true);
  };

  const handleStopRecording = async () => {
    const recording = await AntigravityService.stopScreenRecording('recording.webm');
    if (recording) setIsRecording(false);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const isConnected = status?.connected || false;

  return (
    <PageShell
      title="Antigravity"
      subtitle="Agent and user browser bridge — cascade automation and screen recording"
      actions={
        <>
          <button
            type="button"
            className={`secondary-button ${isConnected ? 'env-badge local' : ''}`}
            onClick={() => !isConnected && setShowConnectionModal(true)}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting…' : isConnected ? 'Connected' : 'Connect'}
          </button>
          {isConnected ? (
            <>
              <button
                type="button"
                className="ghost-button"
                onClick={handleRefresh}
                title="Refresh"
              >
                Refresh
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleDisconnect}
                title="Disconnect"
              >
                Disconnect
              </button>
            </>
          ) : null}
        </>
      }
    >
      <SynergyStatusBar />
      <div className="antigravity-hub">
        {/* Status Card */}
        <div className="status-card">
          <div className="status-header">
            <h2>System Status</h2>
            {status && (
              <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}>
                {isConnected ? '● Online' : '○ Offline'}
              </span>
            )}
          </div>

          {status ? (
            <div className="status-grid">
              <div className="stat-item">
                <span className="stat-value">{status.statusCode}</span>
                <span className="stat-label">Status Code</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{pages.length}</span>
                <span className="stat-label">Active Pages</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{status.version || 'N/A'}</span>
                <span className="stat-label">Version</span>
              </div>
              <div className="stat-item full-width">
                <span className="stat-message">{status.message}</span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>Connect to Antigravity to view system status</p>
              <button
                className="btn-primary"
                onClick={() => setShowConnectionModal(true)}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect Now'}
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {isConnected && (
          <div className="quick-actions">
            <div className="section-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="actions-grid">
              <button
                className={`action-card ${isRecording ? 'active' : ''}`}
                onClick={isRecording ? handleStopRecording : handleStartRecording}
              >
                <span className="action-icon">{isRecording ? '⏹' : '⏺'}</span>
                <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
              </button>
              <button className="action-card">
                <span className="action-icon">📋</span>
                <span>List Pages</span>
              </button>
              <button className="action-card">
                <span className="action-icon">🎯</span>
                <span>Focus Conversation</span>
              </button>
              <button className="action-card">
                <span className="action-icon">⛔</span>
                <span>Cancel Cascade</span>
              </button>
            </div>
          </div>
        )}

        {/* Pages List */}
        {isConnected && pages.length > 0 && (
          <div className="pages-section">
            <div className="section-header">
              <h2>Managed Pages</h2>
              <span className="badge">{pages.length}</span>
            </div>
            <div className="pages-list">
              {pages.map((page) => (
                <div key={page.id} className="page-card">
                  <div className="page-favicon">
                    {page.favicon ? <img src={page.favicon} alt="" /> : <span>🌐</span>}
                  </div>
                  <div className="page-info">
                    <h3>{page.title || 'Untitled'}</h3>
                    <p>{page.url}</p>
                  </div>
                  <div className={`page-status ${page.active ? 'active' : ''}`}>
                    {page.active ? '● Active' : '○ Idle'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection Modal */}
        <ConnectionModal
          isOpen={showConnectionModal}
          onClose={() => setShowConnectionModal(false)}
          onConnect={handleConnect}
        />

        {/* Styles */}
        <style>{`
        .antigravity-hub {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hub-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .icon-glow {
          font-size: 48px;
          filter: drop-shadow(0 0 20px rgba(138, 43, 226, 0.6));
        }

        .header-title h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
          margin: 4px 0 0 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .status-badge.connected {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .status-badge.disconnected {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .status-badge.disconnected:hover {
          background: linear-gradient(135deg, #8B5CF6, #6366F1);
          color: #fff;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .status-badge.connected .status-dot {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }

        .icon-btn.danger:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .status-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .status-header h2 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .status-indicator {
          font-size: 0.85rem;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 12px;
        }

        .status-indicator.online {
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .status-indicator.offline {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.4);
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .stat-item {
          background: rgba(255, 255, 255, 0.02);
          padding: 16px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-item.full-width {
          grid-column: span 3;
          margin-top: 8px;
          background: rgba(255, 255, 255, 0.01);
          border-style: dashed;
        }

        .stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.75rem;
          font-weight: 700;
          color: #a78bfa;
          filter: drop-shadow(0 0 10px rgba(167, 139, 250, 0.3));
        }

        .stat-label {
          font-size: 0.75rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }

        .stat-message {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }

        .empty-state {
          text-align: center;
          padding: 32px;
        }

        .empty-state p {
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 16px;
        }

        .quick-actions,
        .pages-section {
          margin-bottom: 24px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .section-header h2 {
          font-size: 1.1rem;
          color: #fff;
          margin: 0;
        }

        .badge {
          background: rgba(138, 43, 226, 0.3);
          color: #a78bfa;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px;
          background: linear-gradient(135deg, rgba(26, 27, 38, 0.9), rgba(36, 37, 48, 0.9));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-card:hover {
          border-color: rgba(138, 43, 226, 0.4);
          transform: translateY(-2px);
        }

        .action-card.active {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .action-icon {
          font-size: 28px;
        }

        .pages-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .page-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(26, 27, 38, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          transition: all 0.2s;
        }

        .page-card:hover {
          background: rgba(26, 27, 38, 0.8);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .page-favicon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .page-favicon img {
          width: 20px;
          height: 20px;
        }

        .page-info {
          flex: 1;
          min-width: 0;
        }

        .page-info h3 {
          font-size: 0.95rem;
          color: #fff;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .page-info p {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .page-status {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
        }

        .page-status.active {
          color: #22c55e;
        }

        @media (max-width: 768px) {
          .actions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .status-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .stat-item.full-width {
            grid-column: span 2;
          }
        }
      `}</style>
      </div>
    </PageShell>
  );
};

export default AntigravityHub;
