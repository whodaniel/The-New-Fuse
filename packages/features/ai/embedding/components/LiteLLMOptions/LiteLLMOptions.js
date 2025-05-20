"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiteLLMOptions = LiteLLMOptions;
import react_1 from 'react';
import react_2 from '@phosphor-icons/react';
const system_1 = __importDefault(require("@/models/system"));
const STYLES = {
    container: "w-full flex flex-col gap-y-7",
    inputGroup: "w-full flex items-center gap-[36px] mt-1.5",
    inputContainer: "flex flex-col w-60",
    label: "text-white text-sm font-semibold block mb-3",
    input: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5",
    select: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5",
    tooltip: "w-80 !text-xs !font-normal !rounded-lg !bg-theme-modal-bg !text-white !opacity-100 !border !border-theme-modal-border !p-3",
};
function EmbeddingModelTooltip() {
    return className = "flex items-center gap-x-2" >
        Embedding;
    Model < /span>
        < react_2.Warning;
    data - tooltip - id;
    "litellm-model-tooltip";
    className = "text-white h-4 w-4" /  >
        id;
    "litellm-model-tooltip";
    className = { STYLES, : .tooltip };
    place = "right" >
        className;
    "flex flex-col gap-y-2" >
        LiteLLM;
    supports;
    many;
    embedding;
    models;
    from;
    different;
    providers.The;
    model;
    you;
    select;
    here;
    must;
    be;
    supported;
    by;
    your;
    LiteLLM;
    proxy;
    server.
        < (/p>);
    Visit;
    {
        " ";
    }
    href;
    "https://docs.litellm.ai/docs/embedding/supported_embedding";
    target = "_blank";
    rel = "noreferrer";
    className = "underline" >
        LiteLLM;
    embedding;
    documentation
        < /a>{" "};
    for (a; list; of)
        supported;
    models.
        < /p>
        < /div>
        < /Tooltip>
        < /div>;
    ;
}
function LiteLLMModelSelection({ settings, basePath = null, apiKey = null }) {
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
                const { models } = await system_1.default.fetchLiteLLMModels(basePath, apiKey);
                setModels(models);
            }
            catch (error) {
                console.error("Failed to fetch LiteLLM models", error);
                setError("Could not fetch models from LiteLLM server. Ensure your server is running and the URL is correct.");
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
     >
        />
        < /label>
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
LiteLLM;
URL;
first
    < /option>;
/optgroup>
    < /select>
    < /div>;
;
function LiteLLMOptions({ settings }) {
    const [basePathValue, setBasePathValue] = (0, react_1.useState)(settings === null || settings === void 0 ? void 0 : settings.LiteLLMBasePath);
    const [basePath, setBasePath] = (0, react_1.useState)(settings === null || settings === void 0 ? void 0 : settings.LiteLLMBasePath);
    const [apiKeyValue, setApiKeyValue] = (0, react_1.useState)(settings === null || settings === void 0 ? void 0 : settings.LiteLLMAPIKey);
    const [apiKey, setApiKey] = (0, react_1.useState)(settings === null || settings === void 0 ? void 0 : settings.LiteLLMAPIKey);
    return className = { STYLES, : .container } >
        className;
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
        Base;
    URL
        < /label>
        < input;
    type = "url";
    name = "LiteLLMBasePath";
    className = { STYLES, : .input };
    placeholder = "http://127.0.0.1:4000";
    defaultValue = { settings } === null || settings === void 0 ? void 0 : settings.LiteLLMBasePath;
}
required;
autoComplete = "off";
spellCheck = { false:  };
onChange = {}(e);
setBasePathValue(e.target.value);
onBlur = {}();
setBasePath(basePathValue);
/>
    < /div>
    < LiteLLMModelSelection;
settings = { settings };
basePath = { basePath };
apiKey = { apiKey } /  >
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
placeholder = "8192";
min = { 1:  };
onScroll = {}(e);
e.target.blur();
defaultValue = { settings } === null || settings === void 0 ? void 0 : settings.EmbeddingModelMaxChunkLength;
autoComplete = "off" /  >
    /div>
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
 >
    API;
Key
    < /label>
    < input;
type = "password";
name = "LiteLLMAPIKey";
className = { STYLES, : .input };
placeholder = "LiteLLM API Key";
defaultValue = {}(settings === null || settings === void 0 ? void 0 : settings.LiteLLMAPIKey) ? "*".repeat(20) : "";
autoComplete = "off";
spellCheck = { false:  };
onChange = {}(e);
setApiKeyValue(e.target.value);
onBlur = {}();
setApiKey(apiKeyValue);
/>
    < /div>
    < /div>
    < /div>;
;
//# sourceMappingURL=LiteLLMOptions.js.map
//# sourceMappingURL=LiteLLMOptions.js.map