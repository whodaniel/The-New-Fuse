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
import { useState, useEffect, useContext } from "react";
import ChatHistory from './ChatHistory';
import { CLEAR_ATTACHMENTS_EVENT, DndUploaderContext } from './DnDWrapper';
import PromptInput, { PROMPT_INPUT_EVENT } from './PromptInput';
import { isMobile } from "react-device-detect";
import { SidebarMobileHeader } from '../../Sidebar';
import { useParams } from "react-router-dom";
import { v4 } from "uuid";
import handleSocketResponse, { websocketURI, AGENT_SESSION_END, AGENT_SESSION_START, ABORT_STREAM_EVENT, } from "@/utils/chat/agent";
import { handleChat } from "@/utils/chat/handlers";
import { Workspace } from "@/utils/workspace";
import DnDFileUploaderWrapper from './DnDWrapper';
import SpeechRecognition, { useSpeechRecognition, } from "react-speech-recognition";
// import { ChatTooltips } from './ChatTooltips';
import { TimeStamp } from "@/utils/TimeStamp";
import MessageGroup from './ChatHistory/MessageGroup';
import { Settings, MoreHorizontal, ChevronDown, Bot } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LLMSelector } from '@/components/LLMSelection/LLMSelector';
export default function ChatContainer(_a) {
    var _this = this;
    var messages = _a.messages, workspace = _a.workspace, chatId = _a.chatId, onEditMessage = _a.onEditMessage, onRegenerateMessage = _a.onRegenerateMessage, onForkThread = _a.onForkThread, _b = _a.knownHistory, knownHistory = _b === void 0 ? [] : _b;
    var _c = useParams().threadSlug, threadSlug = _c === void 0 ? null : _c;
    var _d = useState(""), message = _d[0], setMessage = _d[1];
    var _e = useState(false), loadingResponse = _e[0], setLoadingResponse = _e[1];
    var _f = useState(knownHistory), chatHistory = _f[0], setChatHistory = _f[1];
    var _g = useState(null), socketId = _g[0], setSocketId = _g[1];
    var _h = useState(null), websocket = _h[0], setWebsocket = _h[1];
    var _j = useContext(DndUploaderContext), files = _j.files, parseAttachments = _j.parseAttachments;
    // New state for LLM provider selection
    var _k = useState(''), selectedLLMProviderId = _k[0], setSelectedLLMProviderId = _k[1];
    var _l = useState(false), isLLMDialogOpen = _l[0], setIsLLMDialogOpen = _l[1];
    var handleMessageChange = function (event) {
        setMessage(event.target.value);
    };
    var _m = useSpeechRecognition({
        clearTranscriptOnListen: true,
    }), listening = _m.listening, resetTranscript = _m.resetTranscript;
    function setMessageEmit(messageContent) {
        if (messageContent === void 0) { messageContent = ""; }
        setMessage(messageContent);
        window.dispatchEvent(new CustomEvent(PROMPT_INPUT_EVENT, { detail: messageContent }));
    }
    var handleSubmit = function (event) { return __awaiter(_this, void 0, void 0, function () {
        var prevChatHistory;
        return __generator(this, function (_a) {
            event.preventDefault();
            if (!message || message === "")
                return [2 /*return*/, false];
            prevChatHistory = __spreadArray(__spreadArray([], chatHistory, true), [
                {
                    content: message,
                    role: "user",
                    attachments: parseAttachments(),
                },
                {
                    content: "",
                    role: "assistant",
                    pending: true,
                    userMessage: message,
                    animate: true,
                },
            ], false);
            if (listening) {
                endTTSSession();
            }
            setChatHistory(prevChatHistory);
            setMessageEmit("");
            setLoadingResponse(true);
            return [2 /*return*/];
        });
    }); };
    function endTTSSession() {
        SpeechRecognition.stopListening();
        resetTranscript();
    }
    var regenerateAssistantMessage = function (chatId) {
        var updatedHistory = chatHistory.slice(0, -1);
        var lastUserMessage = updatedHistory.slice(-1)[0];
        if (!(workspace === null || workspace === void 0 ? void 0 : workspace.slug))
            return;
        Workspace.deleteChats(workspace.slug, [chatId])
            .then(function () {
            return sendCommand(lastUserMessage.content, true, updatedHistory, lastUserMessage === null || lastUserMessage === void 0 ? void 0 : lastUserMessage.attachments);
        })
            .catch(function (e) { return console.error(e); });
    };
    var sendCommand = function (command_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(_this, __spreadArray([command_1], args_1, true), void 0, function (command, submit, history, attachments) {
            var prevChatHistory;
            if (submit === void 0) { submit = false; }
            if (history === void 0) { history = []; }
            if (attachments === void 0) { attachments = []; }
            return __generator(this, function (_a) {
                if (!command || command === "")
                    return [2 /*return*/, false];
                if (!submit) {
                    setMessageEmit(command);
                    return [2 /*return*/];
                }
                if (history.length > 0) {
                    prevChatHistory = __spreadArray(__spreadArray([], history, true), [
                        {
                            content: "",
                            role: "assistant",
                            pending: true,
                            userMessage: command,
                            attachments: attachments,
                            animate: true,
                        },
                    ], false);
                }
                else {
                    prevChatHistory = __spreadArray(__spreadArray([], chatHistory, true), [
                        {
                            content: command,
                            role: "user",
                            attachments: attachments,
                        },
                        {
                            content: "",
                            role: "assistant",
                            pending: true,
                            userMessage: command,
                            animate: true,
                        },
                    ], false);
                }
                setChatHistory(prevChatHistory);
                setMessageEmit("");
                setLoadingResponse(true);
                return [2 /*return*/];
            });
        });
    };
    useEffect(function () {
        function fetchReply() {
            return __awaiter(this, void 0, void 0, function () {
                var promptMessage, remHistory, _chatHistory, attachments;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            promptMessage = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;
                            remHistory = chatHistory.length > 0 ? chatHistory.slice(0, -1) : [];
                            _chatHistory = __spreadArray([], remHistory, true);
                            if (websocket) {
                                if (!promptMessage || !(promptMessage === null || promptMessage === void 0 ? void 0 : promptMessage.userMessage))
                                    return [2 /*return*/, false];
                                websocket.send(JSON.stringify({
                                    type: "awaitingFeedback",
                                    feedback: promptMessage === null || promptMessage === void 0 ? void 0 : promptMessage.userMessage,
                                }));
                                return [2 /*return*/];
                            }
                            if (!promptMessage || !(promptMessage === null || promptMessage === void 0 ? void 0 : promptMessage.userMessage) || !(workspace === null || workspace === void 0 ? void 0 : workspace.slug))
                                return [2 /*return*/, false];
                            attachments = (_a = promptMessage === null || promptMessage === void 0 ? void 0 : promptMessage.attachments) !== null && _a !== void 0 ? _a : parseAttachments();
                            window.dispatchEvent(new CustomEvent(CLEAR_ATTACHMENTS_EVENT));
                            return [4 /*yield*/, Workspace.multiplexStream({
                                    workspaceSlug: workspace.slug,
                                    threadSlug: threadSlug,
                                    prompt: promptMessage.userMessage,
                                    chatHandler: function (chatResult) {
                                        return handleChat(chatResult, setLoadingResponse, setChatHistory, remHistory, _chatHistory, setSocketId);
                                    },
                                    attachments: attachments,
                                    // Include the selected LLM provider ID if available
                                    llmProviderId: selectedLLMProviderId || undefined,
                                })];
                        case 1:
                            _b.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        loadingResponse === true && fetchReply();
    }, [loadingResponse, chatHistory, workspace, selectedLLMProviderId]);
    useEffect(function () {
        function handleWSS() {
            try {
                if (!socketId || !!websocket)
                    return;
                var socket_1 = new WebSocket("".concat(websocketURI(), "/api/agent-invocation/").concat(socketId));
                window.addEventListener(ABORT_STREAM_EVENT, function () {
                    window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
                    websocket === null || websocket === void 0 ? void 0 : websocket.close();
                });
                socket_1.addEventListener("message", function (event) {
                    setLoadingResponse(true);
                    try {
                        handleSocketResponse(event, setChatHistory);
                    }
                    catch (e) {
                        console.error("Failed to parse data");
                        window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
                        socket_1.close();
                    }
                    setLoadingResponse(false);
                });
                socket_1.addEventListener("close", function (_event) {
                    window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
                    setChatHistory(function (prev) { return __spreadArray(__spreadArray([], prev.filter(function (msg) { return !!msg.content; }), true), [
                        {
                            uuid: v4(),
                            type: "statusResponse",
                            content: "Agent session complete.",
                            role: "assistant",
                            sources: [],
                            closed: true,
                            error: null,
                            animate: false,
                            pending: false,
                        },
                    ], false); });
                    setLoadingResponse(false);
                    setWebsocket(null);
                    setSocketId(null);
                });
                setWebsocket(socket_1);
                window.dispatchEvent(new CustomEvent(AGENT_SESSION_START));
                window.dispatchEvent(new CustomEvent(CLEAR_ATTACHMENTS_EVENT));
            }
            catch (e) {
                var error_1 = e instanceof Error ? e.message : "Unknown error";
                setChatHistory(function (prev) { return __spreadArray(__spreadArray([], prev.filter(function (msg) { return !!msg.content; }), true), [
                    {
                        uuid: v4(),
                        type: "abort",
                        content: error_1,
                        role: "assistant",
                        sources: [],
                        closed: true,
                        error: error_1,
                        animate: false,
                        pending: false,
                    },
                ], false); });
                setLoadingResponse(false);
                setWebsocket(null);
                setSocketId(null);
            }
        }
        handleWSS();
    }, [socketId, websocket]);
    // Group messages by date
    var groupMessagesByDate = function (messages) {
        var groups = {};
        messages.forEach(function (message) {
            var timestamp = new TimeStamp(message.createdAt);
            var dateKey = timestamp.startOfDay().toISOString();
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(message);
        });
        // Sort groups by date, most recent first
        return Object.entries(groups)
            .sort(function (_a, _b) {
            var dateA = _a[0];
            var dateB = _b[0];
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        })
            .map(function (_a) {
            var _ = _a[0], groupMessages = _a[1];
            return groupMessages;
        });
    };
    var messageGroups = groupMessagesByDate(messages);
    return (_jsxs("div", { className: "transition-all duration-500 relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full ".concat(isMobile ? "h-full" : "h-[calc(100%-32px)]", " overflow-y-scroll no-scroll"), children: [isMobile && _jsx(SidebarMobileHeader, {}), _jsxs("div", { className: "sticky top-0 z-10 flex justify-between items-center px-4 py-2 bg-theme-bg-secondary border-b border-theme-border", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Bot, { className: "h-5 w-5 text-theme-text-secondary" }), _jsx("span", { className: "font-medium", children: (workspace === null || workspace === void 0 ? void 0 : workspace.name) || 'Chat' })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Dialog, { open: isLLMDialogOpen, onOpenChange: setIsLLMDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "flex items-center space-x-1 text-sm text-theme-text-secondary", children: [_jsx(Settings, { className: "h-4 w-4" }), _jsx("span", { children: "Model Settings" }), _jsx(ChevronDown, { className: "h-3 w-3 ml-1" })] }) }), _jsxs(DialogContent, { className: "sm:max-w-[425px]", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Choose AI Model" }) }), _jsx("div", { className: "py-4", children: _jsx(LLMSelector, { selectedProviderId: selectedLLMProviderId, onChange: function (providerId) {
                                                        setSelectedLLMProviderId(providerId);
                                                        // Close dialog after selection (optional)
                                                        setTimeout(function () { return setIsLLMDialogOpen(false); }, 500);
                                                    }, description: "Select the AI model you want to chat with" }) })] })] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", children: _jsx(MoreHorizontal, { className: "h-5 w-5" }) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuItem, { onClick: function () { return setChatHistory([]); }, children: "Clear conversation" }), onForkThread && chatId && (_jsx(DropdownMenuItem, { onClick: function () { return onForkThread(chatId); }, children: "Fork thread" }))] })] })] })] }), _jsxs(DnDFileUploaderWrapper, { children: [_jsx(ChatHistory, { history: chatHistory, workspace: workspace, sendCommand: sendCommand, updateHistory: setChatHistory, regenerateAssistantMessage: regenerateAssistantMessage, hasAttachments: files.length > 0 }), _jsx("div", { className: "flex-1 overflow-y-auto", children: messageGroups.map(function (groupMessages, index) { return (_jsx(MessageGroup, { messages: groupMessages, workspace: workspace, chatId: chatId, onEditMessage: onEditMessage, onRegenerateMessage: onRegenerateMessage, onForkThread: onForkThread }, index)); }) }), _jsx(PromptInput, { submit: handleSubmit, onChange: handleMessageChange, inputDisabled: loadingResponse, buttonDisabled: loadingResponse, sendCommand: sendCommand, attachments: files })] })] }));
}
