import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginModal.css';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, register, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters');
        return;
      }
      const result = await register({ email, username, password });
      if (result.success) {
        onClose();
      }
    } else {
      const result = await login({ email, password });
      if (result.success) {
        onClose();
      }
    }
  };

  const displayError = localError || error;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="login-close-button" onClick={onClose}>
          &times;
        </button>

        <div className="login-modal-header">
          <h2>{mode === 'login' ? '🎮 PLAYER LOGIN' : '🎮 CREATE ACCOUNT'}</h2>
          <p className="login-subtitle">
            {mode === 'login'
              ? 'Enter the arcade and start playing!'
              : 'Join the arcade and get 500 free tokens!'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@ai-arcade.xyz"
              required
              className="login-input"
            />
          </div>

          {mode === 'register' && (
            <div className="login-input-group">
              <label>USERNAME</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="arcade_player"
                required
                className="login-input"
              />
            </div>
          )}

          <div className="login-input-group">
            <label>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="login-input"
            />
          </div>

          {mode === 'register' && (
            <div className="login-input-group">
              <label>CONFIRM PASSWORD</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="login-input"
              />
            </div>
          )}

          {displayError && <div className="login-error">{displayError}</div>}

          <button type="submit" className="login-submit-button" disabled={isLoading}>
            {isLoading ? 'PROCESSING...' : mode === 'login' ? 'ENTER ARCADE' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="login-switch-mode">
          {mode === 'login' ? (
            <p>
              New player?{' '}
              <button onClick={() => setMode('register')} className="login-switch-button">
                Create Account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="login-switch-button">
                Login
              </button>
            </p>
          )}
        </div>

        <div className="login-divider">
          <span>OR CONTINUE AS GUEST</span>
        </div>

        <button className="login-guest-button" onClick={onClose}>
          🎮 Play as Guest
        </button>
      </div>
    </div>
  );
};

export default LoginModal;
