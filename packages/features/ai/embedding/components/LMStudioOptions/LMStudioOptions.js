"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LMStudioEmbeddingOptions = LMStudioEmbeddingOptions;
import react_1 from 'react';
const system_1 = __importDefault(require("@/models/system"));
import constants_1 from '@/utils/constants';
const useProviderEndpointAutoDiscovery_1 = __importDefault(require("@/hooks/useProviderEndpointAutoDiscovery"));
const STYLES = {
    container: "w-full flex flex-col gap-y-7",
    inputGroup: "w-full flex items-start gap-[36px] mt-1.5",
    inputContainer: "flex flex-col w-60",
    label: "text-white text-sm font-semibold block mb-2",
    input: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5",
    helperText: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2",
    button: "flex items-center gap-x-2 text-sm font-semibold text-white text-opacity-60 hover:text-opacity-100",
    select: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5",
};
function LMStudioModelSelection({ settings, basePath = null }) {
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
                const { models } = await system_1.default.fetchLMStudioModels(basePath);
                setModels(models);
            }
            catch (error) {
                console.error("Failed to fetch LMStudio models", error);
                setError("Could not fetch models from LMStudio server. Ensure your server is running and the URL is correct.");
            }
            setLoading(false);
        };
        fetchModels();
    }, [basePath]);
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
LMStudio;
URL;
first
    < /option>;
/optgroup>
    < /select>
    < /div>;
;
function LMStudioEmbeddingOptions({ settings }) {
    const { autoDetecting: loading, basePath, basePathValue, showAdvancedControls, setShowAdvancedControls, handleAutoDetectClick, } = (0, useProviderEndpointAutoDiscovery_1.default)({
        provider: "lmstudio",
        initialBasePath: settings === null || settings === void 0 ? void 0 : settings.EmbeddingBasePath,
        ENDPOINTS: constants_1.LMSTUDIO_COMMON_URLS,
    });
    const [maxChunkLength, setMaxChunkLength] = (0, react_1.useState)((settings === null || settings === void 0 ? void 0 : settings.EmbeddingModelMaxChunkLength) || 8192);
    const handleMaxChunkLengthChange = (e) => {
        setMaxChunkLength(Number(e.target.value));
    };
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
    Embedding;
    Chunk;
    Length
        < /label>
        < input;
    type = "number";
    name = "EmbeddingModelMaxChunkLength";
    className = { STYLES, : .input };
    placeholder = "8192";
    min = { 1:  };
    value = { maxChunkLength };
    onChange = { handleMaxChunkLengthChange };
    onScroll = {}(e);
    e.target.blur();
}
required;
autoComplete = "off" /  >
    className;
{
    STYLES.helperText;
}
 >
    Maximum;
length;
of;
text;
chunks;
for (embedding.
    < /p>
    < /div>
    < /div>
    < div; className = { STYLES, : .inputGroup } >
    className;  = { STYLES, : .inputContainer } >
    className)
     = { STYLES, : .label } > Base;
URL < /label>
    < div;
className = "flex items-center gap-x-4" >
    type;
"url";
name = "EmbeddingBasePath";
className = { STYLES, : .input };
placeholder = "http://localhost:1234";
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
//# sourceMappingURL=LMStudioOptions.js.map
//# sourceMappingURL=LMStudioOptions.js.map