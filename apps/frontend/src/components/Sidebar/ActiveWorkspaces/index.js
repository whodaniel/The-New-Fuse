var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link, useMatch, useParams } from "react-router-dom";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { GearSix, SquaresFour, UploadSimple } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import ManageWorkspace, { useManageWorkspaceModal, } from '../../Modals/ManageWorkspace';
import paths from "@/utils/paths";
import useUser from "@/hooks/useUser";
import ThreadContainer from './ThreadContainer';
var STYLES = {
    container: "flex flex-col gap-y-2",
    workspaceItem: "flex flex-col w-full group",
    workspaceHeader: "flex gap-x-2 items-center justify-between",
    workspaceLink: function (isActive) { return "\n    transition-all duration-[200ms]\n    flex flex-grow w-[75%] gap-x-2 py-[6px] px-[12px] rounded-[4px] text-white justify-start items-center\n    bg-theme-sidebar-item-default\n    hover:bg-theme-sidebar-subitem-hover hover:font-bold\n    ".concat(isActive ? "bg-theme-sidebar-item-selected font-bold border-solid border-2 border-transparent light:border-blue-400" : "", "\n  "); },
    contentContainer: "flex flex-row justify-between w-full",
    nameContainer: "flex items-center space-x-2 overflow-hidden",
    workspaceName: function (isActive) { return "\n    text-[14px] leading-loose whitespace-nowrap overflow-hidden text-white\n    ".concat(isActive ? "font-bold" : "font-medium", " truncate\n    w-full group-hover:w-[100px] group-hover:font-bold group-hover:duration-200\n  "); },
    actionsContainer: function (isActive) { return "flex items-center gap-x-[2px] transition-opacity duration-200 ".concat(isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"); },
    actionButton: "border-none rounded-md flex items-center justify-center ml-auto p-[2px] hover:bg-[#646768] text-[#A7A8A9] hover:text-white",
    settingsLink: "rounded-md flex items-center justify-center text-[#A7A8A9] hover:text-white ml-auto p-[2px] hover:bg-[#646768]",
};
export default function ActiveWorkspaces() {
    var slug = useParams().slug;
    var _a = useState(true), loading = _a[0], setLoading = _a[1];
    var _b = useState([]), workspaces = _b[0], setWorkspaces = _b[1];
    var _c = useState(null), selectedWs = _c[0], setSelectedWs = _c[1];
    var _d = useManageWorkspaceModal(), showing = _d.showing, showModal = _d.showModal, hideModal = _d.hideModal;
    var user = useUser().user;
    var isInWorkspaceSettings = !!useMatch("/workspace/:slug/settings/:tab");
    useEffect(function () {
        function getWorkspaces() {
            return __awaiter(this, void 0, void 0, function () {
                var workspaces;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Workspace.all()];
                        case 1:
                            workspaces = _a.sent();
                            setLoading(false);
                            setWorkspaces(workspaces);
                            return [2 /*return*/];
                    }
                });
            });
        }
        getWorkspaces();
    }, []);
    if (loading) {
        return (_jsx(Skeleton.default, { height: 40, width: "100%", count: 5, baseColor: "var(--theme-sidebar-item-default)", highlightColor: "var(--theme-sidebar-item-hover)", enableAnimation: true, className: "my-1" }));
    }
    return (_jsxs("div", { role: "list", "aria-label": "Workspaces", className: STYLES.container, children: [workspaces.map(function (workspace) {
                var isActive = workspace.slug === slug;
                return (_jsxs("div", { className: STYLES.workspaceItem, role: "listitem", children: [_jsx("div", { className: STYLES.workspaceHeader, children: _jsx("a", { href: isActive ? "#" : paths.workspace.chat(workspace.slug), "aria-current": isActive ? "page" : undefined, className: STYLES.workspaceLink(isActive), children: _jsxs("div", { className: STYLES.contentContainer, children: [_jsxs("div", { className: STYLES.nameContainer, children: [_jsx(SquaresFour, { weight: isActive ? "fill" : "regular", className: "flex-shrink-0", color: isActive
                                                        ? "var(--theme-sidebar-item-workspace-active)"
                                                        : "var(--theme-sidebar-item-workspace-inactive)", size: 24 }), _jsx("div", { className: "w-[130px] overflow-hidden", children: _jsx("p", { className: STYLES.workspaceName(isActive), children: workspace.name }) })] }), (user === null || user === void 0 ? void 0 : user.role) !== "default" && (_jsxs("div", { className: STYLES.actionsContainer(isActive), children: [_jsx("button", { type: "button", onClick: function (e) {
                                                        e.preventDefault();
                                                        setSelectedWs(workspace);
                                                        showModal();
                                                    }, className: STYLES.actionButton, children: _jsx(UploadSimple, { className: "h-[20px] w-[20px]", weight: "bold" }) }), _jsx(Link, { to: isInWorkspaceSettings
                                                        ? paths.workspace.chat(workspace.slug)
                                                        : paths.workspace.settings.generalAppearance(workspace.slug), className: STYLES.settingsLink, "aria-label": "General appearance settings", children: _jsx(GearSix, { color: isInWorkspaceSettings && workspace.slug === slug
                                                            ? "#46C8FF"
                                                            : undefined, weight: "bold", className: "h-[20px] w-[20px]" }) })] }))] }) }) }), isActive && (_jsx(ThreadContainer, { workspace: workspace }))] }, workspace.id));
            }), showing && (_jsx(ManageWorkspace, { hideModal: hideModal, providedSlug: selectedWs ? selectedWs.slug : null }))] }));
}
