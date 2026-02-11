import React from 'react';
import { AgentListing } from '../services/ArcadeService';
import './AgentDetailModal.css';
import { PayPalButton } from './PayPalButton';

interface AgentDetailModalProps {
  agent: AgentListing;
  onClose: () => void;
  onSuccess: (id: string) => void;
}

const AgentDetailModal: React.FC<AgentDetailModalProps> = ({ agent, onClose, onSuccess }) => {
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
            <div className="price-tag">${agent.pricePerRun} / RUN</div>
            <p className="price-detail">
              Requires an active subscription to access via remote MCP.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <h4 className="unlock-title">UNLOCK INSTANCE</h4>
          <PayPalButton
            planId={agent.payPalPlanId || 'P-3WD251534W148423SNFXJQVI'}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentDetailModal;
