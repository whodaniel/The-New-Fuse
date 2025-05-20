"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CohereAiOptions;
import jsx_runtime_1 from 'react/jsx-runtime';
function CohereAiOptions({ settings }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: "w-full flex flex-col", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full flex items-center gap-[36px] mt-1.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Cohere API Key" }), (0, jsx_runtime_1.jsx)("input", { type: "password", name: "CohereApiKey", className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", placeholder: "Cohere API Key", defaultValue: settings?.CohereApiKey ? "*".repeat(20) : "", required: true, autoComplete: "off", spellCheck: false })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col w-60", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-white text-sm font-semibold block mb-3", children: "Chat Model Selection" }), (0, jsx_runtime_1.jsx)("select", { name: "CohereModelPref", defaultValue: settings?.CohereModelPref || "command-r", required: true, className: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5", children: [
                                "command-r",
                                "command-r-plus",
                                "command",
                                "command-light",
                                "command-nightly",
                                "command-light-nightly",
                            ].map((model) => {
                                return ((0, jsx_runtime_1.jsx)("option", { value: model, children: model }, model));
                            }) })] })] }) }));
}
//# sourceMappingURL=index.js.map