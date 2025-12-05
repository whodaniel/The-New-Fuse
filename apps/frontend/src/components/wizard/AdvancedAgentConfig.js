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
exports.AdvancedAgentConfig = AdvancedAgentConfig;
import react_1 from 'react';
import { SimpleGrid, GridItem } from '@chakra-ui/react';
import WizardProvider_1 from './WizardProvider';
import WizardWebSocket_1 from './WizardWebSocket';
import react_2 from '@monaco-editor/react';
var defaultSettings = {
    maxConcurrentTasks: 5,
    memoryLimit: 512,
    learningRate: 0.001,
    optimizationLevel: 1,
    customPrompt: '',
    neuralConfig: {
        inputDim: 256,
        hiddenDim: 512,
        outputDim: 256
    },
    integrations: []
};
function AdvancedAgentConfig() {
    var _this = this;
    var _a, _b;
    var _c = (0, WizardProvider_1.useWizard)(), state = _c.state, updateAgents = _c.updateAgents;
    var sendMessage = (0, WizardWebSocket_1.useWizardWebSocket)().sendMessage;
    var _d = (0, react_1.useState)(null), selectedAgent = _d[0], setSelectedAgent = _d[1];
    var _e = (0, react_1.useState)(defaultSettings), settings = _e[0], setSettings = _e[1];
    var _f = (0, react_1.useState)(false), showCodeEditor = _f[0], setShowCodeEditor = _f[1];
    var _g = (0, react_1.useState)(''), customCode = _g[0], setCustomCode = _g[1];
    var _h = (0, react_1.useState)(false), showNeuralConfig = _h[0], setShowNeuralConfig = _h[1];
    (0, react_1.useEffect)(function () {
        var _a;
        if (selectedAgent) {
            var agent = (_a = state.session) === null || _a === void 0 ? void 0 : _a.active_agents.get(selectedAgent);
            if (agent === null || agent === void 0 ? void 0 : agent.settings) {
                setSettings(agent.settings);
            }
        }
    }, [selectedAgent, (_a = state.session) === null || _a === void 0 ? void 0 : _a.active_agents]);
    var handleSettingsChange = function (key, value) {
        setSettings(function (prev) {
            var _c;
            return (Object.assign(Object.assign({}, prev), (_c = {}, _c[key] = value, _c)));
        });
    };
    var handleNeuralConfigChange = function (key, value) {
        setSettings(function (prev) {
            var _c;
            return (Object.assign(Object.assign({}, prev), { neuralConfig: Object.assign(Object.assign({}, prev.neuralConfig), (_c = {}, _c[key] = value, _c)) }));
        });
    };
    var applySettings = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, updatedAgent, agents;
        return __generator(this, function (_c) {
            if (!selectedAgent)
                return [2 /*return*/];
            try {
                updatedAgent = (_a = state.session) === null || _a === void 0 ? void 0 : _a.active_agents.get(selectedAgent);
                if (updatedAgent) {
                    updatedAgent.settings = settings;
                    agents = new Map((_b = state.session) === null || _b === void 0 ? void 0 : _b.active_agents);
                    agents.set(selectedAgent, updatedAgent);
                    updateAgents(agents);
                    sendMessage('agent_settings_update', {
                        agentId: selectedAgent,
                        settings: settings
                    });
                }
            }
            catch (error) {
                console.error('Failed to update agent settings:', error);
            }
            return [2 /*return*/];
        });
    }); };
    var handleCodeSave = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_c) {
            if (!selectedAgent)
                return [2 /*return*/];
            try {
                sendMessage('agent_code_update', {
                    agentId: selectedAgent,
                    code: customCode
                });
                setShowCodeEditor(false);
            }
            catch (error) {
                console.error('Failed to update agent code:', error);
            }
            return [2 /*return*/];
        });
    }); };
    return (_jsxs(material_1.Box, { children: [_jsx(material_1.Typography, { variant: "h6", gutterBottom: true, children: "Advanced Agent Configuration" }), _jsxs(SimpleGrid, { columns: 3, children: [_jsx(GridItem, { colSpan: 12, md: 4, children: _jsxs(material_1.FormControl, { fullWidth: true, children: [_jsx(material_1.InputLabel, { children: "Select Agent" }), _jsx(material_1.Select, { value: selectedAgent || '', onChange: function (e) { return setSelectedAgent(e.target.value); }, children: Array.from(((_b = state.session) === null || _b === void 0 ? void 0 : _b.active_agents.entries()) || []).map(function (_c) {
                                        var id = _c[0], agent = _c[1];
                                        return (_jsxs(material_1.MenuItem, { value: id, children: [agent.name, " (", agent.type, ")"] }, id));
                                    }) })] }) }), selectedAgent && (_jsxs(GridItem, { colSpan: 12, md: 8, children: [_jsxs(material_1.Box, { display: "flex", gap: 1, mb: 2, children: [_jsx(material_1.Tooltip, { title: "Code Editor", children: _jsx(material_1.IconButton, { onClick: function () { return setShowCodeEditor(true); }, children: _jsx(icons_material_1.Code, {}) }) }), _jsx(material_1.Tooltip, { title: "Neural Configuration", children: _jsx(material_1.IconButton, { onClick: function () { return setShowNeuralConfig(true); }, children: _jsx(icons_material_1.Psychology, {}) }) })] }), _jsxs(material_1.Accordion, { children: [_jsx(material_1.AccordionSummary, { expandIcon: _jsx(icons_material_1.ExpandMore, {}), children: _jsx(material_1.Typography, { children: "Basic Settings" }) }), _jsx(material_1.AccordionDetails, { children: _jsxs(SimpleGrid, { columns: 2, children: [_jsxs(GridItem, { colSpan: 12, md: 6, children: [_jsx(material_1.Typography, { gutterBottom: true, children: "Max Concurrent Tasks" }), _jsx(material_1.Slider, { value: settings.maxConcurrentTasks, onChange: function (_, value) { return handleSettingsChange('maxConcurrentTasks', value); }, min: 1, max: 20, marks: true, valueLabelDisplay: "auto" })] }), _jsxs(GridItem, { colSpan: 12, md: 6, children: [_jsx(material_1.Typography, { gutterBottom: true, children: "Memory Limit (MB)" }), _jsx(material_1.Slider, { value: settings.memoryLimit, onChange: function (_, value) { return handleSettingsChange('memoryLimit', value); }, min: 128, max: 2048, step: 128, marks: true, valueLabelDisplay: "auto" })] })] }) })] })] })
                        ,
                            _jsxs(material_1.Accordion, { children: [_jsx(material_1.AccordionSummary, { expandIcon: _jsx(icons_material_1.ExpandMore, {}), children: _jsx(material_1.Typography, { children: "Learning Settings" }) }), _jsx(material_1.AccordionDetails, { children: _jsxs(SimpleGrid, { columns: 2, children: [_jsxs(GridItem, { colSpan: 12, md: 6, children: [_jsx(material_1.Typography, { gutterBottom: true, children: "Learning Rate" }), _jsx(material_1.Slider, { value: settings.learningRate, onChange: function (_, value) { return handleSettingsChange('learningRate', value); }, min: 0.0001, max: 0.01, step: 0.0001, marks: true, valueLabelDisplay: "auto" })] }), _jsxs(GridItem, { colSpan: 12, md: 6, children: [_jsx(material_1.Typography, { gutterBottom: true, children: "Optimization Level" }), _jsx(material_1.Slider, { value: settings.optimizationLevel, onChange: function (_, value) { return handleSettingsChange('optimizationLevel', value); }, min: 0, max: 3, marks: true, valueLabelDisplay: "auto" })] })] }) })] }))] }), _jsxs(material_1.Accordion, { children: [_jsx(material_1.AccordionSummary, { expandIcon: _jsx(icons_material_1.ExpandMore, {}), children: _jsx(material_1.Typography, { children: "Custom Prompt" }) }), _jsx(material_1.AccordionDetails, { children: _jsx(material_1.TextField, { fullWidth: true, multiline: true, rows: 4, value: settings.customPrompt, onChange: function (e) { return handleSettingsChange('customPrompt', e.target.value); }, placeholder: "Enter custom prompt template..." }) })] }), _jsx(material_1.Box, { mt: 2, children: _jsx(material_1.Button, { variant: "contained", onClick: applySettings, startIcon: _jsx(icons_material_1.Settings, {}), children: "Apply Settings" }) })] }));
}
GridItem >
    (_jsxs(material_1.Dialog, { open: showCodeEditor, onClose: function () { return setShowCodeEditor(false); }, maxWidth: "md", fullWidth: true, children: [_jsx(material_1.DialogTitle, { children: "Custom Agent Code" }), _jsx(material_1.DialogContent, { children: _jsx(material_1.Box, { height: "60vh", children: _jsx(react_2.default, { language: "typescript", theme: "vs-dark", value: customCode, onChange: function (value) { return setCustomCode(value || ''); }, options: {
                            minimap: { enabled: false },
                            fontSize: 14
                        } }) }) }), _jsxs(material_1.DialogActions, { children: [_jsx(material_1.Button, { onClick: function () { return setShowCodeEditor(false); }, children: "Cancel" }), _jsx(material_1.Button, { onClick: handleCodeSave, variant: "contained", children: "Save Code" })] })] })
        ,
            _jsxs(material_1.Dialog, { open: showNeuralConfig, onClose: function () { return setShowNeuralConfig(false); }, maxWidth: "sm", fullWidth: true, children: [_jsx(material_1.DialogTitle, { children: "Neural Network Configuration" }), _jsx(material_1.DialogContent, { children: _jsxs(SimpleGrid, { columns: 2, children: [_jsxs(GridItem, { colSpan: 12, children: [_jsx(material_1.Typography, { gutterBottom: true, children: "Input Dimension" }), _jsx(material_1.Slider, { value: settings.neuralConfig.inputDim, onChange: function (_, value) { return handleNeuralConfigChange('inputDim', value); }, min: 64, max: 1024, step: 64, marks: true, valueLabelDisplay: "auto" })] }), _jsxs(GridItem, { colSpan: 12, children: [_jsx(material_1.Typography, { gutterBottom: true, children: "Hidden Dimension" }), _jsx(material_1.Slider, { value: settings.neuralConfig.hiddenDim, onChange: function (_, value) { return handleNeuralConfigChange('hiddenDim', value); }, min: 128, max: 2048, step: 128, marks: true, valueLabelDisplay: "auto" })] }), _jsxs(GridItem, { colSpan: 12, children: [_jsx(material_1.Typography, { gutterBottom: true, children: "Output Dimension" }), _jsx(material_1.Slider, { value: settings.neuralConfig.outputDim, onChange: function (_, value) { return handleNeuralConfigChange('outputDim', value); }, min: 64, max: 1024, step: 64, marks: true, valueLabelDisplay: "auto" })] })] }) })] })
                ,
                    _jsxs(material_1.DialogActions, { children: [_jsx(material_1.Button, { onClick: function () { return setShowNeuralConfig(false); }, children: "Cancel" }), _jsx(material_1.Button, { onClick: function () {
                                    applySettings();
                                    setShowNeuralConfig(false);
                                }, variant: "contained", children: "Apply Configuration" })] }));
material_1.Dialog >
;
material_1.Box > ;
;
