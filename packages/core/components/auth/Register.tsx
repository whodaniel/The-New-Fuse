import React, { FC, useState, JSX } from 'react';

export interface RegisterProps {
  onRegister?: (data: { email: string; password: string; name: string }) => void;
  onSwitchToLogin?: () => void;
}

export const Register: FC<RegisterProps> = ({ onRegister, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister?.({ email, password, name });
  };
  return (
    <form onSubmit={handleSubmit} className="tnf-register" data-testid="register-form">
      <h2>Register</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
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
      <button type="submit">Create Account</button>
      {onSwitchToLogin && (
        <button type="button" onClick={onSwitchToLogin}>
          Sign In
        </button>
      )}
    </form>
  );
};
export default Register;
