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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMConfigManager = LLMConfigManager;
import react_1 from 'react';
import providers_1 from '../../services/llm/providers';
import ui_1 from '../ui';
function LLMConfigManager(_a) {
    var _this = this;
    var currentConfig = _a.currentConfig, onConfigUpdate = _a.onConfigUpdate;
    var _b = (0, react_1.useState)(currentConfig), config = _b[0], setConfig = _b[1];
    var _c = (0, react_1.useState)(false), isValidating = _c[0], setIsValidating = _c[1];
    var _d = (0, react_1.useState)(null), validationError = _d[0], setValidationError = _d[1];
    var handleProviderChange = (0, react_1.useCallback)(function (provider) {
        var defaults = providers_1.PROVIDER_DEFAULTS[provider];
        setConfig(function (prev) { return (Object.assign(Object.assign(Object.assign({}, prev), defaults), { apiKey: prev.apiKey })); });
    }, []);
    var handleParameterChange = (0, react_1.useCallback)(function (param, value) {
        setConfig(function (prev) {
            var _a;
            return (Object.assign(Object.assign({}, prev), { parameters: Object.assign(Object.assign({}, prev.parameters), (_a = {}, _a[param] = value, _a)) }));
        });
    }, []);
    var handleValidateAndSave = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var isValid, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsValidating(true);
                    setValidationError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, providers_1.validateProviderConfig)(config)];
                case 2:
                    isValid = _a.sent();
                    if (isValid) {
                        onConfigUpdate(config);
                    }
                    else {
                        setValidationError('Invalid configuration. Please check your settings.');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    setValidationError('Error validating configuration.');
                    return [3 /*break*/, 5];
                case 4:
                    setIsValidating(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [config, onConfigUpdate]);
    return (_jsxs(ui_1.Card, { className: "p-6 space-y-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "LLM Provider Configuration" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(ui_1.Label, { children: "Provider" }), _jsx(ui_1.Select, { value: config.name, onChange: function (e) { return handleProviderChange(e.target.value); }, options: Object.values(providers_1.SUPPORTED_PROVIDERS).map(function (provider) { return ({
                                    label: providers_1.PROVIDER_DEFAULTS[provider].name,
                                    value: provider,
                                }); }) })] }), _jsxs("div", { children: [_jsx(ui_1.Label, { children: "API Key" }), _jsx(ui_1.Input, { type: "password", value: config.apiKey || '', onChange: function (e) { return setConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { apiKey: e.target.value })); }); }, placeholder: "Enter API key" })] }), _jsxs("div", { children: [_jsx(ui_1.Label, { children: "Model" }), _jsx(ui_1.Input, { value: config.model, onChange: function (e) { return setConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { model: e.target.value })); }); }, placeholder: "Model name" })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium", children: "Parameters" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(ui_1.Label, { children: "Temperature" }), _jsx(ui_1.Input, { type: "number", min: 0, max: 2, step: 0.1, value: config.parameters.temperature, onChange: function (e) { return handleParameterChange('temperature', parseFloat(e.target.value)); } })] }), _jsxs("div", { children: [_jsx(ui_1.Label, { children: "Max Tokens" }), _jsx(ui_1.Input, { type: "number", min: 1, max: 32768, value: config.parameters.maxTokens, onChange: function (e) { return handleParameterChange('maxTokens', parseInt(e.target.value)); } })] }), _jsxs("div", { children: [_jsx(ui_1.Label, { children: "Top P" }), _jsx(ui_1.Input, { type: "number", min: 0, max: 1, step: 0.1, value: config.parameters.topP, onChange: function (e) { return handleParameterChange('topP', parseFloat(e.target.value)); } })] }), _jsxs("div", { children: [_jsx(ui_1.Label, { children: "Frequency Penalty" }), _jsx(ui_1.Input, { type: "number", min: -2, max: 2, step: 0.1, value: config.parameters.frequencyPenalty, onChange: function (e) { return handleParameterChange('frequencyPenalty', parseFloat(e.target.value)); } })] })] })] }), validationError && (_jsx("div", { className: "text-red-500 text-sm", children: validationError })), _jsx(ui_1.Button, { onClick: handleValidateAndSave, disabled: isValidating, className: "w-full", children: isValidating ? 'Validating...' : 'Save Configuration' })] })] }));
}
