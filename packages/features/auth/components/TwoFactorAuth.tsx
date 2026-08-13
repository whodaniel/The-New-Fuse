import React, { FC, useState } from 'react';

export interface TwoFactorAuthProps {
  onVerify?: (code: string) => void;
  onResend?: () => void;
}

export const TwoFactorAuth: FC<TwoFactorAuthProps> = ({ onVerify, onResend }) => {
  const [code, setCode] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify?.(code);
  };
  return (
    <form onSubmit={handleSubmit} className="tnf-2fa" data-testid="2fa-form">
      <h2>Two-Factor Authentication</h2>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Verification Code"
        maxLength={6}
        required
      />
      <button type="submit">Verify</button>
      {onResend && (
        <button type="button" onClick={onResend}>
          Resend Code
        </button>
      )}
    </form>
  );
};
export default TwoFactorAuth;
