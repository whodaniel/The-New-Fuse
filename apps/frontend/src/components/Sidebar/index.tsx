import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, List } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import NewWorkspaceModal, {
  useNewWorkspaceModal,
} from '../Modals/NewWorkspace.js';
import ActiveWorkspaces from './ActiveWorkspaces.js';
import useLogo from "@/hooks/useLogo";
import useUser from "@/hooks/useUser";
import Footer from '../Footer.js';
import SettingsButton from '../SettingsButton.js';
import paths from "@/utils/paths";

const STYLES = {
  container: "flex shrink-0 max-w-[55%] items-center justify-start mx-[38px] my-[18px]",
  logo: "rounded max-h-[24px] object-contain",
  sidebar: "relative m-[16px] rounded-[16px] bg-theme-bg-sidebar border-[2px] border-theme-sidebar-border light:border-none min-w-[250px] p-[10px] h-[calc(100%-76px)]",
  content: "flex flex-col h-full overflow-x-hidden",
  mainContent: "flex-grow flex flex-col min-w-[235px]",
  scrollArea: "relative h-[calc(100%-60px)] flex flex-col w-full justify-between pt-[10px] overflow-y-scroll no-scroll",
  workspaceArea: "flex flex-col gap-y-2 pb-[60px] overflow-y-scroll no-scroll",
  workspaceHeader: "flex gap-x-2 items-center justify-between",
  newWorkspaceButton: "light:bg-[#C2E7FE] light:hover:bg-[#7CD4FD] flex flex-grow w-[75%] h-[44px] gap-x-2 py-[5px] px-2.5 mb-2 bg-white rounded-[8px] text-sidebar justify-center items-center hover:bg-opacity-80 transition-all duration-300",
  footer: "absolute bottom-0 left-0 right-0 pt-4 pb-3 rounded-b-[16px] bg-theme-bg-sidebar bg-opacity-80 backdrop-filter backdrop-blur-md z-10",
  // Mobile styles
  mobileHeader: "fixed top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2 bg-theme-bg-sidebar light:bg-white text-slate-200 shadow-lg h-16",
  mobileMenuButton: "rounded-md p-2 flex items-center justify-center text-theme-text-secondary",
  mobileLogo: "block mx-auto h-6 w-auto",
  mobileSidebar: "z-99 fixed top-0 left-0 transition-all duration-500 w-[100vw] h-[100vh]",
  mobileOverlay: (showBgOverlay: boolean) => `${
    showBgOverlay
      ? "transition-all opacity-1"
      : "transition-none opacity-0"
  } duration-500 fixed top-0 left-0 bg-theme-bg-secondary bg-opacity-75 w-screen h-screen`,
  mobileSidebarContent: "relative h-[100vh] fixed top-0 left-0 rounded-r-[26px] bg-theme-bg-sidebar w-[80%] p-[18px]",
  mobileContentWrapper: "w-full h-full flex flex-col overflow-x-hidden items-between",
  mobileHeader: "flex w-full items-center justify-between gap-x-4",
  mobileLogoContainer: "flex shrink-1 w-fit items-center justify-start",
  mobileSettingsContainer: "flex gap-x-2 items-center text-slate-500 shink-0",
  mobileMainContent: "h-full flex flex-col w-full justify-between pt-4",
  mobileWorkspaceArea: "h-auto md:sidebar-items",
  mobileFooter: "z-99 absolute bottom-0 left-0 right-0 pt-2 pb-6 rounded-br-[26px] bg-theme-bg-sidebar bg-opacity-80 backdrop-filter backdrop-blur-md",
};

