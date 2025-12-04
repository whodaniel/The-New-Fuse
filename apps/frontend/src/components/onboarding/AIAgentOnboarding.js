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
import { useState, useEffect } from 'react';
import { Box, Heading, Text, Button, VStack, HStack, Code, Alert, AlertIcon, Progress, Badge } from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
export var AIAgentOnboarding = function (_a) {
    var agentId = _a.agentId, onComplete = _a.onComplete;
    var _b = useState('detection'), step = _b[0], setStep = _b[1];
    var _c = useState(false), loading = _c[0], setLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var _e = useState({
        id: agentId || "agent-".concat(Date.now()),
        capabilities: [],
        communicationChannels: [],
        registrationComplete: false
    }), agentData = _e[0], setAgentData = _e[1];
    var _f = useState([
        { name: 'file-management', status: 'pending' },
        { name: 'process-management', status: 'pending' },
        { name: 'web-interaction', status: 'pending' },
        { name: 'code-analysis', status: 'pending' },
        { name: 'api-integration', status: 'pending' }
    ]), capabilityTests = _f[0], setCapabilityTests = _f[1];
    useEffect(function () {
        // Simulate automatic detection
        var timer = setTimeout(function () {
            setStep('registration');
        }, 2000);
        return function () { return clearTimeout(timer); };
    }, []);
    var handleRegistration = function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    // Simulate API call
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1500); })];
                case 2:
                    // Simulate API call
                    _a.sent();
                    setAgentData(function (prev) { return (__assign(__assign({}, prev), { registrationComplete: true })); });
                    setStep('capabilities');
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    setError('Failed to register agent. Please try again.');
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var runCapabilityTests = function () { return __awaiter(void 0, void 0, void 0, function () {
        var _loop_1, i, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    _loop_1 = function (i) {
                        var success;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    // Update status to running
                                    setCapabilityTests(function (prev) {
                                        var updated = __spreadArray([], prev, true);
                                        updated[i] = __assign(__assign({}, updated[i]), { status: 'running' });
                                        return updated;
                                    });
                                    // Simulate test execution
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                                case 1:
                                    // Simulate test execution
                                    _b.sent();
                                    success = Math.random() > 0.3;
                                    setCapabilityTests(function (prev) {
                                        var updated = __spreadArray([], prev, true);
                                        updated[i] = __assign(__assign({}, updated[i]), { status: success ? 'success' : 'failed', result: success ? { score: Math.floor(Math.random() * 100) } : { error: 'Test failed' } });
                                        return updated;
                                    });
                                    // If successful, add to agent capabilities
                                    if (success) {
                                        setAgentData(function (prev) { return (__assign(__assign({}, prev), { capabilities: __spreadArray(__spreadArray([], prev.capabilities, true), [capabilityTests[i].name], false) })); });
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < capabilityTests.length)) return [3 /*break*/, 5];
                    return [5 /*yield**/, _loop_1(i)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5:
                    setStep('communication');
                    return [3 /*break*/, 8];
                case 6:
                    err_2 = _a.sent();
                    setError('Failed to run capability tests. Please try again.');
                    return [3 /*break*/, 8];
                case 7:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var setupCommunication = function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    // Simulate API call
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1500); })];
                case 2:
                    // Simulate API call
                    _a.sent();
                    setAgentData(function (prev) { return (__assign(__assign({}, prev), { communicationChannels: ['http', 'websocket', 'event-stream'], communicationSetupComplete: true })); });
                    setStep('complete');
                    return [3 /*break*/, 5];
                case 3:
                    err_3 = _a.sent();
                    setError('Failed to setup communication channels. Please try again.');
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var finalizeOnboarding = function () {
        onComplete(agentData);
    };
    return (_jsxs(Box, { maxW: "800px", mx: "auto", p: 6, children: [_jsx(Heading, { mb: 6, children: "AI Agent Onboarding" }), _jsx(Progress, { value: (step === 'detection' ? 20 :
                    step === 'registration' ? 40 :
                        step === 'capabilities' ? 60 :
                            step === 'communication' ? 80 :
                                100), mb: 8 }), error && (_jsxs(Alert, { status: "error", mb: 4, children: [_jsx(AlertIcon, {}), error] })), step === 'detection' && (_jsxs(Box, { children: [_jsx(Heading, { size: "md", mb: 4, children: "Detecting Agent Type" }), _jsx(Text, { mb: 4, children: "Analyzing connection patterns and headers..." }), _jsx(Progress, { size: "sm", isIndeterminate: true })] })), step === 'registration' && (_jsxs(Box, { children: [_jsx(Heading, { size: "md", mb: 4, children: "Agent Registration" }), _jsx(Text, { mb: 4, children: "Register your AI agent with The New Fuse platform." }), _jsxs(VStack, { align: "start", spacing: 4, mb: 6, children: [_jsxs(Box, { children: [_jsx(Text, { fontWeight: "bold", children: "Agent ID" }), _jsx(Code, { p: 2, children: agentData.id })] }), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "bold", children: "Registration Endpoint" }), _jsx(Code, { p: 2, children: "/api/onboarding/ai-agent-registration" })] }), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "bold", children: "Required Headers" }), _jsx(Code, { p: 2, display: "block", whiteSpace: "pre", children: "Content-Type: application/json\nX-Agent-ID: ".concat(agentData.id, "\nX-Agent-Type: ai_agent") })] })] }), _jsx(Button, { colorScheme: "blue", onClick: handleRegistration, isLoading: loading, children: "Complete Registration" })] })), step === 'capabilities' && (_jsxs(Box, { children: [_jsx(Heading, { size: "md", mb: 4, children: "Capability Assessment" }), _jsx(Text, { mb: 4, children: "Let's test your agent's capabilities to determine what tools it can use." }), _jsx(VStack, { align: "start", spacing: 4, mb: 6, children: capabilityTests.map(function (test, index) { return (_jsxs(HStack, { w: "100%", justify: "space-between", children: [_jsx(Text, { children: test.name }), _jsxs(HStack, { children: [test.status === 'pending' && _jsx(Badge, { children: "Pending" }), test.status === 'running' && _jsx(Badge, { colorScheme: "blue", children: "Running" }), test.status === 'success' && (_jsxs(HStack, { children: [_jsx(Badge, { colorScheme: "green", children: "Success" }), _jsx(CheckCircleIcon, { color: "green.500" })] })), test.status === 'failed' && (_jsxs(HStack, { children: [_jsx(Badge, { colorScheme: "red", children: "Failed" }), _jsx(WarningIcon, { color: "red.500" })] }))] })] }, index)); }) }), _jsx(Button, { colorScheme: "blue", onClick: runCapabilityTests, isLoading: loading, isDisabled: capabilityTests.some(function (test) { return test.status === 'running'; }), children: "Run Capability Tests" })] })), step === 'communication' && (_jsxs(Box, { children: [_jsx(Heading, { size: "md", mb: 4, children: "Communication Setup" }), _jsx(Text, { mb: 4, children: "Set up communication channels between your agent and The New Fuse platform." }), _jsxs(VStack, { align: "start", spacing: 4, mb: 6, children: [_jsxs(Box, { children: [_jsx(Text, { fontWeight: "bold", children: "Available Channels" }), _jsxs(HStack, { mt: 2, children: [_jsx(Badge, { colorScheme: "green", children: "HTTP" }), _jsx(Badge, { colorScheme: "blue", children: "WebSocket" }), _jsx(Badge, { colorScheme: "purple", children: "Event Stream" })] })] }), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "bold", children: "Communication Endpoints" }), _jsx(Code, { p: 2, display: "block", whiteSpace: "pre", children: "HTTP: /api/agents/".concat(agentData.id, "/messages\nWebSocket: ws://your-domain.com/api/agents/").concat(agentData.id, "/ws\nEvent Stream: /api/agents/").concat(agentData.id, "/events") })] }), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "bold", children: "Authentication" }), _jsx(Text, { children: "Use the agent token provided during registration for all communications." })] })] }), _jsx(Button, { colorScheme: "blue", onClick: setupCommunication, isLoading: loading, children: "Setup Communication Channels" })] })), step === 'complete' && (_jsxs(Box, { children: [_jsx(Heading, { size: "md", mb: 4, children: "Onboarding Complete" }), _jsx(Text, { mb: 4, children: "Your AI agent has been successfully onboarded to The New Fuse platform." }), _jsxs(VStack, { align: "start", spacing: 4, mb: 6, children: [_jsxs(Box, { children: [_jsx(Text, { fontWeight: "bold", children: "Agent ID" }), _jsx(Code, { p: 2, children: agentData.id })] }), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "bold", children: "Capabilities" }), _jsx(HStack, { mt: 2, flexWrap: "wrap", children: agentData.capabilities.map(function (cap, idx) { return (_jsx(Badge, { colorScheme: "green", m: 1, children: cap }, idx)); }) })] }), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "bold", children: "Communication Channels" }), _jsx(HStack, { mt: 2, children: agentData.communicationChannels.map(function (channel, idx) { return (_jsx(Badge, { colorScheme: "blue", children: channel }, idx)); }) })] })] }), _jsx(Button, { colorScheme: "green", onClick: finalizeOnboarding, children: "Start Using The New Fuse" })] }))] }));
};
