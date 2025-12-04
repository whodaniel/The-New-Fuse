import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, List } from "lucide-react";
import { useTranslation } from "react-i18next";
import NewWorkspaceModal, { useNewWorkspaceModal, } from '../Modals/NewWorkspace';
import ActiveWorkspaces from './ActiveWorkspaces';
import useLogo from "@/hooks/useLogo";
import useUser from "@/hooks/useUser";
import { Footer } from '../Footer';
import { SettingsButton } from '../SettingsButton';
import paths from "@/utils/paths";
var STYLES = {
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
    mobileOverlay: function (showBgOverlay) { return "".concat(showBgOverlay
        ? "transition-all opacity-1"
        : "transition-none opacity-0", " duration-500 fixed top-0 left-0 bg-theme-bg-secondary bg-opacity-75 w-screen h-screen"); },
    mobileSidebarContent: "relative h-[100vh] fixed top-0 left-0 rounded-r-[26px] bg-theme-bg-sidebar w-[80%] p-[18px]",
    mobileContentWrapper: "w-full h-full flex flex-col overflow-x-hidden items-between",
    mobileHeaderInner: "flex w-full items-center justify-between gap-x-4",
    mobileLogoContainer: "flex shrink-1 w-fit items-center justify-start",
    mobileSettingsContainer: "flex gap-x-2 items-center text-slate-500 shink-0",
    mobileMainContent: "h-full flex flex-col w-full justify-between pt-4",
    mobileWorkspaceArea: "h-auto md:sidebar-items",
    mobileFooter: "z-99 absolute bottom-0 left-0 right-0 pt-2 pb-6 rounded-br-[26px] bg-theme-bg-sidebar bg-opacity-80 backdrop-filter backdrop-blur-md",
};
export default function Sidebar() {
    var user = useUser().user;
    var logo = useLogo().logo;
    var sidebarRef = useRef(null);
    var _a = useNewWorkspaceModal(), showingNewWsModal = _a.showing, showNewWsModal = _a.showModal, hideNewWsModal = _a.hideModal;
    var t = useTranslation().t;
    return (_jsxs("div", { children: [_jsx(Link, { to: paths.home(), className: STYLES.container, "aria-label": "Home", children: _jsx("img", { src: logo, alt: "Logo", className: STYLES.logo }) }), _jsx("div", { ref: sidebarRef, className: STYLES.sidebar, children: _jsx("div", { className: STYLES.content, children: _jsxs("div", { className: STYLES.mainContent, children: [_jsx("div", { className: STYLES.scrollArea, children: _jsxs("div", { className: STYLES.workspaceArea, children: [_jsx("div", { className: STYLES.workspaceHeader, children: (!user || (user === null || user === void 0 ? void 0 : user.role) !== "default") && (_jsxs("button", { onClick: showNewWsModal, className: STYLES.newWorkspaceButton, children: [_jsx(Plus, { size: 18 }), _jsx("p", { className: "text-sidebar text-sm font-semibold", children: t("new-workspace.title") })] })) }), _jsx(ActiveWorkspaces, {})] }) }), _jsx("div", { className: STYLES.footer, children: _jsx(Footer, {}) })] }) }) }), showingNewWsModal && _jsx(NewWorkspaceModal, { hideModal: hideNewWsModal })] }));
}
export function SidebarMobileHeader() {
    var logo = useLogo().logo;
    var sidebarRef = useRef(null);
    var _a = useState(false), showSidebar = _a[0], setShowSidebar = _a[1];
    var _b = useState(false), showBgOverlay = _b[0], setShowBgOverlay = _b[1];
    var _c = useNewWorkspaceModal(), showingNewWsModal = _c.showing, showNewWsModal = _c.showModal, hideNewWsModal = _c.hideModal;
    var user = useUser().user;
    var t = useTranslation().t;
    useEffect(function () {
        function handleBg() {
            if (showSidebar) {
                setTimeout(function () {
                    setShowBgOverlay(true);
                }, 300);
            }
            else {
                setShowBgOverlay(false);
            }
        }
        handleBg();
    }, [showSidebar]);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { "aria-label": "Show sidebar", className: STYLES.mobileHeader, children: [_jsx("button", { onClick: function () { return setShowSidebar(true); }, className: STYLES.mobileMenuButton, title: "Show menu", children: _jsx(List, { className: "h-6 w-6" }) }), _jsx("div", { className: "flex items-center justify-center flex-grow", children: _jsx("img", { src: logo, alt: "Logo", className: STYLES.mobileLogo, style: { maxHeight: "40px", objectFit: "contain" } }) }), _jsx("div", { className: "w-12" })] }), _jsxs("div", { style: {
                    transform: showSidebar ? "translateX(0vw)" : "translateX(-100vw)",
                }, className: STYLES.mobileSidebar, children: [_jsx("div", { className: STYLES.mobileOverlay(showBgOverlay), onClick: function () { return setShowSidebar(false); } }), _jsx("div", { ref: sidebarRef, className: STYLES.mobileSidebarContent, children: _jsxs("div", { className: STYLES.mobileContentWrapper, children: [_jsxs("div", { className: STYLES.mobileHeaderInner, children: [_jsx("div", { className: STYLES.mobileLogoContainer, children: _jsx("img", { src: logo, alt: "Logo", className: "rounded w-full max-h-[40px]", style: { objectFit: "contain" } }) }), (!user || (user === null || user === void 0 ? void 0 : user.role) !== "default") && (_jsx("div", { className: STYLES.mobileSettingsContainer, children: _jsx(SettingsButton, {}) }))] }), _jsxs("div", { className: STYLES.mobileMainContent, children: [_jsx("div", { className: STYLES.mobileWorkspaceArea, children: _jsxs("div", { className: "flex flex-col gap-y-4 overflow-y-scroll no-scroll pb-[60px]", children: [_jsx("div", { className: STYLES.workspaceHeader, children: (!user || (user === null || user === void 0 ? void 0 : user.role) !== "default") && (_jsxs("button", { onClick: showNewWsModal, className: "flex flex-grow w-[75%] h-[44px] gap-x-2 py-[5px] px-4 bg-white rounded-lg text-sidebar justify-center items-center hover:bg-opacity-80 transition-all duration-300", children: [_jsx(Plus, { className: "h-5 w-5" }), _jsx("p", { className: "text-sidebar text-sm font-semibold", children: t("new-workspace.title") })] })) }), _jsx(ActiveWorkspaces, {})] }) }), _jsx("div", { className: STYLES.mobileFooter, children: _jsx(Footer, {}) })] })] }) }), showingNewWsModal && _jsx(NewWorkspaceModal, { hideModal: hideNewWsModal })] })] }));
}
