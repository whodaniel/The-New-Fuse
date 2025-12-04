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
import { useEffect, useState } from "react";
export var DISABLED_PROVIDERS = [
    "azure",
    "native",
    "textgenwebui",
    "generic-openai",
    "bedrock",
];
var PROVIDER_DEFAULT_MODELS = {
    openai: [],
    gemini: [
        "gemini-pro",
        "gemini-1.0-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-exp-0801",
        "gemini-1.5-pro-exp-0827",
        "gemini-1.5-flash-exp-0827",
        "gemini-1.5-flash-8b-exp-0827",
        "gemini-exp-1114",
        "gemini-exp-1121",
        "learnlm-1.5-pro-experimental",
    ],
    anthropic: [
        "claude-instant-1.2",
        "claude-2.0",
        "claude-2.1",
        "claude-3-haiku-20240307",
        "claude-3-sonnet-20240229",
        "claude-3-opus-latest",
        "claude-3-5-haiku-latest",
        "claude-3-5-haiku-20241022",
        "claude-3-5-sonnet-latest",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-sonnet-20240620",
    ],
    azure: [],
    lmstudio: [],
    localai: [],
    ollama: [],
    togetherai: [],
    fireworksai: [],
    groq: [],
    native: [],
    cohere: [
        "command-r",
        "command-r-plus",
        "command",
        "command-light",
        "command-nightly",
        "command-light-nightly",
    ],
    textgenwebui: [],
    "generic-openai": [],
    bedrock: [],
    xai: ["grok-beta"],
};
function groupModels(models) {
    return models.reduce(function (acc, model) {
        acc[model.organization] = acc[model.organization] || [];
        acc[model.organization].push(model);
        return acc;
    }, {});
}
var groupedProviders = [
    "togetherai",
    "fireworksai",
    "openai",
    "novita",
    "openrouter",
];
export default function useGetProviderModels(provider) {
    if (provider === void 0) { provider = null; }
    var _a = useState([]), defaultModels = _a[0], setDefaultModels = _a[1];
    var _b = useState([]), customModels = _b[0], setCustomModels = _b[1];
    var _c = useState(true), loading = _c[0], setLoading = _c[1];
    useEffect(function () {
        function fetchProviderModels() {
            return __awaiter(this, void 0, void 0, function () {
                var _a, models;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!provider)
                                return [2 /*return*/];
                            return [4 /*yield*/, System.customModels(provider)];
                        case 1:
                            _a = (_b.sent()).models, models = _a === void 0 ? [] : _a;
                            if (PROVIDER_DEFAULT_MODELS.hasOwnProperty(provider) &&
                                !groupedProviders.includes(provider)) {
                                setDefaultModels(PROVIDER_DEFAULT_MODELS[provider]);
                            }
                            else {
                                setDefaultModels([]);
                            }
                            groupedProviders.includes(provider)
                                ? setCustomModels(groupModels(models))
                                : setCustomModels(models);
                            setLoading(false);
                            return [2 /*return*/];
                    }
                });
            });
        }
        fetchProviderModels();
    }, [provider]);
    return { defaultModels: defaultModels, customModels: customModels, loading: loading };
}
