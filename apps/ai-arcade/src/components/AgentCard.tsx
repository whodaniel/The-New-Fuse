import React, { useState } from 'react';
import type { AgentListing } from '../services/ArcadeService';
import './AgentCard.css';

interface AgentCardProps {
  agent: AgentListing;
  onSelect: (agent: AgentListing) => void;
  onAction: (agent: AgentListing) => void;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  const stars: React.ReactNode[] = [];

  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <span key={i} className="star star-full">
          ★
        </span>
      );
    } else if (i === full && hasHalf) {
      stars.push(
        <span key={i} className="star star-half">
          ★
        </span>
      );
    } else {
      stars.push(
        <span key={i} className="star star-empty">
          ★
        </span>
      );
    }
  }

  return (
    <div className="star-rating" title={`${rating.toFixed(1)} / 5`}>
      {stars}
    </div>
  );
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect, onAction }) => {
  const actionLabel = agent.experienceKind === 'music' ? 'LISTEN' : 'PLAY';
  const priceLabel =
    agent.experienceKind === 'music' || agent.pricePerRun === 0
      ? 'FREE EXPERIENCE'
      : `$${agent.pricePerRun}/run`;

  const isMusic = agent.experienceKind === 'music';
  const cardClass = `agent-arcade-card ${isMusic ? 'agent-card-music' : ''}`;

  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className={cardClass}
      onClick={() => onSelect(agent)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(agent);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="agent-type-tag">{agent.type}</div>
      {isMusic && <div className="agent-mode-tag">MUSIC APP</div>}
      <div className="agent-avatar-container">
        <div className="agent-avatar-glow"></div>
        {agent.avatarUrl && !imgFailed ? (
          <img
            className="agent-avatar-img"
            src={agent.avatarUrl}
            alt={agent.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="agent-avatar-placeholder">{agent.name.charAt(0)}</div>
        )}
      </div>
      <h3 className="agent-name">{agent.name}</h3>
      <StarRating rating={agent.rating} />
      <p className="agent-description">{agent.description}</p>
      {isMusic && (
        <div className="agent-music-bars" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      )}
      <div className="agent-stats-row">
        <span className="agent-stat">{agent.totalRuns.toLocaleString()} runs</span>
        <span className="agent-stat">{agent.successRate.toFixed(1)}% success</span>
      </div>
      <div className="agent-footer">
        <div className="agent-price">{priceLabel}</div>
        <button
          className={`play-button ${isMusic ? 'play-button-music' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onAction(agent);
          }}
        >
          {isMusic && <span className="play-icon">🎧</span>}
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export default AgentCard;
