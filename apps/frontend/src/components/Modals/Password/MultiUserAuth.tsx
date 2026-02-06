import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RecoveryCodeModal } from '../../../components/Modals/DisplayRecoveryCodeModal/DisplayRecoveryCodeModal';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { useModal } from '../../../hooks/useModal';
import System from '../../../models/system';
import { LOCAL_STORAGE_KEYS } from '../../../utils/constants';
import paths from '../../../utils/paths';
import { showErrorToast, showSuccessToast } from '../../../utils/toast';

interface RecoveryResponse {
  success: boolean;
  resetToken: string | null;
  error: string | null;
}

interface RecoveryFormProps {
  onSubmit: (username: string, recoveryCodes: string[]) => void;
  setShowRecoveryForm: (show: boolean) => void;
}

interface ResetPasswordFormProps {
  onSubmit: (newPassword: string, confirmPassword: string) => void;
}

const RecoveryForm: React.FC<RecoveryFormProps> = ({ onSubmit, setShowRecoveryForm }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [recoveryCodeInputs, setRecoveryCodeInputs] = useState<string[]>(Array(2).fill(''));

  const handleRecoveryCodeChange = (index: number, value: string) => {
    const updatedCodes = [...recoveryCodeInputs];
    updatedCodes[index] = value;
    setRecoveryCodeInputs(updatedCodes);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const recoveryCodes = recoveryCodeInputs.filter((code) => code.trim() !== '');
    onSubmit(username, recoveryCodes);
  };

  return (
    <div className="w-full max-w-md">
      <DialogHeader>
        <DialogTitle>{t('login.password-reset.title')}</DialogTitle>
        <DialogDescription>{t('login.password-reset.description')}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium">
            {t('login.multi-user.placeholder-username')}
          </label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder={t('login.multi-user.placeholder-username')}
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('login.password-reset.recovery-codes')}</label>
          {recoveryCodeInputs.map((code, index) => (
            <Input
              key={index}
              type="text"
              name={`recoveryCode${index + 1}`}
              placeholder={t('login.password-reset.recovery-code', {
                index: index + 1,
              })}
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleRecoveryCodeChange(index, e.target.value)
              }
              required
            />
          ))}
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button type="submit">{t('login.password-reset.title')}</Button>
          <Button type="button" variant="ghost" onClick={() => setShowRecoveryForm(false)}>
            {t('login.password-reset.back')}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
};

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSubmit }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(newPassword, confirmPassword);
  };

  return (
    <div className="w-full max-w-md">
      <DialogHeader>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogDescription>Enter your new password.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <label htmlFor="newPassword">New Password</label>
          <Input
            id="newPassword"
            type="password"
            name="newPassword"
            placeholder="New Password"
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <Input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfirmPassword(e.target.value)
            }
            required
          />
        </div>
        <DialogFooter>
          <Button type="submit">Reset Password</Button>
        </DialogFooter>
      </form>
    </div>
  );
};

export default function MultiUserAuth() {
  const { t } = useTranslation();
  const {
    isOpen: isRecoveryModalOpen,
    openModal: openRecoveryModal,
    closeModal: closeRecoveryModal,
  } = useModal();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [appName, setAppName] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppName = async () => {
      const result = await System.keys();
      setAppName(result.appName);
    };
    fetchAppName();
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const { valid, user, token, message, recoveryCodes } = await System.login(username, password);
    if (valid && !!token) {
      if (recoveryCodes) {
        setRecoveryCodes(recoveryCodes);
        openRecoveryModal();
      }
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, token);
      window.localStorage.setItem('AUTH_USER', JSON.stringify(user));
      window.location.replace(paths.home());
    } else {
      setError(message);
    }
  };

  const handleRecovery = async (username: string, recoveryCodes: string[]) => {
    const { success, resetToken, error }: RecoveryResponse = await System.recoverPassword(
      username,
      recoveryCodes
    );
    if (success && resetToken) {
      setResetToken(resetToken);
      setShowRecoveryForm(false);
      setShowResetPasswordForm(true);
    } else {
      if (error) showErrorToast(error);
    }
  };

  const handleResetPassword = async (newPassword: string, confirmPassword: string) => {
    if (newPassword !== confirmPassword) {
      showErrorToast('Passwords do not match');
      return;
    }
    if (!resetToken) return;

    const { success, error } = await System.resetPassword(resetToken, newPassword);
    if (success) {
      setShowResetPasswordForm(false);
      showSuccessToast('Password reset successfully. You can now log in.');
    } else {
      if (error) showErrorToast(error);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="w-full max-w-md">
        {showRecoveryForm ? (
          <RecoveryForm onSubmit={handleRecovery} setShowRecoveryForm={setShowRecoveryForm} />
        ) : showResetPasswordForm ? (
          <ResetPasswordForm onSubmit={handleResetPassword} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-x-2">
                <span className="text-2xl font-bold text-white">{t('login.multi-user.title')}</span>
                <span className="text-2xl font-bold bg-linear-to-r from-[#75D6FF] to-[#FFFFFF] bg-clip-text text-transparent">
                  {appName}
                </span>
              </DialogTitle>
              <DialogDescription>{t('login.multi-user.description')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLogin} className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="username">{t('login.multi-user.placeholder-username')}</label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder={t('login.multi-user.placeholder-username')}
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password">{t('login.multi-user.placeholder-password')}</label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t('login.multi-user.placeholder-password')}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowRecoveryForm(true)}
                  className="p-0 h-auto"
                >
                  {t('login.password-reset.title')}
                </Button>
                <Button type="submit">{t('login.multi-user.login-button')}</Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
      {isRecoveryModalOpen && recoveryCodes && (
        <RecoveryCodeModal
          recoveryCodes={recoveryCodes}
          onDownloadComplete={closeRecoveryModal}
          onClose={closeRecoveryModal}
        />
      )}
    </Dialog>
  );
}
