import { jsx as _jsx } from "react/jsx-runtime";
import { Link, useMatch } from "react-router-dom";
import { ArrowUpLeft, Wrench } from "lucide-react";
import useUser from "@/hooks/useUser";
import paths from "@/utils/paths";
export function SettingsButton() {
    var isInSettings = !!useMatch("/settings/*");
    var user = useUser().user;
    if (user && user.role === "default")
        return null;
    var commonClasses = "transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover";
    var iconClasses = "h-5 w-5";
    var iconColor = "var(--theme-sidebar-footer-icon-fill)";
    if (isInSettings) {
        return (_jsx("div", { className: "flex w-fit", children: _jsx(Link, { to: paths.home(), className: commonClasses, "aria-label": "Home", "data-tooltip-id": "footer-item", "data-tooltip-content": "Back to workspaces", children: _jsx(ArrowUpLeft, { className: iconClasses, stroke: iconColor }) }) }));
    }
    return (_jsx("div", { className: "flex w-fit", children: _jsx(Link, { to: paths.settings(), className: commonClasses, "aria-label": "Settings", "data-tooltip-id": "footer-item", "data-tooltip-content": "System Settings", children: _jsx(Wrench, { className: iconClasses, stroke: iconColor }) }) }));
}
export default SettingsButton;
