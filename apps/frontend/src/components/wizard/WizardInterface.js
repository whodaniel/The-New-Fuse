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
exports.WizardInterface = WizardInterface;
import react_1 from 'react';
import WizardProvider_1 from './WizardProvider';
import { Box } from '@chakra-ui/react';
var steps = [
    {
        label: 'Initialize',
        description: 'Set up the wizard session and configure basic settings',
        component: InitializeStep
    },
    {
        label: 'Agent Configuration',
        description: 'Configure and activate AI agents',
        component: AgentConfigStep
    },
    {
        label: 'Knowledge Integration',
        description: 'Connect and configure knowledge sources',
        component: KnowledgeStep
    },
    {
        label: 'Optimization',
        description: 'Fine-tune performance and resource allocation',
        component: OptimizationStep
    }
];
function WizardInterface() {
    var _this = this;
    var _a, _b;
    var _c = (0, WizardProvider_1.useWizard)(), state = _c.state, initializeSession = _c.initializeSession;
    var _d = (0, react_1.useState)(false), loading = _d[0], setLoading = _d[1];
    (0, react_1.useEffect)(function () {
        var init = function () { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        setLoading(true);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, initializeSession(process.env.PROJECT_PATH || '')];
                    case 2:
                        _c.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _c.sent();
                        console.error('Failed to initialize wizard:', error_1);
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        if (!state.isInitialized) {
            init();
        }
    }, [initializeSession, state.isInitialized]);
    if (loading) {
        return (_jsx(material_1.Box, { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", children: _jsx(material_1.CircularProgress, {}) }));
    }
    if (state.error) {
        return (_jsx(material_1.Container, { maxWidth: "md", children: _jsx(material_1.Alert, { severity: "error", sx: { mt: 2 }, children: state.error }) }));
    }
    return (_jsx(material_1.Container, { maxWidth: "lg", children: _jsxs(Box, { elevation: 3, sx: { p: 3, mt: 3 }, children: [_jsx(material_1.Typography, { variant: "h4", gutterBottom: true, children: "FUSE AI Wizard" }), _jsx(material_1.Stepper, { activeStep: state.currentStep, sx: { mb: 4 }, children: steps.map(function (step, index) { return (_jsx(material_1.Step, { completed: index < state.currentStep, children: _jsx(material_1.StepLabel, { children: _jsx(material_1.Typography, { variant: "subtitle2", children: step.label }) }) }, step.label)); }) }), _jsx(material_1.Box, { mb: 3, children: _jsx(material_1.Typography, { variant: "subtitle1", color: "text.secondary", children: (_a = steps[state.currentStep]) === null || _a === void 0 ? void 0 : _a.description }) }), _jsx(material_1.Box, { children: state.isInitialized &&
                        react_1.default.createElement(((_b = steps[state.currentStep]) === null || _b === void 0 ? void 0 : _b.component) || InitializeStep) })] }) }));
}
function InitializeStep() {
    var _a;
    var state = (0, WizardProvider_1.useWizard)().state;
    return (_jsxs(material_1.Box, { children: [_jsx(material_1.Typography, { variant: "h6", gutterBottom: true, children: "Session Information" }), _jsxs(material_1.Typography, { children: ["Project Path: ", (_a = state.session) === null || _a === void 0 ? void 0 : _a.project_path] })] }));
}
function AgentConfigStep() {
    var _c = (0, WizardProvider_1.useWizard)(), state = _c.state, updateAgents = _c.updateAgents;
    var _d = (0, react_1.useState)(new Map()), agents = _d[0], setAgents = _d[1];
    var handleAgentUpdate = function (agentId, context) {
        var updatedAgents = new Map(agents);
        updatedAgents.set(agentId, context);
        setAgents(updatedAgents);
        updateAgents(updatedAgents);
    };
    return (_jsx(material_1.Box, { children: _jsx(material_1.Typography, { variant: "h6", gutterBottom: true, children: "Agent Configuration" }) }));
}
function KnowledgeStep() {
    var state = (0, WizardProvider_1.useWizard)().state;
    var _c = (0, react_1.useState)(null), graph = _c[0], setGraph = _c[1];
    (0, react_1.useEffect)(function () {
        if (state.session) {
            setGraph(state.session.knowledge_graph);
        }
    }, [state.session]);
    return (_jsx(material_1.Box, { children: _jsx(material_1.Typography, { variant: "h6", gutterBottom: true, children: "Knowledge Graph Integration" }) }));
}
function OptimizationStep() {
    var state = (0, WizardProvider_1.useWizard)().state;
    return (_jsx(material_1.Box, { children: _jsx(material_1.Typography, { variant: "h6", gutterBottom: true, children: "System Optimization" }) }));
}
