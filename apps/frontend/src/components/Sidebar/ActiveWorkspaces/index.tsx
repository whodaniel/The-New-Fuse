import React, { useState, useEffect } from "react";
import { Link, useMatch, useParams } from "react-router-dom";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { GearSix, SquaresFour, UploadSimple } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import ManageWorkspace, { useManageWorkspaceModal, } from '../../Modals/ManageWorkspace.js';
import paths from "@/utils/paths";
import useUser from "@/hooks/useUser";
import ThreadContainer from './ThreadContainer.js';
const STYLES = {
    container: "flex flex-col gap-y-2",
    workspaceItem: "flex flex-col w-full group",
    workspaceHeader: "flex gap-x-2 items-center justify-between",
    workspaceLink: (isActive) => `
    transition-all duration-[200ms]
    flex flex-grow w-[75%] gap-x-2 py-[6px] px-[12px] rounded-[4px] text-white justify-start items-center
    bg-theme-sidebar-item-default
    hover:bg-theme-sidebar-subitem-hover hover:font-bold
    ${isActive ? "bg-theme-sidebar-item-selected font-bold border-solid border-2 border-transparent light:border-blue-400" : ""}
  `,
    contentContainer: "flex flex-row justify-between w-full",
    nameContainer: "flex items-center space-x-2 overflow-hidden",
    workspaceName: (isActive) => `
    text-[14px] leading-loose whitespace-nowrap overflow-hidden text-white
    ${isActive ? "font-bold" : "font-medium"} truncate
    w-full group-hover:w-[100px] group-hover:font-bold group-hover:duration-200
  `,
    actionsContainer: (isActive) => `flex items-center gap-x-[2px] transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`,
    actionButton: "border-none rounded-md flex items-center justify-center ml-auto p-[2px] hover:bg-[#646768] text-[#A7A8A9] hover:text-white",
    settingsLink: "rounded-md flex items-center justify-center text-[#A7A8A9] hover:text-white ml-auto p-[2px] hover:bg-[#646768]",
};
export default function ActiveWorkspaces() {
    const { slug } = useParams();
    const [loading, setLoading] = useState(true);
    const [workspaces, setWorkspaces] = useState([]);
    const [selectedWs, setSelectedWs] = useState(null);
    const { showing, showModal, hideModal } = useManageWorkspaceModal();
    const { user } = useUser();
    const isInWorkspaceSettings = !!useMatch("/workspace/:slug/settings/:tab");
    useEffect(() => {
        async function getWorkspaces() {
            const workspaces = await Workspace.all();
            setLoading(false);
            setWorkspaces(workspaces);
        }
        getWorkspaces();
    }, []);
    if (loading) {
        return (<Skeleton.default height={40} width="100%" count={5} baseColor="var(--theme-sidebar-item-default)" highlightColor="var(--theme-sidebar-item-hover)" enableAnimation={true} className="my-1"/>);
    }
    return (<div role="list" aria-label="Workspaces" className={STYLES.container}>
      {workspaces.map((workspace) => {
            const isActive = workspace.slug === slug;
            return (<div className={STYLES.workspaceItem} key={workspace.id} role="listitem">
            <div className={STYLES.workspaceHeader}>
              <a href={isActive ? "#" : paths.workspace.chat(workspace.slug)} aria-current={isActive ? "page" : undefined} className={STYLES.workspaceLink(isActive)}>
                <div className={STYLES.contentContainer}>
                  <div className={STYLES.nameContainer}>
                    <SquaresFour weight={isActive ? "fill" : "regular"} className="flex-shrink-0" color={isActive
                    ? "var(--theme-sidebar-item-workspace-active)"
                    : "var(--theme-sidebar-item-workspace-inactive)"} size={24}/>
                    <div className="w-[130px] overflow-hidden">
                      <p className={STYLES.workspaceName(isActive)}>
                        {workspace.name}
                      </p>
                    </div>
                  </div>
                  {(user === null || user === void 0 ? void 0 : user.role) !== "default" && (<div className={STYLES.actionsContainer(isActive)}>
                      <button type="button" onClick={(e) => {
                        e.preventDefault();
                        setSelectedWs(workspace);
                        showModal();
                    }} className={STYLES.actionButton}>
                        <UploadSimple className="h-[20px] w-[20px]" weight="bold"/>
                      </button>
                      <Link to={isInWorkspaceSettings
                        ? paths.workspace.chat(workspace.slug)
                        : paths.workspace.settings.generalAppearance(workspace.slug)} className={STYLES.settingsLink} aria-label="General appearance settings">
                        <GearSix color={isInWorkspaceSettings && workspace.slug === slug
                        ? "#46C8FF"
                        : undefined} weight="bold" className="h-[20px] w-[20px]"/>
                      </Link>
                    </div>)}
                </div>
              </a>
            </div>
            {isActive && (<ThreadContainer workspace={workspace}/>)}
          </div>);
        })}
      {showing && (<ManageWorkspace hideModal={hideModal} providedSlug={selectedWs ? selectedWs.slug : null}/>)}
    </div>);
}
//# sourceMappingURL=index.js.map