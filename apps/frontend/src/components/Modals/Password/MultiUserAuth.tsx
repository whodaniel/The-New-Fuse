import React, { useEffect, useState } from "react";
import System from "../../../models/system";
import { AUTH_TOKEN, AUTH_USER } from "../../../utils/constants";
import paths from "../../../utils/paths";
import showToast from "@/utils/toast";
import { useModal } from "@/hooks/useModal";
import RecoveryCodeModal from "@/components/Modals/DisplayRecoveryCodeModal";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface User {
  id: string;
  username: string;
  role: string;
}

interface LoginResponse {
  valid: boolean;
  user: User | null;
  token: string | null;
  message: string | null;
  recoveryCodes?: string[];
}

interface RecoveryResponse {
  success: boolean;
  resetToken?: string;
  error?: string;
}

interface ResetPasswordResponse {
  success: boolean;
  error?: string;
}

interface CustomAppNameResponse {
  appName: string | null;
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
  const [username, setUsername] = useState("");
  const [recoveryCodeInputs, setRecoveryCodeInputs] = useState<string[]>(
    Array(2).fill("")
  );

  const handleRecoveryCodeChange = (index: number, value: string) => {
    const updatedCodes = [...recoveryCodeInputs];
    updatedCodes[index] = value;
    setRecoveryCodeInputs(updatedCodes);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const recoveryCodes = recoveryCodeInputs.filter(
      (code) => code.trim() !== ""
    );
    onSubmit(username, recoveryCodes);
  };

