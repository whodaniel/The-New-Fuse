import React from "react";
import { Link, useMatch } from "react-router-dom";
import { ArrowUUpLeft, Wrench } from "@phosphor-icons/react";
import useUser from "@/hooks/useUser";
import paths from "@/utils/paths";
export function SettingsButton() {
    const isInSettings = !!useMatch("/settings/*");
    const { user } = useUser();
    if (user && user.role === "default")
        return null;
    const commonClasses = "transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover";
    const iconClasses = "h-5 w-5";
    const iconColor = "var(--theme-sidebar-footer-icon-fill)";
    if (isInSettings) {
        return (<div className="flex w-fit">
        <Link to={paths.home()} className={commonClasses} aria-label="Home" data-tooltip-id="footer-item" data-tooltip-content="Back to workspaces">
          <ArrowUUpLeft className={iconClasses} weight="fill" color={iconColor}/>
        </Link>
      </div>);
    }
    return (<div className="flex w-fit">
      <Link to={paths.settings.appearance()} className={commonClasses} aria-label="Settings" data-tooltip-id="footer-item" data-tooltip-content="Open settings">
        <Wrench className={iconClasses} weight="fill" color={iconColor}/>
      </Link>
    </div>);
}
//# sourceMappingURL=SettingsButton.js.map