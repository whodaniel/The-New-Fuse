import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import useGetProviderModels, { DISABLED_PROVIDERS, } from "@/hooks/useGetProvidersModels";
import { useTranslation } from "react-i18next";
export default function ChatModelSelection(_a) {
    var provider = _a.provider, workspace = _a.workspace, setHasChanges = _a.setHasChanges;
    var _b = useGetProviderModels(provider), defaultModels = _b.defaultModels, customModels = _b.customModels, loading = _b.loading;
    var t = useTranslation().t;
    if (DISABLED_PROVIDERS.includes(provider))
        return null;
    if (loading) {
        return (_jsxs("div", { children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("label", { htmlFor: "name", className: "block input-label", children: t("chat.model.title") }), _jsx("p", { className: "text-white text-opacity-60 text-xs font-medium py-1.5", children: t("chat.model.description") })] }), _jsx("select", { name: "chatModel", required: true, disabled: true, "aria-label": t("chat.model.title"), className: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", children: _jsx("option", { disabled: true, selected: true, children: "-- waiting for models --" }) })] }));
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("label", { htmlFor: "name", className: "block input-label", children: t("chat.model.title") }), _jsx("p", { className: "text-white text-opacity-60 text-xs font-medium py-1.5", children: t("chat.model.description") })] }), _jsxs("select", { name: "chatModel", required: true, onChange: function () {
                    setHasChanges(true);
                }, "aria-label": t("chat.model.title"), className: "border-none bg-theme-settings-input-bg text-white text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5", children: [defaultModels.length > 0 && (_jsx("optgroup", { label: "General models", children: defaultModels.map(function (model) { return (_jsx("option", { value: model, selected: (workspace === null || workspace === void 0 ? void 0 : workspace.chatModel) === model, children: model }, model)); }) })), Array.isArray(customModels) && customModels.length > 0 && (_jsx("optgroup", { label: "Custom models", children: customModels.map(function (model) { return (_jsx("option", { value: model.id, selected: (workspace === null || workspace === void 0 ? void 0 : workspace.chatModel) === model.id, children: model.id }, model.id)); }) })), !Array.isArray(customModels) &&
                        Object.keys(customModels).length > 0 && (_jsx(_Fragment, { children: Object.entries(customModels).map(function (_a) {
                            var organization = _a[0], models = _a[1];
                            return (_jsx("optgroup", { label: organization, children: models.map(function (model) { return (_jsx("option", { value: model.id, selected: (workspace === null || workspace === void 0 ? void 0 : workspace.chatModel) === model.id, children: model.name || model.id }, model.id)); }) }, organization));
                        }) }))] })] }));
}
