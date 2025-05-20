"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoyageAiOptions = VoyageAiOptions;
const VOYAGE_MODELS = [
    'voyage-large-2-instruct',
    'voyage-finance-2',
    'voyage-multilingual-2',
    'voyage-law-2',
    'voyage-code-2',
    'voyage-large-2',
    'voyage-2',
    'voyage-3',
    'voyage-3-lite',
];
const STYLES = {
    container: "w-full flex flex-col gap-y-4",
    inputGroup: "w-full flex items-center gap-[36px] mt-1.5",
    inputContainer: "flex flex-col w-60",
    label: "text-white text-sm font-semibold block mb-3",
    input: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5",
    select: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5",
};
function VoyageAiOptions({ settings }) {
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
        API;
    Key
        < /label>
        < input;
    type = "password";
    name = "VoyageAiApiKey";
    className = { STYLES, : .input };
    placeholder = "Voyage AI API Key";
    defaultValue = {}(settings === null || settings === void 0 ? void 0 : settings.VoyageAiApiKey) ? "*".repeat(20) : "";
}
required;
autoComplete = "off";
spellCheck = { false:  } /  >
    /div>
    < div;
className = { STYLES, : .inputContainer } >
    className;
{
    STYLES.label;
}
 >
    Model;
Preference
    < /label>
    < select;
name = "EmbeddingModelPref";
required;
defaultValue = { settings } === null || settings === void 0 ? void 0 : settings.EmbeddingModelPref;
className = { STYLES, : .select } >
    label;
"Available embedding models" >
    { VOYAGE_MODELS, : .map((model) => key = { model }, value = { model } >
            { model }
            < /option>) }
    < /optgroup>
    < /select>
    < /div>
    < /div>
    < /div>;
;
//# sourceMappingURL=VoyageAiOptions.js.map
//# sourceMappingURL=VoyageAiOptions.js.map