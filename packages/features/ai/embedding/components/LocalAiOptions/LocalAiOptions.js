"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAiOptions = LocalAiOptions;
import react_1 from 'react';
const system_1 = __importDefault(require("@/models/system"));
import constants_1 from '@/utils/constants';
const useProviderEndpointAutoDiscovery_1 = __importDefault(require("@/hooks/useProviderEndpointAutoDiscovery"));
const STYLES = {
    container: "w-full flex flex-col gap-y-7",
    inputGroup: "w-full flex items-center gap-[36px] mt-1.5",
    inputContainer: "flex flex-col w-60",
    label: "text-white text-sm font-semibold block mb-2",
    input: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5",
    select: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5",
    button: "flex items-center gap-x-2 text-sm font-semibold text-white text-opacity-60 hover:text-opacity-100",
    helperText: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2",
    labelWithGap: "text-white text-sm font-semibold flex items-center gap-x-2",
};
function LocalAIModelSelection({ settings, apiKey = null, basePath = null }) {
    const [models, setModels] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        () => ;
        () => {
            if (!basePath)
                return;
            setLoading(true);
            setError(null);
            try {
                const { models } = await system_1.default.fetchLocalAIModels(basePath, apiKey);
                setModels(models);
            }
            catch (error) {
                console.error("Failed to fetch LocalAI models", error);
                setError("Could not fetch models from LocalAI server. Ensure your server is running and the URL is correct.");
            }
            setLoading(false);
        };
        fetchModels();
    }, [basePath, apiKey]);
    return className = { STYLES, : .inputContainer } >
        className;
    {
        STYLES.label;
    }
     > Model;
    Preference < /label>
        < select;
    name = "EmbeddingModelPref";
    required;
    disabled = { loading } || !models.length;
}
className = { STYLES, : .select };
defaultValue = { settings } === null || settings === void 0 ? void 0 : settings.EmbeddingModelPref;
 >
    label;
{
    loading ? "Loading models..." : "Available embedding models";
}
 >
    {} >
    { error }
    < /option>;
models.length ? (models.map((model) => key = { model }, value = { model } >
    { model }
    < /option>)) : ;
value = "";
disabled >
    Enter;
LocalAI;
URL;
first
    < /option>;
/optgroup>
    < /select>
    < /div>;
;
function LocalAiOptions({ settings }) {
    const { autoDetecting: loading, basePath, basePathValue, showAdvancedControls, setShowAdvancedControls, handleAutoDetectClick, } = (0, useProviderEndpointAutoDiscovery_1.default)({
        provider: "localai",
        initialBasePath: settings === null || settings === void 0 ? void 0 : settings.EmbeddingBasePath,
        ENDPOINTS: constants_1.LOCALAI_COMMON_URLS,
    });
    const [apiKeyValue, setApiKeyValue] = (0, react_1.useState)(settings === null || settings === void 0 ? void 0 : settings.LocalAiApiKey);
    const [apiKey, setApiKey] = (0, react_1.useState)(settings === null || settings === void 0 ? void 0 : settings.LocalAiApiKey);
    return className = { STYLES, : .container } >
        className;
    {
        STYLES.inputGroup;
    }
     >
        settings;
    {
        settings;
    }
    apiKey = { apiKey } !== null && apiKey !== void 0 ? apiKey : null;
}
basePath = { basePath, : .value } /  >
    className;
{
    STYLES.inputContainer;
}
 >
    className;
{
    STYLES.label;
}
 >
    Max;
embedding;
chunk;
length
    < /label>
    < input;
type = "number";
name = "EmbeddingModelMaxChunkLength";
className = { STYLES, : .input };
placeholder = "1000";
min = { 1:  };
onScroll = {}(e);
e.target.blur();
defaultValue = { settings } === null || settings === void 0 ? void 0 : settings.EmbeddingModelMaxChunkLength;
autoComplete = "off" /  >
    /div>
    < div;
className = { STYLES, : .inputContainer } >
    className;
"flex flex-col gap-y-1 mb-2" >
    className;
{
    STYLES.labelWithGap;
}
 >
    Local;
AI;
API;
Key;
{
    " ";
}
className;
"text-xs text-white text-opacity-60" > (Optional) < /span>
    < /label>
    < /div>
    < input;
type = "password";
name = "LocalAiApiKey";
className = { STYLES, : .input };
placeholder = "Local AI API Key";
defaultValue = {}(settings === null || settings === void 0 ? void 0 : settings.LocalAiApiKey) ? "*".repeat(20) : "";
autoComplete = "off";
spellCheck = { false:  };
onChange = {}(e);
setApiKeyValue(e.target.value);
onBlur = {}();
setApiKey(apiKeyValue);
/>
    < /div>
    < /div>
    < div;
className = { STYLES, : .inputGroup } >
    className;
{
    STYLES.inputContainer;
}
 >
    className;
{
    STYLES.label;
}
 > Base;
URL < /label>
    < div;
className = "flex items-center gap-x-4" >
    type;
"url";
name = "EmbeddingBasePath";
className = { STYLES, : .input };
placeholder = "http://localhost:8080";
value = { basePathValue };
onChange = {}(e);
basePath.onChange(e.target.value);
onBlur = {}();
basePath.onBlur();
required;
autoComplete = "off";
spellCheck = { false:  } /  >
    type;
"button";
className = { STYLES, : .button };
onClick = { handleAutoDetectClick };
disabled = { loading } >
    {} /  > ;
"Auto-detect";
/button>
    < /div>
    < /div>
    < /div>
    < button;
type = "button";
className = { STYLES, : .button };
onClick = {}();
setShowAdvancedControls(!showAdvancedControls);
 >
    Advanced;
Controls;
{
    showAdvancedControls ? className = "h-4 w-4" /  >  : ;
    className = "h-4 w-4" /  > ;
}
/button>;
{
    showAdvancedControls && className;
    {
        STYLES.inputGroup;
    }
     >
        className;
    {
        STYLES.inputContainer;
    }
     >
        className;
    {
        STYLES.label;
    }
     >
        Model;
    Base;
    Path(Optional)
        < /label>
        < input;
    type = "text";
    name = "EmbeddingModelBasePath";
    className = { STYLES, : .input };
    placeholder = "/path/to/models";
    defaultValue = { settings } === null || settings === void 0 ? void 0 : settings.EmbeddingModelBasePath;
}
autoComplete = "off";
spellCheck = { false:  } /  >
    className;
{
    STYLES.helperText;
}
 >
    Path;
to;
your;
models;
directory.Leave;
empty;
to;
use;
path.
    < /p>
    < /div>
    < /div>;
/div>;
;
//# sourceMappingURL=LocalAiOptions.js.map
//# sourceMappingURL=LocalAiOptions.js.map