import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserProfile.css';

interface UserProfileProps {
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user, logout, updateTokens } = useAuth();
  const [showBuyTokens, setShowBuyTokens] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(500);

  const handleBuyTokens = async () => {
    await updateTokens(tokenAmount);
    setShowBuyTokens(false);
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  if (!user) {
    return (
      <div className="user-profile-overlay" onClick={onClose}>
        <div className="user-profile-content" onClick={(e) => e.stopPropagation()}>
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile-content" onClick={(e) => e.stopPropagation()}>
        <button className="profile-close-button" onClick={onClose}>
          &times;
        </button>

        <div className="profile-header">
          <div className="profile-avatar">{user.username.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <h2>{user.username}</h2>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-icon">🪙</div>
            <div className="stat-details">
              <span className="stat-value">{user.tokens.toLocaleString()}</span>
              <span className="stat-label">Arcade Tokens</span>
            </div>
            <button className="add-tokens-button" onClick={() => setShowBuyTokens(true)}>
              + Add
            </button>
          </div>
        </div>

        {showBuyTokens && (
          <div className="buy-tokens-section">
            <h3>Buy Tokens</h3>
            <div className="token-packages">
              {[500, 1000, 2500, 5000].map((amount) => (
                <button
                  key={amount}
                  className={`token-package ${tokenAmount === amount ? 'selected' : ''}`}
                  onClick={() => setTokenAmount(amount)}
                >
                  <span className="token-amount">{amount.toLocaleString()}</span>
                  <span className="token-price">${(amount * 0.01).toFixed(2)}</span>
                </button>
              ))}
            </div>
            <div className="buy-tokens-actions">
              <button className="cancel-button" onClick={() => setShowBuyTokens(false)}>
                Cancel
              </button>
              <button className="confirm-button" onClick={handleBuyTokens}>
                Buy {tokenAmount.toLocaleString()} Tokens
              </button>
            </div>
          </div>
        )}

        <div className="subscriptions-section">
          <h3>Active Subscriptions</h3>
          {user.subscriptions.length === 0 ? (
            <p className="no-subscriptions">
              No active subscriptions. Explore agents to subscribe!
            </p>
          ) : (
            <div className="subscriptions-list">
              {user.subscriptions.map((sub) => (
                <div key={sub.id} className="subscription-item">
                  <div className="subscription-info">
                    <span className="subscription-name">{sub.agentName}</span>
                    <span className={`subscription-status ${sub.status}`}>{sub.status}</span>
                  </div>
                  <span className="subscription-date">
                    Since {new Date(sub.startDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profile-actions">
          <button className="settings-button">⚙️ Settings</button>
          <button className="logout-button" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
