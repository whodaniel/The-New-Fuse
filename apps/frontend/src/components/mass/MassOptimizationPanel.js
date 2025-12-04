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
import { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, Button, Progress, Badge, Card, CardHeader, CardBody, Heading, useToast, Spinner, Flex, Icon, Tooltip, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, Select, NumberInput, NumberInputField } from '@chakra-ui/react';
import { FiPlay, FiRefreshCw, FiTrendingUp, FiZap, FiSettings } from 'react-icons/fi';
import { useMassOptimization } from '../../hooks/useMassOptimization';
export var MassOptimizationPanel = function (_a) {
    var _b;
    var agentId = _a.agentId, agentIds = _a.agentIds, topologyId = _a.topologyId, onOptimizationComplete = _a.onOptimizationComplete;
    var _c = useState('idle'), optimizationStage = _c[0], setOptimizationStage = _c[1];
    var _d = useState([]), currentJobs = _d[0], setCurrentJobs = _d[1];
    var _e = useState({
        userId: '',
        validationDatasetId: '',
        maxCandidates: 10,
        optimizationRounds: 3,
        evaluationSampleSize: 20,
        llmConfig: {
            model: 'gpt-4',
            temperature: 0.7
        }
    }), config = _e[0], setConfig = _e[1];
    var toast = useToast();
    var _f = useDisclosure(), isConfigOpen = _f.isOpen, onConfigOpen = _f.onOpen, onConfigClose = _f.onClose;
    var _g = useMassOptimization(), optimizeAgent = _g.optimizeAgent, optimizeTopology = _g.optimizeTopology, optimizeWorkflow = _g.optimizeWorkflow, runFullOptimization = _g.runFullOptimization, getOptimizationJob = _g.getOptimizationJob, getUserOptimizationJobs = _g.getUserOptimizationJobs, loading = _g.loading, error = _g.error;
    useEffect(function () {
        if (error) {
            toast({
                title: 'Optimization Error',
                description: error,
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        }
    }, [error, toast]);
    var handleOptimizeAgent = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!agentId)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    setOptimizationStage('stage1');
                    return [4 /*yield*/, optimizeAgent(agentId, config)];
                case 2:
                    result = _a.sent();
                    setCurrentJobs([result.job]);
                    // Poll for completion
                    pollJobCompletion([result.job.id]);
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    setOptimizationStage('idle');
                    toast({
                        title: 'Failed to start optimization',
                        description: 'Please try again',
                        status: 'error',
                        duration: 3000
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleOptimizeTopology = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!agentIds || agentIds.length === 0)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    setOptimizationStage('stage2');
                    return [4 /*yield*/, optimizeTopology(agentIds, config)];
                case 2:
                    result = _a.sent();
                    setCurrentJobs([result.job]);
                    pollJobCompletion([result.job.id]);
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    setOptimizationStage('idle');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleOptimizeWorkflow = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!topologyId)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    setOptimizationStage('stage3');
                    return [4 /*yield*/, optimizeWorkflow(topologyId, config)];
                case 2:
                    result = _a.sent();
                    setCurrentJobs([result.job]);
                    pollJobCompletion([result.job.id]);
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _a.sent();
                    setOptimizationStage('idle');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleFullOptimization = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, jobs, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!agentIds || agentIds.length === 0)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    setOptimizationStage('stage1');
                    return [4 /*yield*/, runFullOptimization(agentIds, config)];
                case 2:
                    result = _a.sent();
                    return [4 /*yield*/, Promise.all(result.jobIds.map(function (id) { return getOptimizationJob(id); }))];
                case 3:
                    jobs = _a.sent();
                    setCurrentJobs(jobs);
                    pollJobCompletion(result.jobIds);
                    return [3 /*break*/, 5];
                case 4:
                    err_4 = _a.sent();
                    setOptimizationStage('idle');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var pollJobCompletion = function (jobIds) { return __awaiter(void 0, void 0, void 0, function () {
        var pollInterval;
        return __generator(this, function (_a) {
            pollInterval = setInterval(function () { return __awaiter(void 0, void 0, void 0, function () {
                var jobs, allCompleted, failedJobs, runningJobs, jobType, err_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, Promise.all(jobIds.map(function (id) { return getOptimizationJob(id); }))];
                        case 1:
                            jobs = _a.sent();
                            setCurrentJobs(jobs);
                            allCompleted = jobs.every(function (job) {
                                return job.status === 'completed' || job.status === 'failed';
                            });
                            if (allCompleted) {
                                clearInterval(pollInterval);
                                setOptimizationStage('complete');
                                failedJobs = jobs.filter(function (job) { return job.status === 'failed'; });
                                if (failedJobs.length > 0) {
                                    toast({
                                        title: 'Some optimizations failed',
                                        description: "".concat(failedJobs.length, " out of ").concat(jobs.length, " jobs failed"),
                                        status: 'warning',
                                        duration: 5000
                                    });
                                }
                                else {
                                    toast({
                                        title: 'Optimization Complete!',
                                        description: 'All MASS optimization stages completed successfully',
                                        status: 'success',
                                        duration: 5000
                                    });
                                    onOptimizationComplete === null || onOptimizationComplete === void 0 ? void 0 : onOptimizationComplete(jobs);
                                }
                            }
                            else {
                                runningJobs = jobs.filter(function (job) { return job.status === 'running'; });
                                if (runningJobs.length > 0) {
                                    jobType = runningJobs[0].type;
                                    if (jobType === 'block_level')
                                        setOptimizationStage('stage1');
                                    else if (jobType === 'topology')
                                        setOptimizationStage('stage2');
                                    else if (jobType === 'workflow_level')
                                        setOptimizationStage('stage3');
                                }
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            err_5 = _a.sent();
                            clearInterval(pollInterval);
                            setOptimizationStage('idle');
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); }, 2000);
            // Cleanup after 30 minutes
            setTimeout(function () { return clearInterval(pollInterval); }, 30 * 60 * 1000);
            return [2 /*return*/];
        });
    }); };
    var getStageProgress = function () {
        switch (optimizationStage) {
            case 'stage1': return 33;
            case 'stage2': return 66;
            case 'stage3': return 90;
            case 'complete': return 100;
            default: return 0;
        }
    };
    var getStageDescription = function () {
        switch (optimizationStage) {
            case 'stage1': return 'Optimizing individual agent prompts...';
            case 'stage2': return 'Finding optimal workflow topology...';
            case 'stage3': return 'Fine-tuning workflow-level prompts...';
            case 'complete': return 'Optimization complete!';
            default: return 'Ready to optimize';
        }
    };
    var isOptimizing = optimizationStage !== 'idle' && optimizationStage !== 'complete';
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(HStack, { justify: "space-between", children: [_jsxs(HStack, { children: [_jsx(Icon, { as: FiZap, color: "orange.500" }), _jsx(Heading, { size: "md", children: "MASS Optimization" }), _jsx(Badge, { colorScheme: "orange", variant: "subtle", children: "AI-Powered" })] }), _jsx(Button, { size: "sm", variant: "ghost", leftIcon: _jsx(FiSettings, {}), onClick: onConfigOpen, isDisabled: isOptimizing, children: "Configure" })] }) }), _jsx(CardBody, { children: _jsxs(VStack, { spacing: 6, children: [_jsxs(Box, { w: "full", children: [_jsxs(HStack, { justify: "space-between", mb: 2, children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: getStageDescription() }), _jsxs(Text, { fontSize: "sm", fontWeight: "medium", children: [getStageProgress(), "%"] })] }), _jsx(Progress, { value: getStageProgress(), colorScheme: optimizationStage === 'complete' ? 'green' : 'orange', size: "lg", borderRadius: "md" })] }), _jsx(HStack, { spacing: 4, w: "full", justify: "center", children: [
                                { stage: 'stage1', label: 'Stage 1: Prompts', icon: FiRefreshCw },
                                { stage: 'stage2', label: 'Stage 2: Topology', icon: FiTrendingUp },
                                { stage: 'stage3', label: 'Stage 3: Workflow', icon: FiZap }
                            ].map(function (_a) {
                                var stage = _a.stage, label = _a.label, icon = _a.icon;
                                return (_jsx(Tooltip, { label: label, children: _jsxs(VStack, { spacing: 1, children: [_jsx(Box, { p: 2, borderRadius: "full", bg: optimizationStage === stage ? 'orange.500' :
                                                    getStageProgress() > (['stage1', 'stage2', 'stage3'].indexOf(stage) + 1) * 33 - 33 ? 'green.500' : 'gray.200', color: optimizationStage === stage ||
                                                    getStageProgress() > (['stage1', 'stage2', 'stage3'].indexOf(stage) + 1) * 33 - 33 ? 'white' : 'gray.500', children: optimizationStage === stage ? (_jsx(Spinner, { size: "sm" })) : (_jsx(Icon, { as: icon })) }), _jsx(Text, { fontSize: "xs", textAlign: "center", children: label.split(':')[0] })] }) }, stage));
                            }) }), _jsxs(VStack, { spacing: 3, w: "full", children: [agentId && (_jsx(Button, { leftIcon: _jsx(FiPlay, {}), colorScheme: "orange", size: "lg", w: "full", onClick: handleOptimizeAgent, isLoading: isOptimizing, loadingText: "Optimizing...", isDisabled: !config.validationDatasetId, children: "Optimize Agent Prompts (Stage 1)" })), agentIds && agentIds.length > 0 && (_jsx(Button, { leftIcon: _jsx(FiTrendingUp, {}), colorScheme: "blue", size: "lg", w: "full", onClick: handleOptimizeTopology, isLoading: isOptimizing, loadingText: "Optimizing...", isDisabled: !config.validationDatasetId, children: "Optimize Topology (Stage 2)" })), topologyId && (_jsx(Button, { leftIcon: _jsx(FiZap, {}), colorScheme: "purple", size: "lg", w: "full", onClick: handleOptimizeWorkflow, isLoading: isOptimizing, loadingText: "Optimizing...", isDisabled: !config.validationDatasetId, children: "Optimize Workflow (Stage 3)" })), agentIds && agentIds.length > 1 && (_jsx(Button, { leftIcon: _jsx(FiZap, {}), colorScheme: "green", size: "lg", w: "full", onClick: handleFullOptimization, isLoading: isOptimizing, loadingText: "Running Full Optimization...", isDisabled: !config.validationDatasetId, children: "Run Full MASS Pipeline" }))] }), currentJobs.length > 0 && (_jsxs(Box, { w: "full", children: [_jsx(Text, { fontSize: "sm", fontWeight: "medium", mb: 2, children: "Current Jobs" }), _jsx(VStack, { spacing: 2, children: currentJobs.map(function (job) { return (_jsx(Box, { w: "full", p: 3, bg: "gray.50", borderRadius: "md", children: _jsxs(HStack, { justify: "space-between", children: [_jsxs(VStack, { align: "start", spacing: 1, children: [_jsx(Text, { fontSize: "sm", fontWeight: "medium", children: job.type.replace('_', ' ').toUpperCase() }), _jsxs(Text, { fontSize: "xs", color: "gray.600", children: ["ID: ", job.id.slice(0, 8), "..."] })] }), _jsx(Badge, { colorScheme: job.status === 'completed' ? 'green' :
                                                        job.status === 'failed' ? 'red' :
                                                            job.status === 'running' ? 'orange' : 'gray', children: job.status })] }) }, job.id)); }) })] })), !config.validationDatasetId && (_jsx(Box, { w: "full", p: 3, bg: "yellow.50", borderColor: "yellow.200", borderWidth: 1, borderRadius: "md", children: _jsx(Text, { fontSize: "sm", color: "yellow.800", children: "\u26A0\uFE0F Please configure a validation dataset to enable MASS optimization" }) }))] }) }), _jsxs(Modal, { isOpen: isConfigOpen, onClose: onConfigClose, size: "lg", children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { children: [_jsx(ModalHeader, { children: "MASS Optimization Configuration" }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { pb: 6, children: _jsxs(VStack, { spacing: 4, children: [_jsxs(Box, { w: "full", children: [_jsx(Text, { mb: 2, fontSize: "sm", fontWeight: "medium", children: "Validation Dataset" }), _jsxs(Select, { placeholder: "Select validation dataset...", value: config.validationDatasetId, onChange: function (e) { return setConfig(__assign(__assign({}, config), { validationDatasetId: e.target.value })); }, children: [_jsx("option", { value: "dataset-1", children: "Sample Math Problems" }), _jsx("option", { value: "dataset-2", children: "Q&A Test Set" }), _jsx("option", { value: "dataset-3", children: "Custom Dataset" })] })] }), _jsxs(HStack, { w: "full", spacing: 4, children: [_jsxs(Box, { flex: 1, children: [_jsx(Text, { mb: 2, fontSize: "sm", fontWeight: "medium", children: "Max Candidates" }), _jsx(NumberInput, { value: config.maxCandidates, onChange: function (_, num) { return setConfig(__assign(__assign({}, config), { maxCandidates: num || 10 })); }, min: 5, max: 50, children: _jsx(NumberInputField, {}) })] }), _jsxs(Box, { flex: 1, children: [_jsx(Text, { mb: 2, fontSize: "sm", fontWeight: "medium", children: "Optimization Rounds" }), _jsx(NumberInput, { value: config.optimizationRounds, onChange: function (_, num) { return setConfig(__assign(__assign({}, config), { optimizationRounds: num || 3 })); }, min: 1, max: 10, children: _jsx(NumberInputField, {}) })] })] }), _jsxs(HStack, { w: "full", spacing: 4, children: [_jsxs(Box, { flex: 1, children: [_jsx(Text, { mb: 2, fontSize: "sm", fontWeight: "medium", children: "LLM Model" }), _jsxs(Select, { value: ((_b = config.llmConfig) === null || _b === void 0 ? void 0 : _b.model) || 'gpt-4', onChange: function (e) { return setConfig(__assign(__assign({}, config), { llmConfig: __assign(__assign({}, config.llmConfig), { model: e.target.value }) })); }, children: [_jsx("option", { value: "gpt-4", children: "GPT-4" }), _jsx("option", { value: "gpt-3.5-turbo", children: "GPT-3.5 Turbo" }), _jsx("option", { value: "claude-3", children: "Claude 3" })] })] }), _jsxs(Box, { flex: 1, children: [_jsx(Text, { mb: 2, fontSize: "sm", fontWeight: "medium", children: "Sample Size" }), _jsx(NumberInput, { value: config.evaluationSampleSize, onChange: function (_, num) { return setConfig(__assign(__assign({}, config), { evaluationSampleSize: num || 20 })); }, min: 5, max: 100, children: _jsx(NumberInputField, {}) })] })] }), _jsx(Flex, { w: "full", justify: "flex-end", pt: 4, children: _jsx(Button, { colorScheme: "blue", onClick: onConfigClose, children: "Save Configuration" }) })] }) })] })] })] }));
};
