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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import app from '../lib/firebase';
import { getAuth, signInAnonymously, onAuthStateChanged, } from "firebase/auth";
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc, getDocs, writeBatch } from "firebase/firestore";
// --- App Context ---
var AppContext = createContext();
// --- Icons ---
var EditIcon = function () { return _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" }) }); };
var DeleteIcon = function () { return _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("polyline", { points: "3 6 5 6 21 6" }), _jsx("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }), _jsx("line", { x1: "10", y1: "11", x2: "10", y2: "17" }), _jsx("line", { x1: "14", y1: "11", x2: "14", y2: "17" })] }); };
var SettingsIcon = function () { return _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" })] }); };
var SystemIcon = function () { return _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z", fill: "currentColor" }) }); };
// --- Helper Functions ---
var cn = function () {
    var classes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        classes[_i] = arguments[_i];
    }
    return classes.filter(Boolean).join(' ');
};
// --- Main Component ---
export default function MultiAgentChat() {
    return (_jsx(AppProvider, { children: _jsx(AppUI, {}) }));
}
// --- UI Components ---
var Splash = function () { return (_jsxs("div", { className: "flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white", children: [_jsx("div", { className: "w-20 h-20 border-8 border-dashed rounded-full animate-spin border-blue-500 mb-6" }), _jsx("h1", { className: "text-3xl font-bold mb-2", children: "Multi-Agent Chat" }), _jsx("p", { className: "text-gray-400", children: "Initializing session..." })] })); };
var AppUI = function () {
    var _a = useContext(AppContext), agents = _a.agents, messages = _a.messages, isDataLoading = _a.isDataLoading, isAutomating = _a.isAutomating, inputValue = _a.inputValue, setInputValue = _a.setInputValue, handleSendMessage = _a.handleSendMessage, handleAutomateAll = _a.handleAutomateAll, mode = _a.mode, setMode = _a.setMode, conversationGoal = _a.conversationGoal, setConversationGoal = _a.setConversationGoal, isAgentModalOpen = _a.isAgentModalOpen, setIsAgentModalOpen = _a.setIsAgentModalOpen, agentToEdit = _a.agentToEdit, setAgentToEdit = _a.setAgentToEdit, handleAddAgent = _a.handleAddAgent, handleUpdateAgent = _a.handleUpdateAgent, handleRemoveAgent = _a.handleRemoveAgent;
    var messagesEndRef = useRef(null);
    useEffect(function () {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    var MessageBubble = function (_a) {
        var msg = _a.msg;
        var isYou = msg.sender === 'You';
        var isSystem = msg.sender === 'system';
        var bubbleClass = cn('p-4 rounded-xl shadow-md', isYou && 'bg-blue-500 text-white', isSystem && 'bg-gray-500 text-white text-center text-xs italic', !isYou && !isSystem && 'bg-white dark:bg-gray-700');
        return (_jsx("div", { className: cn('flex items-start gap-3 max-w-xl w-full', isYou ? 'self-end' : 'self-start'), children: _jsxs("div", { className: bubbleClass, children: [!isYou && !isSystem && _jsx("div", { className: "font-bold mb-1", children: msg.sender }), _jsx("p", { className: "whitespace-pre-wrap break-words", children: msg.text })] }) }));
    };
    var AgentModal = function (_a) {
        var isOpen = _a.isOpen, onClose = _a.onClose, onSave = _a.onSave, onUpdate = _a.onUpdate;
        if (!isOpen)
            return null;
        var _b = useState((agentToEdit === null || agentToEdit === void 0 ? void 0 : agentToEdit.name) || ''), name = _b[0], setName = _b[1];
        var _c = useState((agentToEdit === null || agentToEdit === void 0 ? void 0 : agentToEdit.systemPrompt) || ''), systemPrompt = _c[0], setSystemPrompt = _c[1];
        var handleSubmit = function (e) {
            e.preventDefault();
            var agentData = { name: name, systemPrompt: systemPrompt, llm: 'gemini', model: 'gemini-1.5-flash-latest' };
            if (agentToEdit) {
                onUpdate(agentData);
            }
            else {
                onSave(agentData);
            }
        };
        return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4", children: _jsxs("form", { onSubmit: handleSubmit, className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: agentToEdit ? "Edit Agent" : "Create Agent" }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block mb-1 font-semibold", children: "Name" }), _jsx("input", { type: "text", value: name, onChange: function (e) { return setName(e.target.value); }, required: true, className: "w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block mb-1 font-semibold", children: "System Prompt" }), _jsx("textarea", { value: systemPrompt, onChange: function (e) { return setSystemPrompt(e.target.value); }, required: true, rows: "4", className: "w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" })] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg", children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600", children: "Save" })] })] }) }));
    };
    if (isDataLoading)
        return _jsx(Splash, {});
    return (_jsxs("div", { className: "grid grid-rows-[auto_1fr_auto] h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans", children: [isAutomating && _jsxs("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-[100]", children: [_jsx("div", { className: "w-16 h-16 border-8 border-dashed rounded-full animate-spin border-blue-500" }), _jsx("p", { className: "text-white text-xl mt-4", children: "Automating Setup..." })] }), _jsx(AgentModal, { isOpen: isAgentModalOpen, onClose: function () { setIsAgentModalOpen(false); setAgentToEdit(null); }, onSave: handleAddAgent, onUpdate: handleUpdateAgent }), _jsx("header", { className: "bg-white dark:bg-gray-800 shadow-sm p-3 z-10", children: _jsxs("div", { className: "flex items-center gap-4 pb-2", children: [_jsx("button", { onClick: function () { setAgentToEdit(null); setIsAgentModalOpen(true); }, className: "px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600", children: "+ Add Agent" }), _jsx("button", { onClick: handleAutomateAll, disabled: isAutomating, className: "px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-purple-400", children: "\uD83D\uDE80 Automate" }), _jsx("input", { type: "text", placeholder: "Set Goal...", value: conversationGoal, onChange: function (e) { return setConversationGoal(e.target.value); }, className: "p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium", children: "Mode:" }), _jsx("button", { onClick: function () { return setMode(mode === 'manual' ? 'auto' : 'manual'); }, className: "px-3 py-1 rounded-full text-sm ".concat(mode === 'auto' ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600'), children: mode === 'auto' ? 'Auto' : 'Manual' })] }), _jsx("div", { className: "flex items-center gap-2", children: agents.map(function (agent) { return (_jsxs("div", { className: "flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-lg px-2 py-1", children: [_jsx("span", { className: "text-sm", children: agent.name }), _jsx("button", { onClick: function () { setAgentToEdit(agent); setIsAgentModalOpen(true); }, className: "text-gray-500 hover:text-blue-500", children: _jsx(EditIcon, {}) }), _jsx("button", { onClick: function () { return handleRemoveAgent(agent.id); }, className: "text-gray-500 hover:text-red-500", children: _jsx(DeleteIcon, {}) })] }, agent.id)); }) })] }) }), _jsxs("main", { className: "p-4 overflow-y-auto flex flex-col space-y-4", children: [messages.map(function (msg) { return _jsx(MessageBubble, { msg: msg }, msg.id); }), _jsx("div", { ref: messagesEndRef })] }), _jsx("footer", { className: "bg-white dark:bg-gray-800 shadow-inner p-2", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "flex-1 relative", children: _jsx("input", { type: "text", value: inputValue, onChange: function (e) { return setInputValue(e.target.value); }, onKeyPress: function (e) { return e.key === 'Enter' && handleSendMessage(); }, placeholder: "Type a message...", className: "w-full p-2 border bg-transparent border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:border-blue-500" }) }), _jsx("button", { onClick: handleSendMessage, disabled: !inputValue.trim(), className: "p-3 bg-blue-500 text-white rounded-full disabled:bg-gray-400 hover:bg-blue-600", children: _jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 12h14M12 5l7 7-7 7" }) }) })] }) })] }));
};
var AppProvider = function (_a) {
    var children = _a.children;
    var _b = useState(null), db = _b[0], setDb = _b[1];
    var _c = useState(null), userId = _c[0], setUserId = _c[1];
    var _d = useState(false), isAuthReady = _d[0], setIsAuthReady = _d[1];
    var _e = useState([]), agents = _e[0], setAgents = _e[1];
    var _f = useState([]), messages = _f[0], setMessages = _f[1];
    var _g = useState(true), isDataLoading = _g[0], setIsDataLoading = _g[1];
    var _h = useState(false), isAutomating = _h[0], setIsAutomating = _h[1];
    var _j = useState(''), inputValue = _j[0], setInputValue = _j[1];
    var _k = useState(false), isAgentModalOpen = _k[0], setIsAgentModalOpen = _k[1];
    var _l = useState(null), agentToEdit = _l[0], setAgentToEdit = _l[1];
    var _m = useState('manual'), mode = _m[0], setMode = _m[1];
    var _o = useState(""), conversationGoal = _o[0], setConversationGoal = _o[1];
    var appId = 'default-app-id';
    var collectionsRef = useRef({});
    // --- Firebase Initialization ---
    useEffect(function () {
        // Fallback mode without Firebase for now
        setIsDataLoading(false);
        setMessages([
            { id: 'welcome-msg', text: "🎉 Welcome to Multi-Agent Chat! This is a demo mode.", sender: 'system' },
            { id: 'demo-msg', text: "Firebase integration is available but currently in fallback mode. You can create agents and chat in demo mode.", sender: 'system' }
        ]);
        return;
        var firestoreDb = getFirestore(app);
        var firebaseAuth = getAuth(app);
        setDb(firestoreDb);
        var unsubscribe = onAuthStateChanged(firebaseAuth, function (user) { return __awaiter(void 0, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!user) return [3 /*break*/, 1];
                        setUserId(user.uid);
                        return [3 /*break*/, 4];
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, signInAnonymously(firebaseAuth)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error("Authentication failed:", error_1);
                        return [3 /*break*/, 4];
                    case 4:
                        setIsAuthReady(true);
                        return [2 /*return*/];
                }
            });
        }); });
        return function () { return unsubscribe(); };
    }, []);
    // --- Data Fetching ---
    useEffect(function () {
        if (!isAuthReady || !db || !userId)
            return;
        collectionsRef.current = {
            agents: collection(db, 'artifacts', appId, 'users', userId, 'agents'),
            messages: collection(db, 'artifacts', appId, 'users', userId, 'messages'),
        };
        var unsubAgents = onSnapshot(query(collectionsRef.current.agents), function (snapshot) {
            setAgents(snapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); }));
            setIsDataLoading(false);
        });
        var unsubMessages = onSnapshot(query(collectionsRef.current.messages), function (snapshot) {
            var fetchedMessages = snapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); });
            fetchedMessages.sort(function (a, b) { var _a, _b; return ((_a = a.timestamp) === null || _a === void 0 ? void 0 : _a.toDate()) - ((_b = b.timestamp) === null || _b === void 0 ? void 0 : _b.toDate()); });
            if (fetchedMessages.length === 0) {
                setMessages([{ id: 'welcome-msg', text: "Welcome! Create an AI agent or use 'Automate' to begin.", sender: 'system' }]);
            }
            else {
                setMessages(fetchedMessages);
            }
        });
        return function () { unsubAgents(); unsubMessages(); };
    }, [isAuthReady, db, userId, appId]);
    var addMessageToDb = useCallback(function (message) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!collectionsRef.current.messages)
                        return [2 /*return*/];
                    return [4 /*yield*/, addDoc(collectionsRef.current.messages, __assign(__assign({}, message), { timestamp: new Date() }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, []);
    var handleAddAgent = useCallback(function (agentData) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!collectionsRef.current.agents) return [3 /*break*/, 2];
                    return [4 /*yield*/, addDoc(collectionsRef.current.agents, agentData)];
                case 1:
                    _a.sent();
                    setIsAgentModalOpen(false);
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); }, []);
    var handleUpdateAgent = useCallback(function (agentData) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(agentToEdit && db && userId)) return [3 /*break*/, 2];
                    return [4 /*yield*/, updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'agents', agentToEdit.id), agentData)];
                case 1:
                    _a.sent();
                    setIsAgentModalOpen(false);
                    setAgentToEdit(null);
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); }, [agentToEdit, db, userId, appId]);
    var handleRemoveAgent = useCallback(function (agentId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!userId || !db)
                        return [2 /*return*/];
                    return [4 /*yield*/, deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'agents', agentId))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [userId, db, appId]);
    var handleSendMessage = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var userMessage, agent_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!inputValue.trim())
                        return [2 /*return*/];
                    userMessage = { text: inputValue, sender: "You" };
                    setInputValue('');
                    return [4 /*yield*/, addMessageToDb(userMessage)];
                case 1:
                    _a.sent();
                    // Simple echo response for demo
                    if (agents.length > 0) {
                        agent_1 = agents[0];
                        setTimeout(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, addMessageToDb({
                                            text: "Hello! I'm ".concat(agent_1.name, ". You said: \"").concat(userMessage.text, "\""),
                                            sender: agent_1.name,
                                            agentId: agent_1.id
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, 1000);
                    }
                    return [2 /*return*/];
            }
        });
    }); }, [inputValue, addMessageToDb, agents]);
    var handleAutomateAll = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var agentsSnapshot, messagesSnapshot, batch_1, agent1Data, agent2Data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsAutomating(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 10, 12, 13]);
                    if (!(collectionsRef.current.agents && collectionsRef.current.messages)) return [3 /*break*/, 5];
                    return [4 /*yield*/, getDocs(collectionsRef.current.agents)];
                case 2:
                    agentsSnapshot = _a.sent();
                    return [4 /*yield*/, getDocs(collectionsRef.current.messages)];
                case 3:
                    messagesSnapshot = _a.sent();
                    batch_1 = writeBatch(db);
                    agentsSnapshot.docs.forEach(function (doc) { return batch_1.delete(doc.ref); });
                    messagesSnapshot.docs.forEach(function (doc) { return batch_1.delete(doc.ref); });
                    return [4 /*yield*/, batch_1.commit()];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [4 /*yield*/, addMessageToDb({ text: '🚀 Creating automated scenario...', sender: 'system' })];
                case 6:
                    _a.sent();
                    agent1Data = {
                        name: "Alice",
                        systemPrompt: "You are Alice, a helpful assistant.",
                        llm: 'gemini',
                        model: 'gemini-1.5-flash-latest'
                    };
                    agent2Data = {
                        name: "Bob",
                        systemPrompt: "You are Bob, a creative thinker.",
                        llm: 'gemini',
                        model: 'gemini-1.5-flash-latest'
                    };
                    return [4 /*yield*/, addDoc(collectionsRef.current.agents, agent1Data)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, addDoc(collectionsRef.current.agents, agent2Data)];
                case 8:
                    _a.sent();
                    setConversationGoal("Discuss interesting topics");
                    setMode('auto');
                    return [4 /*yield*/, addMessageToDb({ text: 'Scenario created! Two agents are ready to chat.', sender: 'system' })];
                case 9:
                    _a.sent();
                    return [3 /*break*/, 13];
                case 10:
                    error_2 = _a.sent();
                    console.error("Automation failed:", error_2);
                    return [4 /*yield*/, addMessageToDb({ text: "Automation failed: ".concat(error_2.message), sender: 'system' })];
                case 11:
                    _a.sent();
                    return [3 /*break*/, 13];
                case 12:
                    setIsAutomating(false);
                    return [7 /*endfinally*/];
                case 13: return [2 /*return*/];
            }
        });
    }); }, [addMessageToDb, db]);
    var contextValue = {
        agents: agents,
        messages: messages,
        isDataLoading: isDataLoading,
        isAutomating: isAutomating,
        inputValue: inputValue,
        setInputValue: setInputValue,
        isAgentModalOpen: isAgentModalOpen,
        setIsAgentModalOpen: setIsAgentModalOpen,
        agentToEdit: agentToEdit,
        setAgentToEdit: setAgentToEdit,
        mode: mode,
        setMode: setMode,
        conversationGoal: conversationGoal,
        setConversationGoal: setConversationGoal,
        handleAddAgent: handleAddAgent,
        handleUpdateAgent: handleUpdateAgent,
        handleRemoveAgent: handleRemoveAgent,
        handleSendMessage: handleSendMessage,
        handleAutomateAll: handleAutomateAll
    };
    return (_jsx(AppContext.Provider, { value: contextValue, children: children }));
};
