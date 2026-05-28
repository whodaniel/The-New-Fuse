import React, { FC, useState, JSX } from 'react';

export interface LoginProps {
  onLogin?: (credentials: { email: string; password: string }) => void;
  onSwitchToRegister?: () => void;
}

export const Login: FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin?.({ email, password });
  };
  return (
    <form onSubmit={handleSubmit} className="tnf-login" data-testid="login-form">
      <h2>Login</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Sign In</button>
      {onSwitchToRegister && (
        <button type="button" onClick={onSwitchToRegister}>
          Create Account
        </button>
      )}
    </form>
  );
};
export default Login;
