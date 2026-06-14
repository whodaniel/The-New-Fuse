"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentConfiguration = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Agent Configuration Step
 *
 * Step for configuring a new agent's basic settings
 */
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const AGENT_TYPES = [
    {
        id: 'chat',
        label: 'Chat Agent',
        description: 'Conversational AI for customer support or team communication',
        icon: lucide_react_1.MessageSquare,
        capabilities: ['text-generation', 'conversation'],
    },
    {
        id: 'code',
        label: 'Code Agent',
        description: 'Assist with coding, debugging, and code review',
        icon: lucide_react_1.Code,
        capabilities: ['code-generation', 'code-review', 'debugging'],
    },
    {
        id: 'orchestrator',
        label: 'Orchestrator',
        description: 'Coordinate multiple agents for complex workflows',
        icon: lucide_react_1.Cpu,
        capabilities: ['orchestration', 'task-delegation'],
    },
    {
        id: 'analyzer',
        label: 'Analyzer',
        description: 'Analyze data, documents, and provide insights',
        icon: lucide_react_1.Brain,
        capabilities: ['analysis', 'summarization'],
    },
    {
        id: 'custom',
        label: 'Custom Agent',
        description: 'Build a custom agent with selected capabilities',
        icon: lucide_react_1.Wand2,
        capabilities: [],
    },
];
const PROVIDERS = [
    { id: 'openai', label: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    {
        id: 'anthropic',
        label: 'Anthropic',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    },
    {
        id: 'gemini',
        label: 'Google Gemini',
        models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    },
    { id: 'litellm', label: 'LiteLLM (Multi-provider)', models: ['auto'] },
];
const AgentConfiguration = ({ context, onDataChange, validationErrors = [], }) => {
    const [agentName, setAgentName] = (0, react_1.useState)(context.data.agentName || '');
    const [agentType, setAgentType] = (0, react_1.useState)(context.data.agentType || '');
    const [provider, setProvider] = (0, react_1.useState)(context.data.provider || 'openai');
    const [model, setModel] = (0, react_1.useState)(context.data.model || '');
    const [description, setDescription] = (0, react_1.useState)(context.data.agentDescription || '');
    const handleNameChange = (value) => {
        setAgentName(value);
        onDataChange({ agentName: value });
    };
    const handleTypeChange = (typeId) => {
        const selectedType = AGENT_TYPES.find((t) => t.id === typeId);
        setAgentType(typeId);
        onDataChange({
            agentType: typeId,
            initialCapabilities: selectedType?.capabilities || [],
        });
    };
    const handleProviderChange = (value) => {
        const selectedProvider = PROVIDERS.find((p) => p.id === value);
        setProvider(value);
        setModel(selectedProvider?.models[0] || '');
        onDataChange({
            provider: value,
            model: selectedProvider?.models[0] || '',
        });
    };
    const handleModelChange = (value) => {
        setModel(value);
        onDataChange({ model: value });
    };
    const selectedProvider = PROVIDERS.find((p) => p.id === provider);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-agent-config", children: [(0, jsx_runtime_1.jsxs)("div", { className: "step-header", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bot, { className: "w-8 h-8 text-primary" }), (0, jsx_runtime_1.jsx)("h2", { className: "step-title", children: "Configure Your Agent" }), (0, jsx_runtime_1.jsx)("p", { className: "step-description", children: "Set up the basic configuration for your new AI agent" })] }), validationErrors.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "my-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg", role: "alert", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-bold", children: "Please fix the following issues:" }), (0, jsx_runtime_1.jsx)("ul", { className: "list-disc list-inside", children: validationErrors.map((error, index) => ((0, jsx_runtime_1.jsx)("li", { children: error }, index))) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "config-form", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "agent-name", className: "form-label", children: "Agent Name *" }), (0, jsx_runtime_1.jsx)("input", { id: "agent-name", type: "text", className: `form-input ${validationErrors.some((e) => e === 'Agent name is required') ? 'border-red-500' : ''}`, placeholder: "Enter a unique name for your agent", value: agentName, onChange: (e) => handleNameChange(e.target.value), required: true, "aria-invalid": validationErrors.some((e) => e === 'Agent name is required'), "aria-describedby": "agent-name-error" }), validationErrors.some((e) => e === 'Agent name is required') && ((0, jsx_runtime_1.jsx)("p", { id: "agent-name-error", className: "text-red-600 text-sm mt-1", children: "Agent name is a required field." })), (0, jsx_runtime_1.jsx)("p", { className: "form-hint", children: "Choose a descriptive name that reflects the agent's purpose" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Agent Type *" }), (0, jsx_runtime_1.jsx)("div", { className: `agent-type-grid ${validationErrors.some((e) => e === 'Agent type is required')
                                    ? 'border border-red-500 rounded-lg p-2'
                                    : ''}`, children: AGENT_TYPES.map((type) => {
                                    const Icon = type.icon;
                                    const isSelected = agentType === type.id;
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: `agent-type-card ${isSelected ? 'selected' : ''}`, onClick: () => handleTypeChange(type.id), role: "radio", "aria-checked": isSelected, tabIndex: 0, children: [(0, jsx_runtime_1.jsx)("div", { className: "type-icon", children: (0, jsx_runtime_1.jsx)(Icon, { className: "w-6 h-6" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "type-label", children: type.label }), (0, jsx_runtime_1.jsx)("p", { className: "type-description", children: type.description }), type.capabilities.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "type-capabilities", children: type.capabilities.slice(0, 2).map((cap) => ((0, jsx_runtime_1.jsx)("span", { className: "capability-tag", children: cap }, cap))) }))] }, type.id));
                                }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-row", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "provider", className: "form-label", children: "LLM Provider *" }), (0, jsx_runtime_1.jsx)("select", { id: "provider", className: "form-select", value: provider, onChange: (e) => handleProviderChange(e.target.value), children: PROVIDERS.map((p) => ((0, jsx_runtime_1.jsx)("option", { value: p.id, children: p.label }, p.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "model", className: "form-label", children: "Model *" }), (0, jsx_runtime_1.jsx)("select", { id: "model", className: "form-select", value: model, onChange: (e) => handleModelChange(e.target.value), children: selectedProvider?.models.map((m) => ((0, jsx_runtime_1.jsx)("option", { value: m, children: m }, m))) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "description", className: "form-label", children: "Description (Optional)" }), (0, jsx_runtime_1.jsx)("textarea", { id: "description", className: "form-textarea", placeholder: "Describe what this agent will do...", rows: 3, value: description, onChange: (e) => setDescription(e.target.value), onBlur: () => onDataChange({ agentDescription: description }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "step-tips", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Tips" }), (0, jsx_runtime_1.jsxs)("ul", { children: [(0, jsx_runtime_1.jsx)("li", { children: "Choose a specific agent type to get pre-configured capabilities" }), (0, jsx_runtime_1.jsx)("li", { children: "LiteLLM supports automatic routing to the best provider" }), (0, jsx_runtime_1.jsx)("li", { children: "You can add more capabilities in the next step" })] })] })] }));
};
exports.AgentConfiguration = AgentConfiguration;
//# sourceMappingURL=AgentConfiguration.js.map