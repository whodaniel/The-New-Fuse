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
import { useEffect, useState, useRef } from "react";
import { ChevronsUpDown, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/SettingsSidebar";
import System from "@/models/system";
import showToast from "@/utils/toast";
import PreLoader from "@/components/Preloader";
import ChangeWarningModal from "@/components/ChangeWarning";
import { ModalWrapper } from "@/components/ModalWrapper";
import CTAButton from "@/components/lib/CTAButton";
import { useModal } from "@/hooks/useModal";
import { COMMON_STYLES } from "@/types/embedding";
import AnythingLLMIcon from "@/media/logo/anything-llm-icon.png";
import OpenAiLogo from "@/media/llmprovider/openai.png";
import AzureOpenAiLogo from "@/media/llmprovider/azure.png";
import LocalAiLogo from "@/media/llmprovider/localai.png";
import OllamaLogo from "@/media/llmprovider/ollama.png";
import LMStudioLogo from "@/media/llmprovider/lmstudio.png";
import CohereLogo from "@/media/llmprovider/cohere.png";
import VoyageAiLogo from "@/media/embeddingprovider/voyageai.png";
import LiteLLMLogo from "@/media/llmprovider/litellm.png";
import GenericOpenAiLogo from "@/media/llmprovider/generic-openai.png";
import MistralAiLogo from "@/media/llmprovider/mistral.jpeg";
import OpenAiOptions from "@/components/EmbeddingSelection/OpenAiOptions";
import AzureAiOptions from "@/components/EmbeddingSelection/AzureAiOptions";
import LocalAiOptions from "@/components/EmbeddingSelection/LocalAiOptions";
import NativeEmbeddingOptions from "@/components/EmbeddingSelection/NativeEmbeddingOptions";
import OllamaEmbeddingOptions from "@/components/EmbeddingSelection/OllamaOptions";
import LMStudioEmbeddingOptions from "@/components/EmbeddingSelection/LMStudioOptions";
import CohereEmbeddingOptions from "@/components/EmbeddingSelection/CohereOptions";
import VoyageAiOptions from "@/components/EmbeddingSelection/VoyageAiOptions";
import LiteLLMOptions from "@/components/EmbeddingSelection/LiteLLMOptions";
import GenericOpenAiEmbeddingOptions from "@/components/EmbeddingSelection/GenericOpenAiOptions";
import MistralAiOptions from "@/components/EmbeddingSelection/MistralAiOptions";
import EmbedderItem from "@/components/EmbeddingSelection/EmbedderItem";
var STYLES = __assign(__assign({}, COMMON_STYLES), { container: "w-screen h-screen overflow-hidden bg-theme-bg-container flex", contentContainer: "relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0", form: "flex w-full", formContent: "flex flex-col w-full px-1 md:pl-6 md:pr-[50px] py-16 md:py-6", header: "w-full flex flex-col gap-y-1 pb-6 border-white light:border-theme-sidebar-border border-b-2 border-opacity-10", title: "text-lg leading-6 font-bold text-white", description: "text-xs leading-[18px] font-base text-white text-opacity-60", searchOverlay: "fixed top-0 left-0 w-full h-full bg-black bg-opacity-70 backdrop-blur-sm z-10", searchContainer: "absolute top-0 left-0 w-full max-w-[640px] max-h-[310px] overflow-auto white-scrollbar min-h-[64px] bg-theme-settings-input-bg rounded-lg flex flex-col justify-between cursor-pointer border-2 border-primary-button z-20", searchInput: "border-none -ml-4 my-2 bg-transparent z-20 pl-12 h-[38px] w-full px-4 py-1 text-sm outline-none text-theme-text-primary placeholder:text-theme-text-primary placeholder:font-medium", embedderButton: "w-full max-w-[640px] h-[64px] bg-theme-settings-input-bg rounded-lg flex items-center p-[14px] justify-between cursor-pointer border-2 border-transparent hover:border-primary-button transition-all duration-300", embedderLogo: "w-10 h-10 rounded-md" });
var EMBEDDERS = [
    {
        name: "AnythingLLM Embedder",
        value: "native",
        logo: AnythingLLMIcon,
        options: function (settings) { return _jsx(NativeEmbeddingOptions, { settings: settings }); },
        description: "Use the built-in embedding provider for AnythingLLM. Zero setup!",
    },
    {
        name: "OpenAI",
        value: "openai",
        logo: OpenAiLogo,
        options: function (settings) { return _jsx(OpenAiOptions, { settings: settings }); },
        description: "The standard option for most non-commercial use.",
    },
    {
        name: "Azure OpenAI",
        value: "azure",
        logo: AzureOpenAiLogo,
        options: function (settings) { return _jsx(AzureAiOptions, { settings: settings }); },
        description: "The enterprise option of OpenAI hosted on Azure services.",
    },
    {
        name: "Local AI",
        value: "localai",
        logo: LocalAiLogo,
        options: function (settings) { return _jsx(LocalAiOptions, { settings: settings }); },
        description: "Run embedding models locally on your own machine.",
    },
    {
        name: "Ollama",
        value: "ollama",
        logo: OllamaLogo,
        options: function (settings) { return _jsx(OllamaEmbeddingOptions, { settings: settings }); },
        description: "Run embedding models locally on your own machine.",
    },
    {
        name: "LM Studio",
        value: "lmstudio",
        logo: LMStudioLogo,
        options: function (settings) { return _jsx(LMStudioEmbeddingOptions, { settings: settings }); },
        description: "Discover, download, and run thousands of cutting edge LLMs in a few clicks.",
    },
    {
        name: "Cohere",
        value: "cohere",
        logo: CohereLogo,
        options: function (settings) { return _jsx(CohereEmbeddingOptions, { settings: settings }); },
        description: "Run powerful embedding models from Cohere.",
    },
    {
        name: "Voyage AI",
        value: "voyageai",
        logo: VoyageAiLogo,
        options: function (settings) { return _jsx(VoyageAiOptions, { settings: settings }); },
        description: "Run powerful embedding models from Voyage AI.",
    },
    {
        name: "LiteLLM",
        value: "litellm",
        logo: LiteLLMLogo,
        options: function (settings) { return _jsx(LiteLLMOptions, { settings: settings }); },
        description: "Run powerful embedding models from LiteLLM.",
    },
    {
        name: "Mistral AI",
        value: "mistral",
        logo: MistralAiLogo,
        options: function (settings) { return _jsx(MistralAiOptions, { settings: settings }); },
        description: "Run powerful embedding models from Mistral AI.",
    },
    {
        name: "Generic OpenAI",
        value: "generic-openai",
        logo: GenericOpenAiLogo,
        options: function (settings) { return _jsx(GenericOpenAiEmbeddingOptions, { settings: settings }); },
        description: "Run embedding models from any OpenAI compatible API service.",
    },
];
export default function GeneralEmbeddingPreference() {
    var _this = this;
    var _a;
    var _c = useState(false), saving = _c[0], setSaving = _c[1];
    var _d = useState(false), hasChanges = _d[0], setHasChanges = _d[1];
    var _e = useState(false), hasEmbeddings = _e[0], setHasEmbeddings = _e[1];
    var _f = useState(false), hasCachedEmbeddings = _f[0], setHasCachedEmbeddings = _f[1];
    var _g = useState(null), settings = _g[0], setSettings = _g[1];
    var _h = useState(true), loading = _h[0], setLoading = _h[1];
    var _j = useState(""), searchQuery = _j[0], setSearchQuery = _j[1];
    var _k = useState([]), filteredEmbedders = _k[0], setFilteredEmbedders = _k[1];
    var _l = useState(null), selectedEmbedder = _l[0], setSelectedEmbedder = _l[1];
    var _m = useState(false), searchMenuOpen = _m[0], setSearchMenuOpen = _m[1];
    var searchInputRef = useRef(null);
    var _o = useModal(), isOpen = _o.isOpen, openModal = _o.openModal, closeModal = _o.closeModal;
    var t = useTranslation().t;
    function embedderModelChanged(formEl) {
        var _a, _b;
        try {
            var newModel = (_b = (_a = new FormData(formEl).get("EmbeddingModelPref")) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : null;
            if (newModel === null)
                return false;
            return (settings === null || settings === void 0 ? void 0 : settings.EmbeddingModelPref) !== newModel;
        }
        catch (error) {
            console.error(error);
        }
        return false;
    }
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var form;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    e === null || e === void 0 ? void 0 : e.preventDefault();
                    form = document.getElementById("embedding-form");
                    if (!((selectedEmbedder !== (settings === null || settings === void 0 ? void 0 : settings.EmbeddingEngine) ||
                        embedderModelChanged(form)) &&
                        hasChanges &&
                        (hasEmbeddings || hasCachedEmbeddings))) return [3 /*break*/, 1];
                    openModal();
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, handleSaveSettings()];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleSaveSettings = function () { return __awaiter(_this, void 0, void 0, function () {
        var form, settingsData, formData, _i, _c, _d, key, value, error;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    setSaving(true);
                    form = document.getElementById("embedding-form");
                    settingsData = {};
                    formData = new FormData(form);
                    settingsData.EmbeddingEngine = selectedEmbedder;
                    for (_i = 0, _c = formData.entries(); _i < _c.length; _i++) {
                        _d = _c[_i], key = _d[0], value = _d[1];
                        settingsData[key] = value;
                    }
                    return [4 /*yield*/, System.updateSystem(settingsData)];
                case 1:
                    error = (_e.sent()).error;
                    if (error) {
                        showToast("Failed to save embedding settings: ".concat(error), "error");
                        setHasChanges(true);
                    }
                    else {
                        showToast("Embedding preferences saved successfully.", "success");
                        setHasChanges(false);
                    }
                    setSaving(false);
                    closeModal();
                    return [2 /*return*/];
            }
        });
    }); };
    var updateChoice = function (selection) {
        setSearchQuery("");
        setSelectedEmbedder(selection);
        setSearchMenuOpen(false);
        setHasChanges(true);
    };
    var handleXButton = function () {
        if (searchQuery.length > 0) {
            setSearchQuery("");
            if (searchInputRef.current)
                searchInputRef.current.value = "";
        }
        else {
            setSearchMenuOpen(!searchMenuOpen);
        }
    };
    useEffect(function () {
        function fetchKeys() {
            return __awaiter(this, void 0, void 0, function () {
                var _settings;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, System.keys()];
                        case 1:
                            _settings = _c.sent();
                            setSettings(_settings);
                            setSelectedEmbedder((_settings === null || _settings === void 0 ? void 0 : _settings.EmbeddingEngine) || "native");
                            setHasEmbeddings((_settings === null || _settings === void 0 ? void 0 : _settings.HasExistingEmbeddings) || false);
                            setHasCachedEmbeddings((_settings === null || _settings === void 0 ? void 0 : _settings.HasCachedEmbeddings) || false);
                            setLoading(false);
                            return [2 /*return*/];
                    }
                });
            });
        }
        fetchKeys();
    }, []);
    useEffect(function () {
        var filtered = EMBEDDERS.filter(function (embedder) { return embedder.name.toLowerCase().includes(searchQuery.toLowerCase()); });
        setFilteredEmbedders(filtered);
    }, [searchQuery, selectedEmbedder]);
    var selectedEmbedderObject = EMBEDDERS.find(function (embedder) { return embedder.value === selectedEmbedder; });
    if (!selectedEmbedderObject)
        return null;
    return (_jsxs("div", { className: STYLES.container, children: [_jsx(Sidebar, {}), loading ? (_jsx("div", { className: STYLES.contentContainer(isMobile), children: _jsx("div", { className: "w-full h-full flex justify-center items-center", children: _jsx(PreLoader, {}) }) })) : (_jsx("div", { className: STYLES.contentContainer, children: _jsx("form", { id: "embedding-form", onSubmit: handleSubmit, className: STYLES.form, children: _jsxs("div", { className: STYLES.formContent, children: [_jsxs("div", { className: STYLES.header, children: [_jsx("div", { className: "flex gap-x-4 items-center", children: _jsx("p", { className: STYLES.title, children: t("embedding.title") }) }), _jsxs("p", { className: STYLES.description, children: [t("embedding.desc-start"), _jsx("br", {}), t("embedding.desc-end")] })] }), _jsx("div", { className: "w-full justify-end flex", children: hasChanges && (_jsx(CTAButton, { onClick: function () { return handleSubmit(); }, className: "mt-3 mr-0 -mb-14 z-10", children: saving ? t("common.saving") : t("common.save") })) }), _jsx("div", { className: "text-base font-bold text-white mt-6 mb-4", children: t("embedding.provider.title") }), _jsxs("div", { className: "relative", children: [searchMenuOpen && (_jsx("div", { className: STYLES.searchOverlay, onClick: function () { return setSearchMenuOpen(false); } })), searchMenuOpen ? (_jsx("div", { className: STYLES.searchContainer, children: _jsxs("div", { className: "w-full flex flex-col gap-y-1", children: [_jsxs("div", { className: "flex items-center sticky top-0 border-b border-[#9CA3AF] mx-4 bg-theme-settings-input-bg", children: [_jsx(Search, { size: 20, className: "absolute left-4 z-30 text-theme-text-primary -ml-4 my-2" }), _jsx("input", { type: "text", name: "embedder-search", autoComplete: "off", placeholder: "Search all embedding providers", className: STYLES.searchInput, onChange: function (e) { return setSearchQuery(e.target.value); }, ref: searchInputRef, onKeyDown: function (e) {
                                                                if (e.key === "Enter")
                                                                    e.preventDefault();
                                                            } }), _jsx(X, { size: 20, className: "cursor-pointer text-white hover:text-x-button", onClick: handleXButton })] }), _jsx("div", { className: "flex-1 pl-4 pr-2 flex flex-col gap-y-1 overflow-y-auto white-scrollbar pb-4", children: filteredEmbedders.map(function (embedder) { return (_jsx(EmbedderItem, { name: embedder.name, value: embedder.value, image: embedder.logo, description: embedder.description, checked: selectedEmbedder === embedder.value, onClick: function () { return updateChoice(embedder.value); } }, embedder.name)); }) })] }) })) : (_jsxs("button", { className: STYLES.embedderButton, type: "button", onClick: function () { return setSearchMenuOpen(true); }, children: [_jsxs("div", { className: "flex gap-x-4 items-center", children: [_jsx("img", { src: selectedEmbedderObject.logo, alt: "".concat(selectedEmbedderObject.name, " logo"), className: STYLES.embedderLogo }), _jsxs("div", { className: "flex flex-col text-left", children: [_jsx("div", { className: "text-sm font-semibold text-white", children: selectedEmbedderObject.name }), _jsx("div", { className: "mt-1 text-xs text-description", children: selectedEmbedderObject.description })] })] }), _jsx(ChevronsUpDown, { size: 24, className: "text-white" })] }))] }), _jsx("div", { onChange: function () { return setHasChanges(true); }, className: "mt-4 flex flex-col gap-y-1", children: selectedEmbedder &&
                                    ((_a = EMBEDDERS.find(function (embedder) { return embedder.value === selectedEmbedder; })) === null || _a === void 0 ? void 0 : _a.options(settings || {})) })] }) }) })), _jsx(ModalWrapper, { isOpen: isOpen, children: _jsx(ChangeWarningModal, { warningText: "Switching the embedding model will break previously embedded documents from working during chat. They will need to un-embed from every workspace and fully removed and re-uploaded so they can be embed by the new embedding model.", onClose: closeModal, onConfirm: handleSaveSettings }) })] }));
}
