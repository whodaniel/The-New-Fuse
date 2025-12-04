import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import useGetProviderModels, { DISABLED_PROVIDERS, } from "@/hooks/useGetProvidersModels";
import paths from "@/utils/paths";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
function supportedModel(provider, model) {
    if (model === void 0) { model = ""; }
    if (provider === "openai") {
        return ([
            "gpt-3.5-turbo-0301",
            "gpt-4-turbo-2024-04-09",
            "gpt-4-turbo",
            "o1-preview",
            "o1-preview-2024-09-12",
            "o1-mini",
            "o1-mini-2024-09-12",
        ].includes(model) === false);
    }
    return true;
}
export default function AgentModelSelection(_a) {
    var provider = _a.provider, workspace = _a.workspace, setHasChanges = _a.setHasChanges;
    var slug = useParams().slug;
    var _b = useGetProviderModels(provider), defaultModels = _b.defaultModels, customModels = _b.customModels, loading = _b.loading;
    var t = useTranslation().t;
    if (DISABLED_PROVIDERS.includes(provider)) {
        return (_jsx("div", { className: "w-full h-10 justify-center items-center flex", children: _jsxs("p", { className: "text-sm font-base text-white text-opacity-60 text-center", children: ["Multi-model support is not supported for this provider yet.", _jsx("br", {}), "Agent's will use", " ", _jsx(Link, { to: paths.workspace.settings.chatSettings(slug), className: "underline", children: "the model set for the workspace" }), " ", "or", " ", _jsx(Link, { to: paths.settings.llmPreference(), className: "underline", children: "the model set for the system." })] }) }));
    }
    if (loading) {
        return (_jsxs("div", { children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("label", { htmlFor: "name", className: "block input-label", children: t("agent.mode.chat.title") }), _jsx("p", { className: "text-white text-opacity-60 text-xs font-medium py-1.5", children: t("agent.mode.chat.description") })] }), _jsx("select", { name: "agentModel", required: true, disabled: true, "aria-label": t("agent.mode.chat.title"), className: "border-none bg-theme-settings-input-bg text-white text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", children: _jsx("option", { disabled: true, selected: true, children: t("agent.mode.wait") }) })] }));
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("label", { htmlFor: "name", className: "block input-label", children: t("agent.mode.title") }), _jsx("p", { className: "text-white text-opacity-60 text-xs font-medium py-1.5", children: t("agent.mode.description") })] }), _jsxs("select", { name: "agentModel", required: true, onChange: function () {
                    setHasChanges(true);
                }, "aria-label": t("agent.mode.title"), className: "border-none bg-theme-settings-input-bg text-white text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", children: [defaultModels.length > 0 && (_jsx("optgroup", { label: "General models", children: defaultModels.map(function (model) {
                            if (!supportedModel(provider, model))
                                return null;
                            return (_jsx("option", { value: model, selected: (workspace === null || workspace === void 0 ? void 0 : workspace.agentModel) === model, children: model }, model));
                        }) })), Array.isArray(customModels) && customModels.length > 0 && (_jsx("optgroup", { label: "Custom models", children: customModels.map(function (model) {
                            if (!supportedModel(provider, model.id))
                                return null;
                            return (_jsx("option", { value: model.id, selected: (workspace === null || workspace === void 0 ? void 0 : workspace.agentModel) === model.id, children: model.id }, model.id));
                        }) })), !Array.isArray(customModels) &&
                        Object.keys(customModels).length > 0 && (_jsx(_Fragment, { children: Object.entries(customModels).map(function (_a) {
                            var organization = _a[0], models = _a[1];
                            return (_jsx("optgroup", { label: organization, children: models.map(function (model) {
                                    if (!supportedModel(provider, model.id))
                                        return null;
                                    return (_jsx("option", { value: model.id, selected: (workspace === null || workspace === void 0 ? void 0 : workspace.agentModel) === model.id, children: model.name || model.id }, model.id));
                                }) }, organization));
                        }) }))] })] }));
}
