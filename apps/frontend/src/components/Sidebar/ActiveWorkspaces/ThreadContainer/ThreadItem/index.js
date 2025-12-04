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
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowCounterClockwise, DotsThree, PencilSimple, Trash, X, } from "@phosphor-icons/react";
import truncate from "truncate";
import Workspace from "@/models/workspace";
import paths from "@/utils/paths";
import showToast from "@/utils/toast";
var STYLES = {
    container: "w-full relative flex h-[38px] items-center border-none rounded-lg",
    curvedLine: function (isActive) { return "".concat(isActive
        ? "border-l-2 border-b-2 border-white light:border-theme-sidebar-border z-30"
        : "border-l border-b border-[#6F6F71] light:border-theme-sidebar-border z-10", " h-[50%] absolute top-0 left-2 rounded-bl-lg"); },
    downstroke: function (idx, activeIdx, isActive) { return "".concat(idx <= activeIdx && !isActive
        ? "border-l-2 border-white light:border-theme-sidebar-border z-20"
        : "border-l border-[#6F6F71] light:border-theme-sidebar-border z-10", " h-[100%] absolute top-0 left-2"); },
    threadContent: function (isActive) { return "flex w-full items-center justify-between pr-2 group relative ".concat(isActive
        ? "bg-[var(--theme-sidebar-thread-selected)] border border-solid border-transparent light:border-blue-400"
        : "hover:bg-theme-sidebar-subitem-hover", " rounded-[4px]"); },
    deletedText: "text-left text-sm text-slate-400/50 light:text-slate-500 italic",
    threadName: function (isActive) { return "text-left text-sm ".concat(isActive ? "font-medium text-white" : "text-theme-text-primary"); },
    optionsButton: "text-zinc-300 light:text-theme-text-secondary hover:text-white hover:light:text-theme-text-primary",
    optionsMenu: "absolute w-fit z-[20] top-[25px] right-[10px] bg-zinc-900 light:bg-theme-bg-sidebar light:border-[1px] light:border-theme-sidebar-border rounded-lg p-1",
    menuButton: "w-full rounded-md flex items-center p-2 gap-x-2",
    renameButton: "hover:bg-slate-500/20 text-slate-300 light:text-theme-text-primary",
    deleteButton: "hover:bg-red-500/20 text-slate-300 light:text-theme-text-primary hover:text-red-100",
};
var THREAD_CALLOUT_DETAIL_WIDTH = 26;
export default function ThreadItem(_c) {
    var idx = _c.idx, activeIdx = _c.activeIdx, isActive = _c.isActive, workspace = _c.workspace, thread = _c.thread, onRemove = _c.onRemove, toggleMarkForDeletion = _c.toggleMarkForDeletion, hasNext = _c.hasNext, _d = _c.ctrlPressed, ctrlPressed = _d === void 0 ? false : _d;
    var slug = useParams().slug;
    var optionsContainer = useRef(null);
    var _e = useState(false), showOptions = _e[0], setShowOptions = _e[1];
    var linkTo = !thread.slug
        ? paths.workspace.chat(slug)
        : paths.workspace.thread(slug, thread.slug);
    return (_jsxs("div", { className: STYLES.container, role: "listitem", children: [_jsx("div", { style: { width: THREAD_CALLOUT_DETAIL_WIDTH / 2 }, className: STYLES.curvedLine(isActive) }), hasNext && (_jsx("div", { style: { width: THREAD_CALLOUT_DETAIL_WIDTH / 2 }, className: STYLES.downstroke(idx, activeIdx, isActive) })), _jsx("div", { style: { width: THREAD_CALLOUT_DETAIL_WIDTH + 8 }, className: "h-full" }), _jsxs("div", { className: STYLES.threadContent(isActive), children: [thread.deleted ? (_jsxs("div", { className: "w-full flex justify-between", children: [_jsx("div", { className: "w-full pl-2 py-1", children: _jsx("p", { className: STYLES.deletedText, children: "deleted thread" }) }), ctrlPressed && (_jsx("button", { type: "button", className: "border-none", onClick: function () { return toggleMarkForDeletion(thread.id); }, children: _jsx(ArrowCounterClockwise, { className: STYLES.optionsButton, size: 18 }) }))] })) : (_jsx("a", { href: window.location.pathname === linkTo || ctrlPressed ? "#" : linkTo, className: "w-full pl-2 py-1", "aria-current": isActive ? "page" : undefined, children: _jsx("p", { className: STYLES.threadName(isActive), children: truncate(thread.name, 25) }) })), !!thread.slug && !thread.deleted && (_jsxs("div", { ref: optionsContainer, className: "flex items-center", children: [ctrlPressed ? (_jsx("button", { type: "button", className: "border-none", onClick: function () { return toggleMarkForDeletion(thread.id); }, children: _jsx(X, { className: STYLES.optionsButton, weight: "bold", size: 18 }) })) : (_jsx("div", { className: "flex items-center w-fit group-hover:visible md:invisible gap-x-1", children: _jsx("button", { type: "button", className: "border-none", onClick: function () { return setShowOptions(!showOptions); }, "aria-label": "Thread options", children: _jsx(DotsThree, { className: STYLES.optionsButton, size: 25 }) }) })), showOptions && (_jsx(OptionsMenu, { containerRef: optionsContainer, workspace: workspace, thread: thread, onRemove: onRemove, close: function () { return setShowOptions(false); } }))] }))] })] }));
}
function OptionsMenu(_c) {
    var _this = this;
    var containerRef = _c.containerRef, workspace = _c.workspace, thread = _c.thread, onRemove = _c.onRemove, close = _c.close;
    var menuRef = useRef(null);
    var outsideClick = function (e) {
        var _a, _b;
        if (!menuRef.current)
            return false;
        var target = e.target;
        if (!((_a = menuRef.current) === null || _a === void 0 ? void 0 : _a.contains(target)) &&
            !((_b = containerRef.current) === null || _b === void 0 ? void 0 : _b.contains(target)))
            close();
        return false;
    };
    var isEsc = function (e) {
        if (e.key === "Escape" || e.key === "Esc")
            close();
    };
    function cleanupListeners() {
        window.removeEventListener("click", outsideClick);
        window.removeEventListener("keyup", isEsc);
    }
    useEffect(function () {
        function setListeners() {
            if (!(menuRef === null || menuRef === void 0 ? void 0 : menuRef.current) || !containerRef.current)
                return false;
            window.document.addEventListener("click", outsideClick);
            window.document.addEventListener("keyup", isEsc);
        }
        setListeners();
        return cleanupListeners;
    }, [menuRef.current, containerRef.current]);
    var renameThread = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, name, message;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    name = (_a = window
                        .prompt("What would you like to rename this thread to?")) === null || _a === void 0 ? void 0 : _a.trim();
                    if (!name || name.length === 0) {
                        close();
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, Workspace.threads.update(workspace.slug, thread.slug, { name: name })];
                case 1:
                    message = (_c.sent()).message;
                    if (!!message) {
                        showToast("Thread could not be updated! ".concat(message), "error", {
                            clear: true,
                        });
                        close();
                        return [2 /*return*/];
                    }
                    thread.name = name;
                    close();
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function () { return __awaiter(_this, void 0, void 0, function () {
        var success;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!window.confirm("Are you sure you want to delete this thread? All of its chats will be deleted. You cannot undo this."))
                        return [2 /*return*/];
                    return [4 /*yield*/, Workspace.threads.delete(workspace.slug, thread.slug)];
                case 1:
                    success = _c.sent();
                    if (!success) {
                        showToast("Thread could not be deleted!", "error", { clear: true });
                        return [2 /*return*/];
                    }
                    showToast("Thread deleted successfully!", "success", { clear: true });
                    onRemove(thread.id);
                    return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { ref: menuRef, className: STYLES.optionsMenu, children: [_jsxs("button", { onClick: renameThread, type: "button", className: "".concat(STYLES.menuButton, " ").concat(STYLES.renameButton), children: [_jsx(PencilSimple, { size: 18 }), _jsx("p", { className: "text-sm", children: "Rename" })] }), _jsxs("button", { onClick: handleDelete, type: "button", className: "".concat(STYLES.menuButton, " ").concat(STYLES.deleteButton), children: [_jsx(Trash, { size: 18 }), _jsx("p", { className: "text-sm", children: "Delete Thread" })] })] }));
}
