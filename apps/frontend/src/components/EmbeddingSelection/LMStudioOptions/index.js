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
import { ChevronDown, ChevronUp } from 'lucide-react';
import { COMMON_STYLES } from '@/types/embedding';
import System from '@/models/system';
import { LMSTUDIO_COMMON_URLS } from '@/utils/constants';
import useProviderEndpointAutoDiscovery from '@/hooks/useProviderEndpointAutoDiscovery';
import PreLoader from '@/components/Preloader';
import { useTranslation } from 'react-i18next';
function LMStudioModelSelection(_a) {
    var settings = _a.settings, basePath = _a.basePath;
    var _b = useState([]), models = _b[0], setModels = _b[1];
    var _c = useState(false), loading = _c[0], setLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var t = useTranslation().t;
    useEffect(function () {
        function fetchModels() {
            return __awaiter(this, void 0, void 0, function () {
                var models_1, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!basePath)
                                return [2 /*return*/];
                            setLoading(true);
                            setError(null);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, System.getLMStudioModels(basePath)];
                        case 2:
                            models_1 = (_a.sent()).models;
                            setModels(models_1 || []);
                            return [3 /*break*/, 5];
                        case 3:
                            error_1 = _a.sent();
                            console.error('Failed to fetch LMStudio models:', error_1);
                            setError('Could not fetch models from LMStudio server. Ensure your server is running and the URL is correct.');
                            return [3 /*break*/, 5];
                        case 4:
                            setLoading(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        fetchModels();
    }, [basePath]);
    if (loading) {
        return _jsx(PreLoader, {});
    }
    return (_jsxs("div", { className: COMMON_STYLES.inputWrapper, children: [_jsx("label", { className: COMMON_STYLES.label, htmlFor: "modelPref", children: t('Model Preference') }), _jsxs("select", { id: "modelPref", name: "EmbeddingModelPref", className: COMMON_STYLES.select, value: (settings === null || settings === void 0 ? void 0 : settings.EmbeddingModelPref) || '', onChange: function (e) {
                    System.updateEmbeddingSettings(__assign(__assign({}, settings), { EmbeddingModelPref: e.target.value }));
                }, required: true, disabled: !models.length, children: [_jsx("option", { value: "", children: t('Select a model') }), error ? (_jsx("option", { value: "", disabled: true, children: error })) : (models.map(function (model) { return (_jsx("option", { value: model.id, children: model.name || model.id }, model.id)); }))] })] }));
}
export default function LMStudioOptions(_a) {
    var _this = this;
    var settings = _a.settings;
    var _b = useState(false), showAdvanced = _b[0], setShowAdvanced = _b[1];
    var t = useTranslation().t;
    var _c = useProviderEndpointAutoDiscovery({
        provider: 'lmstudio',
        initialEndpoint: settings === null || settings === void 0 ? void 0 : settings.LMStudioBasePath,
        commonUrls: LMSTUDIO_COMMON_URLS
    }), discoveredEndpoint = _c.discoveredEndpoint, isDiscovering = _c.isDiscovering;
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
    if (isDiscovering) {
        return _jsx(PreLoader, {});
    }
    return (_jsxs("div", { className: COMMON_STYLES.container, children: [_jsxs("div", { className: COMMON_STYLES.inputsContainer, children: [_jsxs("div", { className: COMMON_STYLES.inputWrapper, children: [_jsx("label", { className: COMMON_STYLES.label, htmlFor: "lmBasePath", children: t('LM Studio Base Path') }), _jsx("input", { id: "lmBasePath", type: "url", className: COMMON_STYLES.input, placeholder: "http://localhost:1234/v1", value: (settings === null || settings === void 0 ? void 0 : settings.LMStudioBasePath) || '', onChange: function (e) { return handleSettingsUpdate({ LMStudioBasePath: e.target.value }); }, required: true, autoComplete: "off", spellCheck: false })] }), _jsx(LMStudioModelSelection, { settings: settings, basePath: discoveredEndpoint || (settings === null || settings === void 0 ? void 0 : settings.LMStudioBasePath) || null })] }), _jsx("div", { className: "flex justify-start", children: _jsxs("button", { onClick: function () { return setShowAdvanced(!showAdvanced); }, className: "flex items-center text-sm text-gray-600 hover:text-gray-800", children: [showAdvanced ? (_jsx(ChevronUp, { className: "mr-2 h-4 w-4" })) : (_jsx(ChevronDown, { className: "mr-2 h-4 w-4" })), showAdvanced ? t('Hide Advanced Options') : t('Show Advanced Options')] }) }), showAdvanced && (_jsx("div", { className: COMMON_STYLES.inputsContainer, children: _jsxs("div", { className: COMMON_STYLES.inputWrapper, children: [_jsx("label", { className: COMMON_STYLES.label, htmlFor: "maxChunkLength", children: t('Max Chunk Length') }), _jsx("input", { id: "maxChunkLength", type: "number", className: COMMON_STYLES.input, placeholder: "8192", value: (settings === null || settings === void 0 ? void 0 : settings.EmbeddingModelMaxChunkLength) || 8192, onChange: function (e) { return handleSettingsUpdate({
                                EmbeddingModelMaxChunkLength: parseInt(e.target.value, 10)
                            }); }, min: 1, required: true })] }) }))] }));
}
