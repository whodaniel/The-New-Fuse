import RecoveryCodeModal from '@/components/Modals/DisplayRecoveryCodeModal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useModal } from '@/hooks/useModal';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import System from '../../../models/system';
import { AUTH_TOKEN } from '../../../utils/constants';
import paths from '../../../utils/paths';

interface LoginResponse {
  valid: boolean;
  token: string | null;
  message: string | null;
  recoveryCodes?: string[];
}

interface CustomAppNameResponse {
  appName: string | null;
}

export function SingleUserAuth() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [downloadComplete, setDownloadComplete] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [customAppName, setCustomAppName] = useState<string | null>(null);

  const {
    isOpen: isRecoveryCodeModalOpen,
    openModal: openRecoveryCodeModal,
    closeModal: closeRecoveryCodeModal,
  } = useModal();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    setError(null);
    setLoading(true);
    e.preventDefault();
    const data: Record<string, string> = {};
    const form = new FormData(e.currentTarget);
    for (const [key, value] of form.entries()) {
      data[key] = value.toString();
    }

    const { valid, token, message, recoveryCodes }: LoginResponse = await System.requestToken(data);

    if (valid && token) {
      setToken(token);
      if (recoveryCodes) {
        setRecoveryCodes(recoveryCodes);
        openRecoveryCodeModal();
      } else {
        window.localStorage.setItem(AUTH_TOKEN, token);
        window.location.href = paths.home();
      }
    } else {
      setError(message || 'An error occurred during login');
      setLoading(false);
    }
    setLoading(false);
  };

  const handleDownloadComplete = () => {
    setDownloadComplete(true);
  };

  useEffect(() => {
    if (downloadComplete && token) {
      window.localStorage.setItem(AUTH_TOKEN, token);
      window.location.href = paths.home();
    }
  }, [downloadComplete, token]);

  useEffect(() => {
    const fetchCustomAppName = async () => {
      const { appName }: CustomAppNameResponse = await System.fetchCustomAppName();
      setCustomAppName(appName || '');
      setLoading(false);
    };
    fetchCustomAppName();
  }, []);

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center flex-col gap-y-4">
            <div className="flex gap-x-1">
              <h3 className="text-md md:text-2xl font-bold text-white text-center whitespace-nowrap hidden md:block">
                {t('login.multi-user.welcome')}
              </h3>
              <p className="text-4xl md:text-2xl font-bold bg-gradient-to-r from-[#75D6FF] via-[#FFFFFF] light:via-[#75D6FF] to-[#FFFFFF] light:to-[#75D6FF] bg-clip-text text-transparent">
                {customAppName || 'AnythingLLM'}
              </p>
            </div>
            <p className="text-sm text-theme-text-secondary text-center">
              {t('login.sign-in.start')} {customAppName || 'AnythingLLM'} {t('login.sign-in.end')}
            </p>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              name="password"
              type="password"
              placeholder="Password"
              required
              autoComplete="off"
            />
          </div>
          {error && <p className="text-sm text-red-500">Error: {error}</p>}
          <DialogFooter>
            <Button disabled={loading} type="submit" className="w-full">
              {loading ? t('login.multi-user.validating') : t('login.multi-user.login')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      {isRecoveryCodeModalOpen && (
        <RecoveryCodeModal
          newRecoveryCodes={recoveryCodes}
          closeModal={closeRecoveryCodeModal}
          onDownloadComplete={handleDownloadComplete}
        />
      )}
    </Dialog>
  );
}
