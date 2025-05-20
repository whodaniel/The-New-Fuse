"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CohereEmbeddingOptions = CohereEmbeddingOptions;
const COHERE_MODELS = [
    'embed-english-v3.0',
    'embed-multilingual-v3.0',
    'embed-english-light-v3.0',
    'embed-multilingual-light-v3.0',
    'embed-english-v2.0',
    'embed-english-light-v2.0',
    'embed-multilingual-v2.0',
];
function CohereEmbeddingOptions({ settings }) {
    return className = "w-full flex flex-col gap-y-4" >
        className;
    "w-full flex items-center gap-[36px] mt-1.5" >
        className;
    "flex flex-col w-60" >
        className;
    "text-white text-sm font-semibold block mb-3" >
        API;
    Key
        < /label>
        < input;
    type = "password";
    name = "CohereApiKey";
    className = "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5";
    placeholder = "Cohere API Key";
    defaultValue = {}(settings === null || settings === void 0 ? void 0 : settings.CohereApiKey) ? "*".repeat(20) : "";
}
required;
autoComplete = "off";
spellCheck = { false:  } /  >
    /div>
    < div;
className = "flex flex-col w-60" >
    className;
"text-white text-sm font-semibold block mb-3" >
    Model;
Preference
    < /label>
    < select;
name = "EmbeddingModelPref";
required;
className = "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5";
defaultValue = { settings } === null || settings === void 0 ? void 0 : settings.EmbeddingModelPref;
 >
    label;
"Available embedding models" >
    { COHERE_MODELS, : .map((model) => key = { model }, value = { model } >
            { model }
            < /option>) }
    < /optgroup>
    < /select>
    < /div>
    < /div>
    < /div>;
;
//# sourceMappingURL=CohereOptions.js.map
//# sourceMappingURL=CohereOptions.js.map