  return (
    <div className="w-full max-w-md">
      <DialogHeader>
        <DialogTitle>{t("login.password-reset.title")}</DialogTitle>
        <DialogDescription>
          {t("login.password-reset.description")}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium">
            {t("login.multi-user.placeholder-username")}
          </label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder={t("login.multi-user.placeholder-username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("login.password-reset.recovery-codes")}
          </label>
          {recoveryCodeInputs.map((code, index) => (
            <Input
              key={index}
              type="text"
              name={`recoveryCode${index + 1}`}
              placeholder={t("login.password-reset.recovery-code", {
                index: index + 1,
              })}
              value={code}
              onChange={(e) =>
                handleRecoveryCodeChange(index, e.target.value)
              }
              required
            />
          ))}
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button type="submit">{t("login.password-reset.title")}</Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowRecoveryForm(false)}
          >
            {t("login.password-reset.back")}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
};

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSubmit }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
            onChange={(e) => setNewPassword(e.target.value)}
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
            onChange={(e) => setConfirmPassword(e.target.value)}
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [appName, setAppName] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppName = async () => {
      const { appName } = (await System.keys()) as CustomAppNameResponse;
      setAppName(appName);
    };
    fetchAppName();
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const { valid, user, token, message, recoveryCodes } = await System.login(
      username,
      password
    );
    if (valid && !!token) {
      if (recoveryCodes) {
        setRecoveryCodes(recoveryCodes);
        openRecoveryModal();
      }
      window.localStorage.setItem(AUTH_TOKEN, token);
      window.localStorage.setItem(AUTH_USER, JSON.stringify(user));
      window.location.replace(paths.home());
    } else {
      setError(message);
    }
  };

  const handleRecovery = async (username: string, recoveryCodes: string[]) => {
    const { success, resetToken, error } = (await System.recoverPassword(
      username,
      recoveryCodes
    )) as RecoveryResponse;
    if (success && resetToken) {
      setResetToken(resetToken);
      setShowRecoveryForm(false);
      setShowResetPasswordForm(true);
    } else {
      showToast(error, "error");
    }
  };

  const handleResetPassword = async (newPassword: string, confirmPassword: string) => {
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (!resetToken) return;

    const { success, error } = (await System.resetPassword(
      resetToken,
      newPassword
    )) as ResetPasswordResponse;
    if (success) {
      setShowResetPasswordForm(false);
      showToast("Password reset successfully. You can now log in.", "success");
    } else {
      showToast(error, "error");
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="w-full max-w-md">
        {showRecoveryForm ? (
          <RecoveryForm
            onSubmit={handleRecovery}
            setShowRecoveryForm={setShowRecoveryForm}
          />
        ) : showResetPasswordForm ? (
          <ResetPasswordForm onSubmit={handleResetPassword} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-x-2">
                <span className="text-2xl font-bold text-white">
                  {t("login.multi-user.title")}
                </span>
                <span className="text-2xl font-bold bg-gradient-to-r from-[#75D6FF] to-[#FFFFFF] bg-clip-text text-transparent">
                  {appName}
                </span>
              </DialogTitle>
              <DialogDescription>
                {t("login.multi-user.description")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLogin} className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="username">{t("login.multi-user.placeholder-username")}</label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder={t("login.multi-user.placeholder-username")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password">{t("login.multi-user.placeholder-password")}</label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t("login.multi-user.placeholder-password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  {t("login.password-reset.title")}
                </Button>
                <Button type="submit">{t("login.multi-user.login-button")}</Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
      {isRecoveryModalOpen && recoveryCodes && (
        <RecoveryCodeModal
          newRecoveryCodes={recoveryCodes}
          closeModal={closeRecoveryModal}
        />
      )}
    </Dialog>
  );
}
          </div>
        </div>
      </div>
      <div className={STYLES.buttonContainer}>
        <button type="submit" className={STYLES.button}>
          Reset Password
        </button>
      </div>
    </form>
  );
};

export function MultiUserAuth() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [downloadComplete, setDownloadComplete] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showRecoveryForm, setShowRecoveryForm] = useState<boolean>(false);
  const [showResetPasswordForm, setShowResetPasswordForm] = useState<boolean>(false);
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
    
    const { valid, user, token, message, recoveryCodes }: LoginResponse =
      await System.requestToken(data);
    
    if (valid && token && user) {
      setUser(user);
      setToken(token);

      if (recoveryCodes) {
        setRecoveryCodes(recoveryCodes);
        openRecoveryCodeModal();
      } else {
        window.localStorage.setItem(AUTH_USER, JSON.stringify(user));
        window.localStorage.setItem(AUTH_TOKEN, token);
        window.location.href = paths.home();
      }
    } else {
      setError(message || "An error occurred during login");
      setLoading(false);
    }
    setLoading(false);
  };

  const handleDownloadComplete = () => setDownloadComplete(true);
  const handleResetPassword = () => setShowRecoveryForm(true);

  const handleRecoverySubmit = async (username: string, recoveryCodes: string[]) => {
    const { success, resetToken, error }: RecoveryResponse = await System.recoverAccount(
      username,
      recoveryCodes
    );

    if (success && resetToken) {
      window.localStorage.setItem("resetToken", resetToken);
      setShowRecoveryForm(false);
      setShowResetPasswordForm(true);
    } else {
      showToast(error || "Recovery failed", "error", { clear: true });
    }
  };

  const handleResetSubmit = async (newPassword: string, confirmPassword: string) => {
    const resetToken = window.localStorage.getItem("resetToken");

    if (resetToken) {
      const { success, error }: ResetPasswordResponse = await System.resetPassword(
        resetToken,
        newPassword,
        confirmPassword
      );

      if (success) {
        window.localStorage.removeItem("resetToken");
        setShowResetPasswordForm(false);
        showToast("Password reset successful", "success", { clear: true });
      } else {
        showToast(error || "Password reset failed", "error", { clear: true });
      }
    } else {
      showToast("Invalid reset token", "error", { clear: true });
    }
  };

  useEffect(() => {
    if (downloadComplete && user && token) {
      window.localStorage.setItem(AUTH_USER, JSON.stringify(user));
      window.localStorage.setItem(AUTH_TOKEN, token);
      window.location.href = paths.home();
    }
  }, [downloadComplete, user, token]);

  useEffect(() => {
    const fetchCustomAppName = async () => {
      const { appName }: CustomAppNameResponse = await System.fetchCustomAppName();
      setCustomAppName(appName || "");
      setLoading(false);
    };
    fetchCustomAppName();
  }, []);

  if (showRecoveryForm) {
    return (
      <RecoveryForm
        onSubmit={handleRecoverySubmit}
        setShowRecoveryForm={setShowRecoveryForm}
      />
    );
  }

  if (showResetPasswordForm) {
    return <ResetPasswordForm onSubmit={handleResetSubmit} />;
  }

  return (
    <>
      <form onSubmit={handleLogin}>
        <div className={STYLES.container}>
          <div className={STYLES.header}>
            <div className={STYLES.headerContent}>
              <div className={STYLES.titleContainer}>
                <h3 className={STYLES.title}>
                  {t("login.multi-user.welcome")}
                </h3>
                <p className={STYLES.appName}>
                  {customAppName || "AnythingLLM"}
                </p>
              </div>
              <p className={STYLES.subtitle}>
                {t("login.sign-in.start")} {customAppName || "AnythingLLM"}{" "}
                {t("login.sign-in.end")}
              </p>
            
          <div className={STYLES.formContent}>
            <div className={STYLES.inputContainer}>
              <div className={STYLES.inputWrapper}>
                <input
                  name="username"
                  type="text"
                  placeholder={t("login.multi-user.placeholder-username")}
                  className={STYLES.input}
                  required
                  autoComplete="off"
                />
              </div>
              <div className={STYLES.inputWrapper}>
                <input
                  name="password"
                  type="password"
                  placeholder={t("login.multi-user.placeholder-password")}
                  className={STYLES.input}
                  required
                  autoComplete="off"
                />
              </div>
              {error && <p className={STYLES.error}>Error: {error}</p>}
            </div>
          </div>
          <div className={STYLES.buttonContainer}>
            <button
              disabled={loading}
              type="submit"
              className={STYLES.button}
            >
              {loading
                ? t("login.multi-user.validating")
                : t("login.multi-user.login")}
            </button>
            <button
              type="button"
              className={STYLES.resetButton}
              onClick={handleResetPassword}
            >
              {t("login.multi-user.forgot-pass")}?
              <b>{t("login.multi-user.reset")}</b>
            </button>
          </div>
        </div>
      </form>

      <ModalWrapper isOpen={isRecoveryCodeModalOpen} noPortal={true}>
        <RecoveryCodeModal
          recoveryCodes={recoveryCodes}
          onDownloadComplete={handleDownloadComplete}
          onClose={closeRecoveryCodeModal}
        />
      </ModalWrapper>
    </>
  );
}
