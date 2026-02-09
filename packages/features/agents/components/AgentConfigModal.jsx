"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentConfigModal = AgentConfigModal;
import jsx_runtime_1 from 'react/jsx-runtime';
import react_1 from 'react';
import react_query_1 from '@tanstack/react-query';
function AgentConfigModal({ isOpen, onClose, agentId, initialData }) {
    const queryClient, type, settings;
}
;
const updateMutation;
() = (0, react_query_1.useQueryClient)();
const [config, setConfig] = (0, react_1.useState)(initialData || {
    name, useMutation({ mutationFn }) { }
} > {
    queryClient, : .invalidateQueries(['agents'])
});
;
return ((0, jsx_runtime_1.jsx)(Dialog_1.Dialog, { open: isOpen, onClose: onClose, children: (0, jsx_runtime_1.jsxs)("div", { className: "p-6", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-bold mb-4", children: "Agent Configuration" }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: (e) => {
                    e.preventDefault();
                    updateMutation.mutate(config);
                }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)(Input_1.Input, { label: "Agent Name", value: config.name, onChange: (e) => setConfig({ ...config, name: e.target.value }) }), (0, jsx_runtime_1.jsx)(Select_1.Select, { label: "Agent Type", value: config.type, options: Object.values(types_1.AgentType), onChange: (value) => setConfig({ ...config, type: value }) }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-sm font-medium", children: "Model Settings" }), (0, jsx_runtime_1.jsx)(Input_1.Input, { type: "number", label: "Temperature", value: config.settings.temperature, onChange: (e) => setConfig({
                                            ...config,
                                            settings: {
                                                ...config.settings,
                                                temperature: parseFloat(e.target.value)
                                            }
                                        }), min: 0, max: 1, step: 0.1 }), (0, jsx_runtime_1.jsx)(Input_1.Input, { type: "number", label: "Max Tokens", value: config.settings.maxTokens, onChange: (e) => setConfig({
                                            ...config,
                                            settings: {
                                                ...config.settings,
                                                maxTokens: parseInt(e.target.value)
                                            }
                                        }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 flex justify-end space-x-3", children: [(0, jsx_runtime_1.jsx)(Button_1.Button, { variant: "outline", onClick: onClose, children: "Cancel" }), (0, jsx_runtime_1.jsx)(Button_1.Button, { type: "submit", isLoading: updateMutation.isLoading, children: "Save Changes" })] })] })] }) }));
//# sourceMappingURL=AgentConfigModal.js.map