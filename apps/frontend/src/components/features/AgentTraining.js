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
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentTraining = void 0;
import react_1 from 'react';
import react_query_1 from '@tanstack/react-query';
import Card_1 from '../../../core/Card';
import Button_1 from '../../../core/Button';
import Input_1 from '../../../core/Input';
import Select_1 from '../../../core/Select';
import FileUpload_1 from '../../chat/FileUpload';
import agentService_1 from '../../../../services/api/agentService';
import react_hot_toast_1 from 'react-hot-toast';
import recharts_1 from 'recharts';
var AgentTraining = function (_b) {
    var agentId = _b.agentId;
    var _c = (0, react_1.useState)({
        model: 'gpt-4',
        epochs: 10,
        batchSize: 32,
        learningRate: 0.001,
        validationSplit: 0.2,
    }), trainingConfig = _c[0], setTrainingConfig = _c[1];
    var _d = (0, react_1.useState)(null), customData = _d[0], setCustomData = _d[1];
    var agent = (0, react_query_1.useQuery)({
        queryKey: ['agent', agentId],
        queryFn: function () { return agentService_1.agentService.getAgentById(agentId); },
    }).data;
    var trainingHistory = (0, react_query_1.useQuery)({
        queryKey: ['training-history', agentId],
        queryFn: function () { return agentService_1.agentService.getTrainingHistory(agentId); },
        refetchInterval: 5000,
    }).data;
    var trainMutation = (0, react_query_1.useMutation)({
        mutationFn: function () { return __awaiter(void 0, void 0, void 0, function () {
            var customDataPayload, reader_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!customData) return [3 /*break*/, 2];
                        reader_1 = new FileReader();
                        return [4 /*yield*/, new Promise(function (resolve) {
                                reader_1.onload = function (e) { var _a; return resolve(JSON.parse((_a = e.target) === null || _a === void 0 ? void 0 : _a.result)); };
                                reader_1.readAsText(customData);
                            })];
                    case 1:
                        customDataPayload = _b.sent();
                        _b.label = 2;
                    case 2: return [2 /*return*/, agentService_1.agentService.trainAgent(agentId, Object.assign(Object.assign({}, trainingConfig), { customData: customDataPayload }))];
                }
            });
        }); },
        onSuccess: function () {
            react_hot_toast_1.toast.success('Training started successfully');
        },
        onError: function (error) {
            react_hot_toast_1.toast.error('Failed to start training');
            console.error('Training error:', error);
        },
    });
    var validateMutation = (0, react_query_1.useMutation)({
        mutationFn: function (testData) { return agentService_1.agentService.validateTraining(agentId, testData); },
        onSuccess: function (data) {
            react_hot_toast_1.toast.success("Validation complete - Accuracy: ".concat((data.accuracy * 100).toFixed(2), "%"));
        },
        onError: function (error) {
            react_hot_toast_1.toast.error('Validation failed');
            console.error('Validation error:', error);
        },
    });
    var handleStartTraining = function () {
        trainMutation.mutate();
    };
    var handleValidateTraining = function () { return __awaiter(void 0, void 0, void 0, function () {
        var reader;
        return __generator(this, function (_b) {
            if (!customData) {
                react_hot_toast_1.toast.error('Please upload test data');
                return [2 /*return*/];
            }
            reader = new FileReader();
            reader.onload = function (e) {
                var _a;
                try {
                    var testData = JSON.parse((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
                    validateMutation.mutate(testData);
                }
                catch (error) {
                    react_hot_toast_1.toast.error('Invalid test data format');
                }
            };
            reader.readAsText(customData);
            return [2 /*return*/];
        });
    }); };
    var formatMetrics = function (history) {
        return history.map(function (item) { return ({
            epoch: item.epoch,
            accuracy: item.metrics.accuracy,
            loss: item.metrics.loss,
            validationAccuracy: item.metrics.val_accuracy,
            validationLoss: item.metrics.val_loss,
        }); });
    };
    return (_jsxs(Card_1.Card, { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("h2", { className: "text-xl font-semibold", children: ["Training Configuration - ", agent === null || agent === void 0 ? void 0 : agent.name] }), _jsxs("div", { className: "space-x-2", children: [_jsx(Button_1.Button, { variant: "outline", onClick: handleValidateTraining, disabled: validateMutation.isPending || !customData, children: "Validate Training" }), _jsx(Button_1.Button, { onClick: handleStartTraining, disabled: trainMutation.isPending, children: "Start Training" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Model" }), _jsxs(Select_1.Select, { value: trainingConfig.model, onChange: function (e) { return setTrainingConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { model: e.target.value })); }); }, children: [_jsx("option", { value: "gpt-4", children: "GPT-4" }), _jsx("option", { value: "gpt-3.5-turbo", children: "GPT-3.5 Turbo" }), _jsx("option", { value: "claude-2", children: "Claude 2" }), _jsx("option", { value: "custom", children: "Custom Model" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Epochs" }), _jsx(Input_1.Input, { type: "number", value: trainingConfig.epochs, onChange: function (e) { return setTrainingConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { epochs: parseInt(e.target.value) })); }); }, min: 1, max: 100 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Batch Size" }), _jsx(Input_1.Input, { type: "number", value: trainingConfig.batchSize, onChange: function (e) { return setTrainingConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { batchSize: parseInt(e.target.value) })); }); }, min: 1, max: 512 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Learning Rate" }), _jsx(Input_1.Input, { type: "number", value: trainingConfig.learningRate, onChange: function (e) { return setTrainingConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { learningRate: parseFloat(e.target.value) })); }); }, min: 0.0001, max: 1, step: 0.0001 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Validation Split" }), _jsx(Input_1.Input, { type: "number", value: trainingConfig.validationSplit, onChange: function (e) { return setTrainingConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { validationSplit: parseFloat(e.target.value) })); }); }, min: 0.1, max: 0.5, step: 0.1 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Custom Training/Test Data" }), _jsx(FileUpload_1.FileUpload, { onUploadComplete: function (file) { return setCustomData(file); }, disabled: trainMutation.isPending }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Upload JSON file containing training or test data" })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium", children: "Training Progress" }), trainingHistory && trainingHistory.history.length > 0 ? (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "h-64", children: _jsxs(recharts_1.LineChart, { width: 500, height: 250, data: formatMetrics(trainingHistory.history), margin: { top: 5, right: 30, left: 20, bottom: 5 }, children: [_jsx(recharts_1.CartesianGrid, { strokeDasharray: "3 3" }), _jsx(recharts_1.XAxis, { dataKey: "epoch" }), _jsx(recharts_1.YAxis, {}), _jsx(recharts_1.Tooltip, {}), _jsx(recharts_1.Legend, {}), _jsx(recharts_1.Line, { type: "monotone", dataKey: "accuracy", stroke: "#8884d8", name: "Accuracy" }), _jsx(recharts_1.Line, { type: "monotone", dataKey: "loss", stroke: "#82ca9d", name: "Loss" }), trainingHistory.history[0].metrics.val_accuracy && (_jsx(recharts_1.Line, { type: "monotone", dataKey: "validationAccuracy", stroke: "#ffc658", name: "Validation Accuracy" }))] }) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs(Card_1.Card, { className: "p-4", children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Latest Metrics" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm", children: "Accuracy:" }), _jsxs("span", { className: "text-sm font-medium", children: [(trainingHistory.history[trainingHistory.history.length - 1].metrics.accuracy * 100).toFixed(2), "%"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm", children: "Loss:" }), _jsx("span", { className: "text-sm font-medium", children: trainingHistory.history[trainingHistory.history.length - 1].metrics.loss.toFixed(4) })] })] })] }), _jsxs(Card_1.Card, { className: "p-4", children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Training Status" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm", children: "Progress:" }), _jsxs("span", { className: "text-sm font-medium", children: [trainingHistory.history.length, " / ", trainingConfig.epochs, " epochs"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm", children: "Status:" }), _jsx("span", { className: "text-sm font-medium text-green-500", children: trainMutation.isPending ? 'Training...' : 'Ready' })] })] })] })] })] })) : (_jsx("div", { className: "flex items-center justify-center h-64 border-2 border-dashed rounded-lg", children: _jsx("p", { className: "text-gray-500", children: "No training history available" }) }))] })] })] }));
};
exports.AgentTraining = AgentTraining;
exports.default = exports.AgentTraining;
