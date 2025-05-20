export const EMBEDDING_PROVIDERS = [
    "native",
    "openai",
    "azure",
    "localai",
    "ollama",
    "lmstudio",
    "cohere",
    "voyageai",
    "litellm",
    "mistral",
    "generic-openai",
];
export const COMMON_STYLES = {
    container: "w-full flex flex-col gap-y-7",
    inputsContainer: "w-full flex items-center gap-[36px] mt-1.5",
    inputWrapper: "flex flex-col w-60",
    label: "text-white text-sm font-semibold block mb-2",
    labelWithOptional: "text-white text-sm font-semibold flex items-center gap-x-2",
    optionalText: "!text-xs !italic !font-thin",
    input: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5",
    select: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5",
    advancedButton: "border-none text-theme-text-primary hover:text-theme-text-secondary flex items-center text-sm",
    autoDetectButton: "bg-primary-button text-xs font-medium px-2 py-1 rounded-lg hover:bg-secondary hover:text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)]",
    caretIcon: "ml-1",
};
//# sourceMappingURL=embedding.js.map