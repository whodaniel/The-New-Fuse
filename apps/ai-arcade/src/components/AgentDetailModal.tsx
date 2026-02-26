import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AgentListing } from '../services/ArcadeService';
import './AgentDetailModal.css';
import { PayPalButton } from './PayPalButton';

interface AgentDetailModalProps {
  agent: AgentListing;
  onClose: () => void;
  onSuccess: (id: string) => void;
  onPlay?: () => void;
}

const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  agent,
  onClose,
  onSuccess,
  onPlay,
}) => {
  const { isAuthenticated } = useAuth();
  const isExternalExperience = agent.experienceKind === 'music' || agent.experienceKind === 'app';
  const actionText = isExternalExperience ? 'Launch Experience' : 'Play Now';
  const priceText = isExternalExperience ? 'FREE / OPEN' : `$${agent.pricePerRun} / RUN`;
  const priceDetail = isExternalExperience
    ? 'Opens a dedicated app experience in a new tab.'
    : 'Requires an active subscription to access via remote MCP.';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>

        <div className="modal-header">
          <div className="agent-avatar-placeholder large">{agent.name.charAt(0)}</div>
          <div className="header-text">
            <h2>{agent.name}</h2>
            <span className="type-badge">{agent.type}</span>
          </div>
        </div>

        <div className="modal-body">
          <p className="description-long">{agent.description}</p>

          <div className="capabilities-list">
            <h4>CAPABILITIES</h4>
            <ul>
              {agent.capabilities.map((cap) => (
                <li key={cap}>{cap.replace('_', ' ')}</li>
              ))}
            </ul>
          </div>

          <div className="pricing-box">
            <div className="price-tag">{priceText}</div>
            <p className="price-detail">{priceDetail}</p>
          </div>
        </div>

        <div className="modal-footer">
          {isExternalExperience || isAuthenticated ? (
            <>
              <button className="play-now-button" onClick={onPlay}>
                🎮 {actionText}
              </button>
              {!isExternalExperience ? (
                <div className="subscription-section">
                  <h4 className="unlock-title">UNLOCK INSTANCE</h4>
                  <PayPalButton
                    planId={agent.payPalPlanId || 'P-3WD251534W148423SNFXJQVI'}
                    onSuccess={onSuccess}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="login-prompt">
              <p>Login to play with this agent</p>
              <button className="login-prompt-button" onClick={onClose}>
                Close & Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDetailModal;
