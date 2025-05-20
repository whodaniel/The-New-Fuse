"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MistralAiOptions = MistralAiOptions;
const MISTRAL_MODELS = ['mistral-embed'];
function MistralAiOptions({ settings }) {
    const inputClasses = "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5";
    const labelClasses = "text-white text-sm font-semibold block mb-3";
    return className = "w-full flex flex-col gap-y-4" >
        className;
    "w-full flex items-center gap-[36px] mt-1.5" >
        className;
    "flex flex-col w-60" >
        className;
    {
        labelClasses;
    }
     >
        API;
    Key
        < /label>
        < input;
    type = "password";
    name = "MistralApiKey";
    className = { inputClasses };
    placeholder = "Mistral AI API Key";
    defaultValue = {}(settings === null || settings === void 0 ? void 0 : settings.MistralApiKey) ? "*".repeat(20) : "";
}
required;
autoComplete = "off";
spellCheck = { false:  } /  >
    /div>
    < div;
className = "flex flex-col w-60" >
    className;
{
    labelClasses;
}
 >
    Model;
Preference
    < /label>
    < select;
name = "EmbeddingModelPref";
required;
defaultValue = { settings } === null || settings === void 0 ? void 0 : settings.EmbeddingModelPref;
className = { inputClasses } >
    label;
"Available embedding models" >
    { MISTRAL_MODELS, : .map((model) => key = { model }, value = { model } >
            { model }
            < /option>) }
    < /optgroup>
    < /select>
    < /div>
    < /div>
    < /div>;
;
//# sourceMappingURL=MistralAiOptions.js.map
//# sourceMappingURL=MistralAiOptions.js.map