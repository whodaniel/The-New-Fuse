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
import { Box, VStack, HStack, Text, Button, Badge, Card, CardHeader, CardBody, Heading, Select, NumberInput, NumberInputField, Textarea, Switch, FormControl, FormLabel, Icon, Divider, useToast, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Code, Pre } from '@chakra-ui/react';
import { FiUsers, FiMessageSquare, FiRefreshCw, FiTool, FiZap, FiPlay } from 'react-icons/fi';
import { useMassExecution } from '../../hooks/useMassExecution';
export var MassBlockExecutor = function (_a) {
    var availableAgents = _a.availableAgents, onExecutionComplete = _a.onExecutionComplete;
    var _b = useState('aggregate'), selectedBlock = _b[0], setSelectedBlock = _b[1];
    var _c = useState([]), selectedAgents = _c[0], setSelectedAgents = _c[1];
    var _d = useState(''), input = _d[0], setInput = _d[1];
    var _e = useState({}), blockConfig = _e[0], setBlockConfig = _e[1];
    var _f = useState(null), executionResult = _f[0], setExecutionResult = _f[1];
    var toast = useToast();
    var _g = useMassExecution(), executeAggregate = _g.executeAggregate, executeReflect = _g.executeReflect, executeDebate = _g.executeDebate, loading = _g.loading, error = _g.error;
    useEffect(function () {
        if (error) {
            toast({
                title: 'Execution Error',
                description: error,
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        }
    }, [error, toast]);
    var blockTypes = [
        {
            type: 'aggregate',
            name: 'Aggregate',
            description: 'Parallel execution with result aggregation',
            icon: FiUsers,
            color: 'blue'
        },
        {
            type: 'reflect',
            name: 'Reflect',
            description: 'Iterative refinement through reflection',
            icon: FiRefreshCw,
            color: 'green'
        },
        {
            type: 'debate',
            name: 'Debate',
            description: 'Multi-agent debate for robust decisions',
            icon: FiMessageSquare,
            color: 'purple'
        },
        {
            type: 'custom',
            name: 'Custom',
            description: 'Task-specific custom agents',
            icon: FiZap,
            color: 'orange'
        },
        {
            type: 'tool_use',
            name: 'Tool Use',
            description: 'External tool integration',
            icon: FiTool,
            color: 'teal'
        }
    ];
    var handleExecute = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, _a, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!input.trim() || selectedAgents.length === 0) {
                        toast({
                            title: 'Invalid Input',
                            description: 'Please provide input and select at least one agent',
                            status: 'warning',
                            duration: 3000
                        });
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 10, , 11]);
                    result = void 0;
                    _a = selectedBlock;
                    switch (_a) {
                        case 'aggregate': return [3 /*break*/, 2];
                        case 'reflect': return [3 /*break*/, 4];
                        case 'debate': return [3 /*break*/, 6];
                    }
                    return [3 /*break*/, 8];
                case 2: return [4 /*yield*/, executeAggregate(selectedAgents, input, {
                        aggregationStrategy: blockConfig.aggregationStrategy || 'majority_vote',
                        parallelExecution: blockConfig.parallelExecution !== false
                    })];
                case 3:
                    result = _b.sent();
                    return [3 /*break*/, 9];
                case 4:
                    if (selectedAgents.length < 2) {
                        toast({
                            title: 'Insufficient Agents',
                            description: 'Reflect block requires at least 2 agents (predictor and reflector)',
                            status: 'warning',
                            duration: 3000
                        });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, executeReflect(selectedAgents[0], selectedAgents[1], input, {
                            maxRounds: blockConfig.maxRounds || 3
                        })];
                case 5:
                    result = _b.sent();
                    return [3 /*break*/, 9];
                case 6:
                    if (selectedAgents.length < 2) {
                        toast({
                            title: 'Insufficient Agents',
                            description: 'Debate block requires at least 2 agents',
                            status: 'warning',
                            duration: 3000
                        });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, executeDebate(selectedAgents, input, {
                            debateRounds: blockConfig.debateRounds || 3,
                            votingStrategy: blockConfig.votingStrategy || 'majority'
                        })];
                case 7:
                    result = _b.sent();
                    return [3 /*break*/, 9];
                case 8:
                    toast({
                        title: 'Not Implemented',
                        description: "".concat(selectedBlock, " block execution not yet implemented"),
                        status: 'info',
                        duration: 3000
                    });
                    return [2 /*return*/];
                case 9:
                    setExecutionResult(result);
                    onExecutionComplete === null || onExecutionComplete === void 0 ? void 0 : onExecutionComplete(result);
                    toast({
                        title: 'Execution Complete',
                        description: "".concat(selectedBlock, " block executed successfully"),
                        status: 'success',
                        duration: 3000
                    });
                    return [3 /*break*/, 11];
                case 10:
                    err_1 = _b.sent();
                    console.error('Execution failed:', err_1);
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    }); };
    var renderBlockConfiguration = function () {
        switch (selectedBlock) {
            case 'aggregate':
                return (_jsxs(VStack, { spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Aggregation Strategy" }), _jsxs(Select, { value: blockConfig.aggregationStrategy || 'majority_vote', onChange: function (e) { return setBlockConfig(__assign(__assign({}, blockConfig), { aggregationStrategy: e.target.value })); }, children: [_jsx("option", { value: "majority_vote", children: "Majority Vote" }), _jsx("option", { value: "weighted_average", children: "Weighted Average" }), _jsx("option", { value: "consensus", children: "Consensus" })] })] }), _jsxs(FormControl, { display: "flex", alignItems: "center", children: [_jsx(FormLabel, { fontSize: "sm", mb: 0, children: "Parallel Execution" }), _jsx(Switch, { isChecked: blockConfig.parallelExecution !== false, onChange: function (e) { return setBlockConfig(__assign(__assign({}, blockConfig), { parallelExecution: e.target.checked })); } })] })] }));
            case 'reflect':
                return (_jsxs(VStack, { spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Max Rounds" }), _jsx(NumberInput, { value: blockConfig.maxRounds || 3, onChange: function (_, num) { return setBlockConfig(__assign(__assign({}, blockConfig), { maxRounds: num || 3 })); }, min: 1, max: 10, children: _jsx(NumberInputField, {}) })] }), _jsx(Box, { w: "full", p: 3, bg: "blue.50", borderRadius: "md", children: _jsx(Text, { fontSize: "sm", color: "blue.800", children: "\uD83D\uDCA1 First selected agent will be the predictor, second will be the reflector" }) })] }));
            case 'debate':
                return (_jsxs(VStack, { spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Debate Rounds" }), _jsx(NumberInput, { value: blockConfig.debateRounds || 3, onChange: function (_, num) { return setBlockConfig(__assign(__assign({}, blockConfig), { debateRounds: num || 3 })); }, min: 1, max: 10, children: _jsx(NumberInputField, {}) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Voting Strategy" }), _jsxs(Select, { value: blockConfig.votingStrategy || 'majority', onChange: function (e) { return setBlockConfig(__assign(__assign({}, blockConfig), { votingStrategy: e.target.value })); }, children: [_jsx("option", { value: "majority", children: "Majority" }), _jsx("option", { value: "weighted", children: "Weighted" }), _jsx("option", { value: "consensus", children: "Consensus" })] })] })] }));
            default:
                return (_jsx(Box, { p: 3, bg: "gray.50", borderRadius: "md", children: _jsxs(Text, { fontSize: "sm", color: "gray.600", children: ["Configuration for ", selectedBlock, " block coming soon..."] }) }));
        }
    };
    var selectedBlockInfo = blockTypes.find(function (bt) { return bt.type === selectedBlock; });
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(HStack, { children: [_jsx(Icon, { as: FiZap, color: "purple.500" }), _jsx(Heading, { size: "md", children: "MASS Block Executor" }), _jsx(Badge, { colorScheme: "purple", variant: "subtle", children: "Interactive Testing" })] }) }), _jsx(CardBody, { children: _jsxs(VStack, { spacing: 6, children: [_jsxs(Box, { w: "full", children: [_jsx(Text, { mb: 3, fontSize: "sm", fontWeight: "medium", children: "Select MASS Building Block" }), _jsx(VStack, { spacing: 2, children: blockTypes.map(function (blockType) { return (_jsx(Box, { w: "full", p: 3, borderWidth: 2, borderRadius: "md", borderColor: selectedBlock === blockType.type ? "".concat(blockType.color, ".500") : 'gray.200', bg: selectedBlock === blockType.type ? "".concat(blockType.color, ".50") : 'white', cursor: "pointer", onClick: function () {
                                            setSelectedBlock(blockType.type);
                                            setBlockConfig({});
                                            setExecutionResult(null);
                                        }, transition: "all 0.2s", _hover: { borderColor: "".concat(blockType.color, ".300") }, children: _jsxs(HStack, { justify: "space-between", children: [_jsxs(HStack, { children: [_jsx(Icon, { as: blockType.icon, color: "".concat(blockType.color, ".500") }), _jsxs(VStack, { align: "start", spacing: 0, children: [_jsx(Text, { fontWeight: "medium", children: blockType.name }), _jsx(Text, { fontSize: "sm", color: "gray.600", children: blockType.description })] })] }), selectedBlock === blockType.type && (_jsx(Badge, { colorScheme: blockType.color, children: "Selected" }))] }) }, blockType.type)); }) })] }), _jsx(Divider, {}), _jsxs(Box, { w: "full", children: [_jsxs(Text, { mb: 3, fontSize: "sm", fontWeight: "medium", children: ["Select Agents (", selectedAgents.length, " selected)"] }), _jsx(VStack, { spacing: 2, maxH: "200px", overflowY: "auto", children: availableAgents.map(function (agent) { return (_jsx(Box, { w: "full", p: 3, borderWidth: 1, borderRadius: "md", borderColor: selectedAgents.includes(agent.id) ? 'blue.500' : 'gray.200', bg: selectedAgents.includes(agent.id) ? 'blue.50' : 'white', cursor: "pointer", onClick: function () {
                                            if (selectedAgents.includes(agent.id)) {
                                                setSelectedAgents(selectedAgents.filter(function (id) { return id !== agent.id; }));
                                            }
                                            else {
                                                setSelectedAgents(__spreadArray(__spreadArray([], selectedAgents, true), [agent.id], false));
                                            }
                                        }, children: _jsxs(HStack, { justify: "space-between", children: [_jsxs(VStack, { align: "start", spacing: 0, children: [_jsx(Text, { fontWeight: "medium", children: agent.name }), _jsx(Text, { fontSize: "sm", color: "gray.600", children: agent.type })] }), selectedAgents.includes(agent.id) && (_jsx(Badge, { colorScheme: "blue", children: "Selected" }))] }) }, agent.id)); }) })] }), _jsx(Divider, {}), selectedBlockInfo && (_jsxs(Box, { w: "full", children: [_jsxs(HStack, { mb: 3, children: [_jsx(Icon, { as: selectedBlockInfo.icon, color: "".concat(selectedBlockInfo.color, ".500") }), _jsxs(Text, { fontSize: "sm", fontWeight: "medium", children: [selectedBlockInfo.name, " Configuration"] })] }), renderBlockConfiguration()] })), _jsx(Divider, {}), _jsxs(Box, { w: "full", children: [_jsx(Text, { mb: 3, fontSize: "sm", fontWeight: "medium", children: "Input for Processing" }), _jsx(Textarea, { placeholder: "Enter the input that will be processed by the selected agents...", value: input, onChange: function (e) { return setInput(e.target.value); }, rows: 4 })] }), _jsxs(Button, { leftIcon: _jsx(FiPlay, {}), colorScheme: (selectedBlockInfo === null || selectedBlockInfo === void 0 ? void 0 : selectedBlockInfo.color) || 'blue', size: "lg", w: "full", onClick: handleExecute, isLoading: loading, loadingText: "Executing...", isDisabled: !input.trim() || selectedAgents.length === 0, children: ["Execute ", selectedBlockInfo === null || selectedBlockInfo === void 0 ? void 0 : selectedBlockInfo.name, " Block"] }), executionResult && (_jsxs(Box, { w: "full", children: [_jsx(Divider, { mb: 4 }), _jsx(Heading, { size: "sm", mb: 3, children: "Execution Results" }), _jsxs(Accordion, { allowToggle: true, children: [_jsxs(AccordionItem, { children: [_jsxs(AccordionButton, { children: [_jsx(Box, { flex: "1", textAlign: "left", children: _jsxs(HStack, { children: [_jsx(Icon, { as: FiZap, color: "green.500" }), _jsx(Text, { fontWeight: "medium", children: "Final Result" }), _jsx(Badge, { colorScheme: "green", children: "Success" })] }) }), _jsx(AccordionIcon, {})] }), _jsx(AccordionPanel, { pb: 4, children: _jsx(Box, { p: 3, bg: "gray.50", borderRadius: "md", children: _jsx(Pre, { fontSize: "sm", whiteSpace: "pre-wrap", children: typeof executionResult.result === 'string'
                                                                ? executionResult.result
                                                                : JSON.stringify(executionResult.result, null, 2) }) }) })] }), executionResult.reflectionHistory && (_jsxs(AccordionItem, { children: [_jsxs(AccordionButton, { children: [_jsx(Box, { flex: "1", textAlign: "left", children: _jsxs(HStack, { children: [_jsx(Icon, { as: FiRefreshCw, color: "blue.500" }), _jsx(Text, { fontWeight: "medium", children: "Reflection History" }), _jsxs(Badge, { colorScheme: "blue", children: [executionResult.reflectionHistory.length, " rounds"] })] }) }), _jsx(AccordionIcon, {})] }), _jsx(AccordionPanel, { pb: 4, children: _jsx(VStack, { spacing: 3, align: "stretch", children: executionResult.reflectionHistory.map(function (round, index) { return (_jsxs(Box, { p: 3, bg: "blue.50", borderRadius: "md", children: [_jsxs(Text, { fontSize: "sm", fontWeight: "medium", mb: 2, children: ["Round ", index + 1] }), _jsx(Code, { fontSize: "sm", p: 2, display: "block", whiteSpace: "pre-wrap", children: JSON.stringify(round, null, 2) })] }, index)); }) }) })] })), executionResult.debateHistory && (_jsxs(AccordionItem, { children: [_jsxs(AccordionButton, { children: [_jsx(Box, { flex: "1", textAlign: "left", children: _jsxs(HStack, { children: [_jsx(Icon, { as: FiMessageSquare, color: "purple.500" }), _jsx(Text, { fontWeight: "medium", children: "Debate History" }), _jsxs(Badge, { colorScheme: "purple", children: [executionResult.debateHistory.length, " rounds"] })] }) }), _jsx(AccordionIcon, {})] }), _jsx(AccordionPanel, { pb: 4, children: _jsx(VStack, { spacing: 3, align: "stretch", children: executionResult.debateHistory.map(function (round, index) { return (_jsxs(Box, { p: 3, bg: "purple.50", borderRadius: "md", children: [_jsxs(Text, { fontSize: "sm", fontWeight: "medium", mb: 2, children: ["Debate Round ", index + 1] }), _jsx(Code, { fontSize: "sm", p: 2, display: "block", whiteSpace: "pre-wrap", children: JSON.stringify(round, null, 2) })] }, index)); }) }) })] })), _jsxs(AccordionItem, { children: [_jsxs(AccordionButton, { children: [_jsx(Box, { flex: "1", textAlign: "left", children: _jsxs(HStack, { children: [_jsx(Icon, { as: FiTool, color: "orange.500" }), _jsx(Text, { fontWeight: "medium", children: "Execution Metrics" })] }) }), _jsx(AccordionIcon, {})] }), _jsx(AccordionPanel, { pb: 4, children: _jsx(Box, { p: 3, bg: "orange.50", borderRadius: "md", children: _jsx(VStack, { align: "stretch", spacing: 2, children: executionResult.executionMetrics && Object.entries(executionResult.executionMetrics).map(function (_a) {
                                                                var key = _a[0], value = _a[1];
                                                                return (_jsxs(HStack, { justify: "space-between", children: [_jsxs(Text, { fontSize: "sm", fontWeight: "medium", children: [key, ":"] }), _jsx(Code, { fontSize: "sm", children: String(value) })] }, key));
                                                            }) }) }) })] })] })] }))] }) })] }));
};
