import React from 'react';
import './AgentCard.css';
import { AgentListing } from '../services/ArcadeService';

interface AgentCardProps {
  agent: AgentListing;
  onSelect: (agent: AgentListing) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect }) => {
  return (
    <div className="agent-arcade-card" onClick={() => onSelect(agent)}>
      <div className="agent-type-tag">{agent.type}</div>
      <div className="agent-avatar-container">
        <div className="agent-avatar-glow"></div>
        <div className="agent-avatar-placeholder">
          {agent.name.charAt(0)}
        </div>
      </div>
      <h3 className="agent-name">{agent.name}</h3>
      <p className="agent-description">{agent.description}</p>
      <div className="agent-footer">
        <div className="agent-price">${agent.pricePerRun}/run</div>
        <button className="play-button">PLAY</button>
      </div>
    </div>
  );
};

export default AgentCard;
