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
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, CircleNotch, Trash } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import paths from "@/utils/paths";
import showToast from "@/utils/toast";
import ThreadItem from './ThreadItem';
export var THREAD_RENAME_EVENT = "renameThread";
var STYLES = {
    loadingContainer: "flex flex-col bg-pulse w-full h-10 items-center justify-center",
    loadingText: "text-xs text-white animate-pulse",
    container: "flex flex-col",
    newThreadButton: "w-full relative flex h-[40px] items-center border-none hover:bg-[var(--theme-sidebar-thread-selected)] hover:light:bg-theme-sidebar-subitem-hover rounded-lg",
    buttonContent: "flex w-full gap-x-2 items-center pl-4",
    iconContainer: "bg-white/20 p-2 rounded-lg h-[24px] w-[24px] flex items-center justify-center",
    icon: "shrink-0 text-white light:text-theme-text-primary",
    buttonText: "text-left text-white light:text-theme-text-primary text-sm",
    deleteButton: "w-full relative flex h-[40px] items-center border-none hover:bg-red-400/20 rounded-lg group",
    deleteIcon: "shrink-0 text-white light:text-red-500/50 group-hover:text-red-400",
    deleteText: "text-white light:text-theme-text-secondary text-left text-sm group-hover:text-red-400",
};
export default function ThreadContainer(_a) {
    var _this = this;
    var workspace = _a.workspace;
    var _b = useParams().threadSlug, threadSlug = _b === void 0 ? null : _b;
    var _c = useState([]), threads = _c[0], setThreads = _c[1];
    var _d = useState(true), loading = _d[0], setLoading = _d[1];
    var _e = useState(false), ctrlPressed = _e[0], setCtrlPressed = _e[1];
    useEffect(function () {
        var chatHandler = function (event) {
            var _a = event.detail, threadSlug = _a.threadSlug, newName = _a.newName;
            setThreads(function (prevThreads) { return prevThreads.map(function (thread) {
                if (thread.slug === threadSlug) {
                    return Object.assign(Object.assign({}, thread), { name: newName });
                }
                return thread;
            }); });
        };
        window.addEventListener(THREAD_RENAME_EVENT, chatHandler);
        return function () {
            window.removeEventListener(THREAD_RENAME_EVENT, chatHandler);
        };
    }, []);
    useEffect(function () {
        function fetchThreads() {
            return __awaiter(this, void 0, void 0, function () {
                var threads;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!workspace.slug)
                                return [2 /*return*/];
                            return [4 /*yield*/, Workspace.threads.all(workspace.slug)];
                        case 1:
                            threads = (_a.sent()).threads;
                            setLoading(false);
                            setThreads(threads);
                            return [2 /*return*/];
                    }
                });
            });
        }
        fetchThreads();
    }, [workspace.slug]);
    useEffect(function () {
        var handleKeyDown = function (event) {
            if (["Control", "Meta"].includes(event.key)) {
                setCtrlPressed(true);
            }
        };
        var handleKeyUp = function (event) {
            if (["Control", "Meta"].includes(event.key)) {
                setCtrlPressed(false);
                setThreads(function (prev) { return prev.map(function (t) {
                    return Object.assign(Object.assign({}, t), { deleted: false });
                }); });
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return function () {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);
    var toggleForDeletion = function (id) {
        setThreads(function (prev) { return prev.map(function (t) {
            if (t.id !== id)
                return t;
            return Object.assign(Object.assign({}, t), { deleted: !t.deleted });
        }); });
    };
    var handleDeleteAll = function () { return __awaiter(_this, void 0, void 0, function () {
        var slugs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    slugs = threads.filter(function (t) { return t.deleted === true; }).map(function (t) { return t.slug; });
                    return [4 /*yield*/, Workspace.threads.deleteBulk(workspace.slug, slugs)];
                case 1:
                    _a.sent();
                    setThreads(function (prev) { return prev.filter(function (t) { return !t.deleted; }); });
                    return [2 /*return*/];
            }
        });
    }); };
    function removeThread(threadId) {
        setThreads(function (prev) { return prev.map(function (_t) {
            if (_t.id !== threadId)
                return _t;
            return Object.assign(Object.assign({}, _t), { deleted: true });
        }); });
        setTimeout(function () {
            setThreads(function (prev) { return prev.filter(function (t) { return !t.deleted; }); });
        }, 500);
    }
    if (loading) {
        return (_jsx("div", { className: STYLES.loadingContainer, children: _jsx("p", { className: STYLES.loadingText, children: "loading threads...." }) }));
    }
    var activeThreadIdx = !!threads.find(function (thread) { return (thread === null || thread === void 0 ? void 0 : thread.slug) === threadSlug; })
        ? threads.findIndex(function (thread) { return (thread === null || thread === void 0 ? void 0 : thread.slug) === threadSlug; }) + 1
        : 0;
    return (_jsxs("div", { className: STYLES.container, role: "list", "aria-label": "Threads", children: [_jsx(ThreadItem, { idx: 0, activeIdx: activeThreadIdx, isActive: activeThreadIdx === 0, thread: { slug: null, name: "default", id: "default" }, workspace: workspace, onRemove: function () { }, toggleMarkForDeletion: function () { }, hasNext: threads.length > 0 }), threads.map(function (thread, i) { return (_jsx(ThreadItem, { idx: i + 1, ctrlPressed: ctrlPressed, toggleMarkForDeletion: toggleForDeletion, activeIdx: activeThreadIdx, isActive: activeThreadIdx === i + 1, workspace: workspace, onRemove: removeThread, thread: thread, hasNext: i !== threads.length - 1 }, thread.slug)); }), _jsx(DeleteAllThreadButton, { ctrlPressed: ctrlPressed, threads: threads, onDelete: handleDeleteAll }), _jsx(NewThreadButton, { workspace: workspace })] }));
}
function NewThreadButton(_a) {
    var _this = this;
    var workspace = _a.workspace;
    var _b = useState(false), loading = _b[0], setLoading = _b[1];
    var onClick = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, thread, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setLoading(true);
                    return [4 /*yield*/, Workspace.threads.new(workspace.slug)];
                case 1:
                    _a = _b.sent(), thread = _a.thread, error = _a.error;
                    if (!!error) {
                        showToast("Could not create thread - ".concat(error), "error", { clear: true });
                        setLoading(false);
                        return [2 /*return*/];
                    }
                    window.location.replace(paths.workspace.thread(workspace.slug, thread.slug));
                    return [2 /*return*/];
            }
        });
    }); };
    return (_jsx("button", { onClick: onClick, className: STYLES.newThreadButton, children: _jsxs("div", { className: STYLES.buttonContent, children: [_jsx("div", { className: STYLES.iconContainer, children: loading ? (_jsx(CircleNotch, { weight: "bold", size: 14, className: "".concat(STYLES.icon, " animate-spin") })) : (_jsx(Plus, { weight: "bold", size: 14, className: STYLES.icon })) }), _jsx("p", { className: STYLES.buttonText, children: loading ? "Starting Thread..." : "New Thread" })] }) }));
}
function DeleteAllThreadButton(_a) {
    var ctrlPressed = _a.ctrlPressed, threads = _a.threads, onDelete = _a.onDelete;
    if (!ctrlPressed || threads.filter(function (t) { return t.deleted; }).length === 0)
        return null;
    return (_jsx("button", { type: "button", onClick: onDelete, className: STYLES.deleteButton, children: _jsxs("div", { className: STYLES.buttonContent, children: [_jsx("div", { className: "bg-transparent p-2 rounded-lg h-[24px] w-[24px] flex items-center justify-center", children: _jsx(Trash, { weight: "bold", size: 14, className: STYLES.deleteIcon }) }), _jsx("p", { className: STYLES.deleteText, children: "Delete Selected" })] }) }));
}
