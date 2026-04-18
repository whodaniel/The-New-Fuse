/**
 * Unstoppable Domains Login Component
 * UI for authentication with Unstoppable Domains
 */

import React, { useState, useEffect } from 'react';
import { unstoppableAuth, UnstoppableUser } from '../auth/unstoppable-domains-auth';

interface UnstoppableLoginProps {
  onLoginSuccess?: (user: UnstoppableUser) => void;
  onLoginError?: (error: Error) => void;
  onLogout?: () => void;
}

export const UnstoppableLogin: React.FC<UnstoppableLoginProps> = ({
  onLoginSuccess,
  onLoginError,
  onLogout,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UnstoppableUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = () => {
      if (unstoppableAuth.isAuthenticated()) {
        setIsAuthenticated(true);
        setUser(unstoppableAuth.getUser());
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const userData = await unstoppableAuth.loginWithPopup();
      setIsAuthenticated(true);
      setUser(userData);

      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);

      if (onLoginError && err instanceof Error) {
        onLoginError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await unstoppableAuth.logout();
    setIsAuthenticated(false);
    setUser(null);
    setError(null);

    if (onLogout) {
      onLogout();
    }
  };

  if (loading) {
    return (
      <div className="ud-login-container loading">
        <div className="ud-spinner"></div>
        <p>Connecting to Unstoppable Domains...</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="ud-login-container authenticated">
        <div className="ud-user-info">
          {user.picture && (
            <img src={user.picture} alt={user.sub} className="ud-user-avatar" />
          )}
          <div className="ud-user-details">
            <h3 className="ud-domain-name">{user.sub}</h3>
            {user.wallet_address && (
              <p className="ud-wallet-address">
                {user.wallet_address.substring(0, 6)}...
                {user.wallet_address.substring(user.wallet_address.length - 4)}
              </p>
            )}
            {user.email && <p className="ud-email">{user.email}</p>}
          </div>
        </div>

        {user.verified_addresses && user.verified_addresses.length > 0 && (
          <div className="ud-verified-addresses">
            <h4>Verified Addresses</h4>
            <ul>
              {user.verified_addresses.map((addr, index) => (
                <li key={index}>
                  <span className="ud-chain-symbol">{addr.symbol}</span>
                  <span className="ud-address">
                    {addr.address.substring(0, 6)}...
                    {addr.address.substring(addr.address.length - 4)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button onClick={handleLogout} className="ud-logout-button">
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="ud-login-container">
      <div className="ud-login-header">
        <div className="ud-logo">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="#4C47F7" />
            <path
              d="M12 14C12 12.8954 12.8954 12 14 12H26C27.1046 12 28 12.8954 28 14V26C28 27.1046 27.1046 28 26 28H14C12.8954 28 12 27.1046 12 26V14Z"
              fill="white"
            />
          </svg>
        </div>
        <h2>Sign in with Unstoppable</h2>
        <p className="ud-description">
          Use your Web3 domain to authenticate
        </p>
      </div>

      {error && (
        <div className="ud-error-message">
          <span className="ud-error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <button onClick={handleLogin} className="ud-login-button" disabled={loading}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect width="20" height="20" rx="4" fill="white" />
          <path
            d="M6 7C6 6.44772 6.44772 6 7 6H13C13.5523 6 14 6.44772 14 7V13C14 13.5523 13.5523 14 13 14H7C6.44772 14 6 13.5523 6 13V7Z"
            fill="#4C47F7"
          />
        </svg>
        <span>Login with Unstoppable</span>
      </button>

      <div className="ud-benefits">
        <h4>Why use Unstoppable Domains?</h4>
        <ul>
          <li>✓ Own your identity</li>
          <li>✓ No passwords needed</li>
          <li>✓ Multi-chain support</li>
          <li>✓ Privacy-focused</li>
        </ul>
      </div>

      <div className="ud-footer">
        <p>
          Don't have a domain?{' '}
          <a
            href="https://unstoppabledomains.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get one now
          </a>
        </p>
      </div>
    </div>
  );
};

export default UnstoppableLogin;
