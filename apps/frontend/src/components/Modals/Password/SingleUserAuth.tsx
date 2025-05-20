import React, { useEffect, useState } from "react";
import System from '../../../models/system.js';
import { AUTH_TOKEN } from '../../../utils/constants.js';
import paths from '../../../utils/paths.js';
import ModalWrapper from "@/components/ModalWrapper";
import { useModal } from "@/hooks/useModal";
import RecoveryCodeModal from "@/components/Modals/DisplayRecoveryCodeModal";
import { useTranslation } from "react-i18next";

interface LoginResponse {
  valid: boolean;
  token: string | null;
  message: string | null;
  recoveryCodes?: string[];
}

interface CustomAppNameResponse {
  appName: string | null;
}

const STYLES = {
  container: "flex flex-col justify-center items-center relative rounded-2xl bg-theme-bg-secondary md:shadow-[0_4px_14px_rgba(0,0,0,0.25)] md:px-12 py-12 -mt-36 md:-mt-10",
  header: "flex items-start justify-between pt-11 pb-9 rounded-t",
  headerContent: "flex items-center flex-col gap-y-4",
  titleContainer: "flex gap-x-1",
  title: "text-md md:text-2xl font-bold text-white text-center white-space-nowrap hidden md:block",
  appName: "text-4xl md:text-2xl font-bold bg-gradient-to-r from-[#75D6FF] via-[#FFFFFF] light:via-[#75D6FF] to-[#FFFFFF] light:to-[#75D6FF] bg-clip-text text-transparent",
  subtitle: "text-sm text-theme-text-secondary text-center",
  formContent: "w-full px-4 md:px-12",
  inputContainer: "w-full flex flex-col gap-y-4",
  inputWrapper: "w-screen md:w-full md:px-0 px-6",
  input: "border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder focus:outline-primary-button active:outline-primary-button outline-none text-sm rounded-md p-2.5 w-full h-[48px] md:w-[300px] md:h-[34px]",
  error: "text-red-400 text-sm",
  buttonContainer: "flex items-center md:p-12 px-10 mt-12 md:mt-0 space-x-2 border-gray-600 w-full flex-col gap-y-8",
  button: "md:text-primary-button md:bg-transparent text-dark-text text-sm font-bold focus:ring-4 focus:outline-none rounded-md border-[1.5px] border-primary-button md:h-[34px] h-[48px] md:hover:text-white md:hover:bg-primary-button bg-primary-button focus:z-10 w-full",
};

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
    
    const { valid, token, message, recoveryCodes }: LoginResponse =
      await System.requestToken(data);
    
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
      setError(message || "An error occurred during login");
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
      setCustomAppName(appName || "");
      setLoading(false);
    };
    fetchCustomAppName();
  }, []);

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
            </div>
          </div>
          <div className={STYLES.formContent}>
            <div className={STYLES.inputContainer}>
              <div className={STYLES.inputWrapper}>
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
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
