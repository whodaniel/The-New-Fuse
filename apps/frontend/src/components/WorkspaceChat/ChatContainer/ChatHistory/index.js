var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import HistoricalMessage from './HistoricalMessage';
import PromptReply from './PromptReply';
import { useManageWorkspaceModal } from '../../../Modals/ManageWorkspace';
import ManageWorkspace from '../../../Modals/ManageWorkspace';
import { ArrowDown } from "@phosphor-icons/react";
import debounce from "lodash.debounce";
import useUser from "@/hooks/useUser";
import Chartable from './Chartable';
import Workspace from "@/models/workspace";
import { useParams } from "react-router-dom";
import paths from "@/utils/paths";
import Appearance from "@/models/appearance";
import useTextSize from "@/hooks/useTextSize";
export default function ChatHistory(_a) {
    var _this = this;
    var _b, _c;
    var _d = _a.history, history = _d === void 0 ? [] : _d, workspace = _a.workspace, sendCommand = _a.sendCommand, updateHistory = _a.updateHistory, regenerateAssistantMessage = _a.regenerateAssistantMessage, _e = _a.hasAttachments, hasAttachments = _e === void 0 ? false : _e;
    var lastScrollTopRef = useRef(0);
    var user = useUser().user;
    var _f = useParams().threadSlug, threadSlug = _f === void 0 ? null : _f;
    var _g = useManageWorkspaceModal(), showing = _g.showing, showModal = _g.showModal, hideModal = _g.hideModal;
    var _h = useState(true), isAtBottom = _h[0], setIsAtBottom = _h[1];
    var chatHistoryRef = useRef(null);
    var _j = useState(false), isUserScrolling = _j[0], setIsUserScrolling = _j[1];
    var isStreaming = (_b = history[history.length - 1]) === null || _b === void 0 ? void 0 : _b.animate;
    var showScrollbar = Appearance.getSettings().showScrollbar;
    var textSizeClass = useTextSize().textSizeClass;
    useEffect(function () {
        if (!isUserScrolling && (isAtBottom || isStreaming)) {
            scrollToBottom(false);
        }
    }, [history, isAtBottom, isStreaming, isUserScrolling]);
    var handleScroll = function (e) {
        var target = e.target;
        var scrollTop = target.scrollTop, scrollHeight = target.scrollHeight, clientHeight = target.clientHeight;
        var isBottom = scrollHeight - scrollTop === clientHeight;
        if (Math.abs(scrollTop - lastScrollTopRef.current) > 10) {
            setIsUserScrolling(!isBottom);
        }
        setIsAtBottom(isBottom);
        lastScrollTopRef.current = scrollTop;
    };
    var debouncedScroll = debounce(handleScroll, 100);
    useEffect(function () {
        var chatHistoryElement = chatHistoryRef.current;
        if (chatHistoryElement) {
            chatHistoryElement.addEventListener("scroll", debouncedScroll);
            return function () {
                return chatHistoryElement.removeEventListener("scroll", debouncedScroll);
            };
        }
    }, []);
    var scrollToBottom = function (smooth) {
        if (smooth === void 0) { smooth = false; }
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTo(__assign({ top: chatHistoryRef.current.scrollHeight }, (smooth ? { behavior: "smooth" } : {})));
        }
    };
    var handleSendSuggestedMessage = function (heading, message) {
        sendCommand("".concat(heading, " ").concat(message), true);
    };
    var saveEditedMessage = function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var updatedHistory, updatedHistory, targetIdx;
        var editedMessage = _b.editedMessage, chatId = _b.chatId, role = _b.role, _c = _b.attachments, attachments = _c === void 0 ? [] : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!editedMessage || !(workspace === null || workspace === void 0 ? void 0 : workspace.slug))
                        return [2 /*return*/];
                    if (!(role === "user")) return [3 /*break*/, 2];
                    updatedHistory = history.slice(0, history.findIndex(function (msg) { return msg.chatId === chatId; }) + 1);
                    updatedHistory[updatedHistory.length - 1].content = editedMessage;
                    return [4 /*yield*/, Workspace.deleteEditedChats(workspace.slug, threadSlug, chatId)];
                case 1:
                    _d.sent();
                    sendCommand(editedMessage, true, updatedHistory, attachments);
                    return [2 /*return*/];
                case 2:
                    if (!(role === "assistant")) return [3 /*break*/, 4];
                    updatedHistory = __spreadArray([], history, true);
                    targetIdx = history.findIndex(function (msg) { return msg.chatId === chatId && msg.role === role; });
                    if (targetIdx < 0)
                        return [2 /*return*/];
                    updatedHistory[targetIdx].content = editedMessage;
                    updateHistory(updatedHistory);
                    return [4 /*yield*/, Workspace.updateChatResponse(workspace.slug, threadSlug, chatId, editedMessage)];
                case 3:
                    _d.sent();
                    return [2 /*return*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var forkThread = function (chatId) { return __awaiter(_this, void 0, void 0, function () {
        var newThreadSlug;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(workspace === null || workspace === void 0 ? void 0 : workspace.slug))
                        return [2 /*return*/];
                    return [4 /*yield*/, Workspace.forkThread(workspace.slug, threadSlug, chatId)];
                case 1:
                    newThreadSlug = _a.sent();
                    window.location.href = paths.workspace.thread(workspace.slug, newThreadSlug);
                    return [2 /*return*/];
            }
        });
    }); };
    if (history.length === 0 && !hasAttachments) {
        return (_jsxs("div", { className: "flex flex-col h-full md:mt-0 pb-44 md:pb-40 w-full justify-end items-center", children: [_jsxs("div", { className: "flex flex-col items-center md:items-start md:max-w-[600px] w-full px-4", children: [_jsx("p", { className: "text-white/60 text-lg font-base py-4", children: "Welcome to your new workspace." }), !user || user.role !== "default" ? (_jsxs("p", { className: "w-full items-center text-white/60 text-lg font-base flex flex-col md:flex-row gap-x-1", children: ["To get started either", " ", _jsx("span", { className: "underline font-medium cursor-pointer", onClick: showModal, children: "upload a document" }), "or ", _jsx("b", { className: "font-medium italic", children: "send a chat." })] })) : (_jsxs("p", { className: "w-full items-center text-white/60 text-lg font-base flex flex-col md:flex-row gap-x-1", children: ["To get started ", _jsx("b", { className: "font-medium italic", children: "send a chat." })] })), _jsx(WorkspaceChatSuggestions, { suggestions: (_c = workspace === null || workspace === void 0 ? void 0 : workspace.suggestedMessages) !== null && _c !== void 0 ? _c : [], sendSuggestion: handleSendSuggestedMessage })] }), showing && (_jsx(ManageWorkspace, { hideModal: hideModal, providedSlug: workspace === null || workspace === void 0 ? void 0 : workspace.slug }))] }));
    }
    return (_jsxs("div", { className: "markdown text-white/80 light:text-theme-text-primary font-light ".concat(textSizeClass, " h-full md:h-[83%] pb-[100px] pt-6 md:pt-0 md:pb-20 md:mx-0 overflow-y-scroll flex flex-col justify-start ").concat(showScrollbar ? "show-scrollbar" : "no-scroll"), id: "chat-history", ref: chatHistoryRef, onScroll: handleScroll, children: [history.map(function (props, index) {
                var isLastBotReply = index === history.length - 1 && props.role === "assistant";
                if ((props === null || props === void 0 ? void 0 : props.type) === "statusResponse" && !!props.content) {
                    return _jsx(StatusResponse, { props: props }, props.uuid);
                }
                if (props.type === "rechartVisualize" && !!props.content) {
                    return (_jsx(Chartable, { workspace: workspace, props: props }, props.uuid));
                }
                if (isLastBotReply && props.animate) {
                    return (_jsx(PromptReply, { uuid: props.uuid, reply: props.content, pending: props.pending, sources: props.sources, error: props.error, workspace: workspace, closed: props.closed }, props.uuid));
                }
                return (_jsx(HistoricalMessage, { message: props.content, role: props.role, workspace: workspace, sources: props.sources, feedbackScore: props.feedbackScore, chatId: props.chatId, error: props.error, attachments: props.attachments, regenerateMessage: regenerateAssistantMessage, isLastMessage: isLastBotReply, saveEditedMessage: saveEditedMessage, forkThread: forkThread }, index));
            }), showing && (_jsx(ManageWorkspace, { hideModal: hideModal, providedSlug: workspace === null || workspace === void 0 ? void 0 : workspace.slug })), !isAtBottom && (_jsx("div", { className: "fixed bottom-40 right-10 md:right-20 z-50 cursor-pointer animate-pulse", children: _jsx("div", { className: "flex flex-col items-center", children: _jsx("div", { className: "p-1 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 hover:text-white", onClick: function () {
                            scrollToBottom(true);
                            setIsUserScrolling(false);
                        }, children: _jsx(ArrowDown, { weight: "bold", className: "text-white/60 w-5 h-5" }) }) }) }))] }));
}
function StatusResponse(_a) {
    var props = _a.props;
    return (_jsx("div", { className: "flex justify-center items-end w-full", children: _jsx("div", { className: "py-2 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col", children: _jsx("div", { className: "flex gap-x-5", children: _jsx("span", { className: "text-xs inline-block p-2 rounded-lg text-white/60 font-mono whitespace-pre-line", children: props.content }) }) }) }));
}
function WorkspaceChatSuggestions(_a) {
    var _b = _a.suggestions, suggestions = _b === void 0 ? [] : _b, sendSuggestion = _a.sendSuggestion;
    if (suggestions.length === 0)
        return null;
    return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2 text-theme-text-primary text-xs mt-10 w-full justify-center", children: suggestions.map(function (suggestion, index) { return (_jsxs("button", { className: "text-left p-2.5 rounded-xl bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover border border-theme-border", onClick: function () { return sendSuggestion(suggestion.heading, suggestion.message); }, children: [_jsx("p", { className: "font-semibold", children: suggestion.heading }), _jsx("p", { children: suggestion.message })] }, index)); }) }));
}
