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
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import System from '@/models/system';
import PreLoader from '@/components/Preloader';
import { LOCALAI_COMMON_URLS } from '@/utils/constants';
import useProviderEndpointAutoDiscovery from '@/hooks/useProviderEndpointAutoDiscovery';
import { COMMON_STYLES } from '@/types/embedding';
import { useTranslation } from 'react-i18next';
export default function LocalAiOptions(_a) {
    var _this = this;
    var settings = _a.settings;
    var t = useTranslation().t;
    var _b = useState(false), showAdvanced = _b[0], setShowAdvanced = _b[1];
    var _c = useState([]), availableModels = _c[0], setAvailableModels = _c[1];
    var _d = useState(false), isLoading = _d[0], setIsLoading = _d[1];
    var _e = useProviderEndpointAutoDiscovery({
        provider: 'localai',
        initialEndpoint: settings === null || settings === void 0 ? void 0 : settings.LocalAiBasePath,
        commonUrls: LOCALAI_COMMON_URLS
    }), discoveredEndpoint = _e.discoveredEndpoint, isDiscovering = _e.isDiscovering;
    useEffect(function () {
        function fetchModels() {
            return __awaiter(this, void 0, void 0, function () {
                var response, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!discoveredEndpoint)
                                return [2 /*return*/];
                            setIsLoading(true);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, System.getLocalAIModels(discoveredEndpoint)];
                        case 2:
                            response = _a.sent();
                            setAvailableModels(response.models || []);
                            return [3 /*break*/, 5];
                        case 3:
                            error_1 = _a.sent();
                            console.error('Failed to fetch LocalAI models:', error_1);
                            return [3 /*break*/, 5];
                        case 4:
                            setIsLoading(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        fetchModels();
    }, [discoveredEndpoint]);
    if (isDiscovering || isLoading) {
        return _jsx(PreLoader, {});
    }
    var handleSettingsUpdate = function (updates) { return __awaiter(_this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, System.updateEmbeddingSettings(__assign(__assign({}, settings), updates))];
                case 1:
                    response = _a.sent();
                    if (response.error) {
                        console.error('Failed to update settings:', response.error);
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { className: COMMON_STYLES.container, children: [_jsxs("div", { className: COMMON_STYLES.inputsContainer, children: [_jsxs("div", { className: COMMON_STYLES.inputWrapper, children: [_jsx("label", { className: COMMON_STYLES.label, htmlFor: "localAiKey", children: t('Local AI API Key') }), _jsx("input", { id: "localAiKey", type: "password", className: COMMON_STYLES.input, placeholder: t('Enter your LocalAI API key'), defaultValue: (settings === null || settings === void 0 ? void 0 : settings.LocalAiApiKey) ? '*'.repeat(20) : '', onChange: function (e) { return handleSettingsUpdate({ LocalAiApiKey: e.target.value }); }, required: true, autoComplete: "off", spellCheck: false })] }), _jsxs("div", { className: COMMON_STYLES.inputWrapper, children: [_jsx("label", { className: COMMON_STYLES.label, htmlFor: "localAiBasePath", children: t('Base Path') }), _jsx("input", { id: "localAiBasePath", type: "url", className: COMMON_STYLES.input, placeholder: "http://localhost:8080/v1", defaultValue: (settings === null || settings === void 0 ? void 0 : settings.LocalAiBasePath) || '', onChange: function (e) { return handleSettingsUpdate({ LocalAiBasePath: e.target.value }); }, required: true, autoComplete: "off", spellCheck: false })] }), availableModels.length > 0 && (_jsxs("div", { className: COMMON_STYLES.inputWrapper, children: [_jsx("label", { className: COMMON_STYLES.label, htmlFor: "embeddingModel", children: t('Embedding Model') }), _jsxs("select", { id: "embeddingModel", className: COMMON_STYLES.select, value: (settings === null || settings === void 0 ? void 0 : settings.EmbeddingModelPref) || '', onChange: function (e) { return handleSettingsUpdate({ EmbeddingModelPref: e.target.value }); }, children: [_jsx("option", { value: "", children: t('Select a model') }), availableModels.map(function (model) { return (_jsx("option", { value: model.id, children: model.name || model.id }, model.id)); })] })] }))] }), _jsxs("button", { type: "button", className: COMMON_STYLES.advancedButton, onClick: function () { return setShowAdvanced(!showAdvanced); }, children: [t('Advanced Settings'), _jsx("div", { className: "flex justify-start", children: _jsxs("button", { type: "button", className: "flex items-center text-sm font-medium text-gray-600 hover:text-gray-800", onClick: function () { return setShowAdvanced(!showAdvanced); }, children: [showAdvanced ? (_jsx(ChevronUp, { className: "mr-2 h-4 w-4" })) : (_jsx(ChevronDown, { className: "mr-2 h-4 w-4" })), showAdvanced ? t('Hide Advanced Options') : t('Show Advanced Options')] }) }), showAdvanced && (_jsx("div", { className: COMMON_STYLES.inputsContainer, children: _jsxs("div", { className: COMMON_STYLES.inputWrapper, children: [_jsx("label", { className: COMMON_STYLES.label, htmlFor: "maxChunkLength", children: t('Max Chunk Length') }), _jsx("input", { id: "maxChunkLength", type: "number", className: COMMON_STYLES.input, placeholder: "8192", defaultValue: (settings === null || settings === void 0 ? void 0 : settings.EmbeddingModelMaxChunkLength) || 8192, onChange: function (e) { return handleSettingsUpdate({
                                        EmbeddingModelMaxChunkLength: parseInt(e.target.value, 10)
                                    }); }, min: 1, required: true })] }) }))] })] }));
}