export default function Sidebar() {
  const { user } = useUser();
  const { logo } = useLogo();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();
  const { t } = useTranslation();

  return (
    <div>
      <Link
        to={paths.home()}
        className={STYLES.container}
        aria-label="Home"
      >
        <img
          src={logo}
          alt="Logo"
          className={STYLES.logo}
        />
      </Link>
      <div
        ref={sidebarRef}
        className={STYLES.sidebar}
      >
        <div className={STYLES.content}>
          <div className={STYLES.mainContent}>
            <div className={STYLES.scrollArea}>
              <div className={STYLES.workspaceArea}>
                <div className={STYLES.workspaceHeader}>
                  {(!user || user?.role !== "default") && (
                    <button
                      onClick={showNewWsModal}
                      className={STYLES.newWorkspaceButton}
                    >
                      <Plus size={18} weight="bold" />
                      <p className="text-sidebar text-sm font-semibold">
                        {t("new-workspace.title")}
                      </p>
                    </button>
                  )}
                </div>
                <ActiveWorkspaces />
              </div>
            </div>
            <div className={STYLES.footer}>
              <Footer />
            </div>
          </div>
        </div>
      </div>
      {showingNewWsModal && <NewWorkspaceModal hideModal={hideNewWsModal} />}
    </div>
  );
}

export function SidebarMobileHeader() {
  const { logo } = useLogo();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [showBgOverlay, setShowBgOverlay] = useState<boolean>(false);
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();
  const { user } = useUser();
  const { t } = useTranslation();

  useEffect(() => {
    function handleBg() {
      if (showSidebar) {
        setTimeout(() => {
          setShowBgOverlay(true);
        }, 300);
      } else {
        setShowBgOverlay(false);
      }
    }
    handleBg();
  }, [showSidebar]);

  return (
    <>
      <div
        aria-label="Show sidebar"
        className={STYLES.mobileHeader}
      >
        <button
          onClick={() => setShowSidebar(true)}
          className={STYLES.mobileMenuButton}
        >
          <List className="h-6 w-6" />
        </button>
        <div className="flex items-center justify-center flex-grow">
          <img
            src={logo}
            alt="Logo"
            className={STYLES.mobileLogo}
            style={{ maxHeight: "40px", objectFit: "contain" }}
          />
        </div>
        <div className="w-12"></div>
      </div>
      <div
        style={{
          transform: showSidebar ? `translateX(0vw)` : `translateX(-100vw)`,
        }}
        className={STYLES.mobileSidebar}
      >
        <div
          className={STYLES.mobileOverlay(showBgOverlay)}
          onClick={() => setShowSidebar(false)}
        />
        <div
          ref={sidebarRef}
          className={STYLES.mobileSidebarContent}
        >
          <div className={STYLES.mobileContentWrapper}>
            <div className={STYLES.mobileHeader}>
              <div className={STYLES.mobileLogoContainer}>
                <img
                  src={logo}
                  alt="Logo"
                  className="rounded w-full max-h-[40px]"
                  style={{ objectFit: "contain" }}
                />
              </div>
              {(!user || user?.role !== "default") && (
                <div className={STYLES.mobileSettingsContainer}>
                  <SettingsButton />
                </div>
              )}
            </div>

            <div className={STYLES.mobileMainContent}>
              <div className={STYLES.mobileWorkspaceArea}>
                <div className="flex flex-col gap-y-4 overflow-y-scroll no-scroll pb-[60px]">
                  <div className={STYLES.workspaceHeader}>
                    {(!user || user?.role !== "default") && (
                      <button
                        onClick={showNewWsModal}
                        className="flex flex-grow w-[75%] h-[44px] gap-x-2 py-[5px] px-4 bg-white rounded-lg text-sidebar justify-center items-center hover:bg-opacity-80 transition-all duration-300"
                      >
                        <Plus className="h-5 w-5" />
                        <p className="text-sidebar text-sm font-semibold">
                          {t("new-workspace.title")}
                        </p>
                      </button>
                    )}
                  </div>
                  <ActiveWorkspaces />
                </div>
              </div>
              <div className={STYLES.mobileFooter}>
                <Footer />
              </div>
            </div>
          </div>
        </div>
        {showingNewWsModal && <NewWorkspaceModal hideModal={hideNewWsModal} />}
      </div>
    </>
  );
}
