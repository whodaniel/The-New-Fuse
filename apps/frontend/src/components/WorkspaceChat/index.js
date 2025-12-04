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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import Workspace from "@/models/workspace";
import LoadingChat from './LoadingChat';
import ChatContainer from './ChatContainer';
import paths from "@/utils/paths";
import { ModalWrapper } from '../ModalWrapper';
import { useParams } from "react-router-dom";
export default function WorkspaceChat(_a) {
    var loading = _a.loading, workspace = _a.workspace;
    var _b = useParams().threadSlug, threadSlug = _b === void 0 ? null : _b;
    var _c = useState([]), history = _c[0], setHistory = _c[1];
    var _d = useState(true), loadingHistory = _d[0], setLoadingHistory = _d[1];
    useEffect(function () {
        function getHistory() {
            return __awaiter(this, void 0, void 0, function () {
                var chatHistory, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (loading)
                                return [2 /*return*/];
                            if (!(workspace === null || workspace === void 0 ? void 0 : workspace.slug)) {
                                setLoadingHistory(false);
                                return [2 /*return*/, false];
                            }
                            if (!threadSlug) return [3 /*break*/, 2];
                            return [4 /*yield*/, Workspace.threads.chatHistory(workspace.slug, threadSlug)];
                        case 1:
                            _a = _b.sent();
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, Workspace.chatHistory(workspace.slug)];
                        case 3:
                            _a = _b.sent();
                            _b.label = 4;
                        case 4:
                            chatHistory = _a;
                            setHistory(chatHistory);
                            setLoadingHistory(false);
                            return [2 /*return*/];
                    }
                });
            });
        }
        getHistory();
    }, [workspace, loading, threadSlug]);
    if (loadingHistory)
        return _jsx(LoadingChat, {});
    if (!loading && !loadingHistory && !workspace) {
        return (_jsxs(_Fragment, { children: [loading === false && !workspace && (_jsx(ModalWrapper, { isOpen: true, children: _jsx("div", { className: "relative w-full max-w-2xl bg-theme-bg-secondary rounded-lg shadow border-2 border-theme-modal-border", children: _jsxs("div", { className: "flex flex-col gap-y-4 w-full p-6 text-center", children: [_jsx("p", { className: "font-semibold text-red-500 text-xl", children: "Workspace not found!" }), _jsx("p", { className: "text-sm mt-4 text-white", children: "It looks like a workspace by this name is not available." }), _jsx("div", { className: "flex w-full justify-center items-center mt-4", children: _jsx("a", { href: paths.home(), className: "transition-all duration-300 bg-white text-black hover:opacity-60 px-4 py-2 rounded-lg text-sm flex items-center gap-x-2", children: "Go back to homepage" }) })] }) }) })), _jsx(LoadingChat, {})] }));
    }
    setEventDelegatorForCodeSnippets();
    return (_jsx(ChatContainer, { workspace: workspace, knownHistory: history }));
}
// Enables us to safely markdown and sanitize all responses without risk of injection
// but still be able to attach a handler to copy code snippets on all elements
// that are code snippets.
function copyCodeSnippet(uuid) {
    var _a, _b, _c;
    var target = document.querySelector("[data-code=\"".concat(uuid, "\"]"));
    if (!target)
        return false;
    var markdown = (_c = (_b = (_a = target.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.querySelector("pre:first-of-type")) === null || _c === void 0 ? void 0 : _c.innerText;
    if (!markdown)
        return false;
    window.navigator.clipboard.writeText(markdown);
    target.classList.add("text-green-500");
    var originalText = target.innerHTML;
    target.innerText = "Copied!";
    target.setAttribute("disabled", "true");
    setTimeout(function () {
        target.classList.remove("text-green-500");
        target.innerHTML = originalText;
        target.removeAttribute("disabled");
    }, 2500);
    return true;
}
// Listens and hunts for all data-code-snippet clicks.
export function setEventDelegatorForCodeSnippets() {
    document === null || document === void 0 ? void 0 : document.addEventListener("click", function (e) {
        var target = e.target.closest("[data-code-snippet]");
        var uuidCode = target === null || target === void 0 ? void 0 : target.getAttribute("data-code");
        if (!uuidCode)
            return;
        copyCodeSnippet(uuidCode);
    });
}
