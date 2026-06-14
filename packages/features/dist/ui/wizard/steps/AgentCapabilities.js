"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCapabilities = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Agent Capabilities Step
 *
 * Step for selecting and configuring agent capabilities
 */
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const CAPABILITIES = [
    // Code capabilities
    {
        id: 'code-generation',
        label: 'Code Generation',
        description: 'Generate code in multiple programming languages',
        icon: lucide_react_1.Code,
        category: 'Code',
    },
    {
        id: 'code-review',
        label: 'Code Review',
        description: 'Review and suggest improvements to code',
        icon: lucide_react_1.Eye,
        category: 'Code',
    },
    {
        id: 'debugging',
        label: 'Debugging',
        description: 'Help identify and fix bugs in code',
        icon: lucide_react_1.Terminal,
        category: 'Code',
    },
    // Communication capabilities
    {
        id: 'text-generation',
        label: 'Text Generation',
        description: 'Generate natural language text and content',
        icon: lucide_react_1.MessageSquare,
        category: 'Communication',
    },
    {
        id: 'conversation',
        label: 'Conversation',
        description: 'Engage in multi-turn conversations',
        icon: lucide_react_1.MessageSquare,
        category: 'Communication',
    },
    // Analysis capabilities
    {
        id: 'analysis',
        label: 'Data Analysis',
        description: 'Analyze data and provide insights',
        icon: lucide_react_1.Brain,
        category: 'Analysis',
    },
    {
        id: 'summarization',
        label: 'Summarization',
        description: 'Summarize long documents or content',
        icon: lucide_react_1.FileSearch,
        category: 'Analysis',
    },
    // Integration capabilities
    {
        id: 'web-search',
        label: 'Web Search',
        description: 'Search the web for information',
        icon: lucide_react_1.Globe,
        category: 'Integration',
        requiresConfig: true,
    },
    {
        id: 'database-access',
        label: 'Database Access',
        description: 'Query and interact with databases',
        icon: lucide_react_1.Database,
        category: 'Integration',
        requiresConfig: true,
        premium: true,
    },
    // Orchestration capabilities
    {
        id: 'orchestration',
        label: 'Orchestration',
        description: 'Coordinate multiple agents',
        icon: lucide_react_1.Workflow,
        category: 'Orchestration',
        premium: true,
    },
    {
        id: 'task-delegation',
        label: 'Task Delegation',
        description: 'Delegate tasks to other agents',
        icon: lucide_react_1.Zap,
        category: 'Orchestration',
        premium: true,
    },
    // Security capabilities
    {
        id: 'secure-execution',
        label: 'Secure Execution',
        description: 'Execute code in sandboxed environment',
        icon: lucide_react_1.Shield,
        category: 'Security',
        premium: true,
    },
];
const CATEGORIES = [
    'Code',
    'Communication',
    'Analysis',
    'Integration',
    'Orchestration',
    'Security',
];
const AgentCapabilities = ({ context, onDataChange, validationErrors = [], }) => {
    const initialCapabilities = context.data.capabilities || context.data.initialCapabilities || [];
    const [selectedCapabilities, setSelectedCapabilities] = (0, react_1.useState)(initialCapabilities);
    const [expandedCategory, setExpandedCategory] = (0, react_1.useState)('Code');
    const toggleCapability = (0, react_1.useCallback)((capabilityId) => {
        setSelectedCapabilities((prev) => {
            const newCapabilities = prev.includes(capabilityId)
                ? prev.filter((id) => id !== capabilityId)
                : [...prev, capabilityId];
            onDataChange({ capabilities: newCapabilities });
            return newCapabilities;
        });
    }, [onDataChange]);
    const selectAll = (0, react_1.useCallback)((category) => {
        const categoryCapabilities = CAPABILITIES.filter((c) => c.category === category).map((c) => c.id);
        setSelectedCapabilities((prev) => {
            const newCapabilities = [...new Set([...prev, ...categoryCapabilities])];
            onDataChange({ capabilities: newCapabilities });
            return newCapabilities;
        });
    }, [onDataChange]);
    const clearAll = (0, react_1.useCallback)((category) => {
        const categoryCapabilities = CAPABILITIES.filter((c) => c.category === category).map((c) => c.id);
        setSelectedCapabilities((prev) => {
            const newCapabilities = prev.filter((id) => !categoryCapabilities.includes(id));
            onDataChange({ capabilities: newCapabilities });
            return newCapabilities;
        });
    }, [onDataChange]);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-capabilities", children: [(0, jsx_runtime_1.jsxs)("div", { className: "step-header", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-8 h-8 text-primary" }), (0, jsx_runtime_1.jsx)("h2", { className: "step-title", children: "Select Capabilities" }), (0, jsx_runtime_1.jsx)("p", { className: "step-description", children: "Choose what your agent will be able to do. You can always add or remove capabilities later." })] }), validationErrors.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "my-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg", role: "alert", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-bold", children: "Please fix the following issues:" }), (0, jsx_runtime_1.jsx)("ul", { className: "list-disc list-inside", children: validationErrors.map((error, index) => ((0, jsx_runtime_1.jsx)("li", { children: error }, index))) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "selected-count", children: [(0, jsx_runtime_1.jsx)("span", { className: "count", children: selectedCapabilities.length }), " capabilities selected"] }), (0, jsx_runtime_1.jsx)("div", { className: `capabilities-container ${validationErrors.some((e) => e === 'At least one capability must be selected')
                    ? 'border border-red-500 rounded-lg p-2'
                    : ''}`, children: CATEGORIES.map((category) => {
                    const categoryCapabilities = CAPABILITIES.filter((c) => c.category === category);
                    const selectedInCategory = categoryCapabilities.filter((c) => selectedCapabilities.includes(c.id)).length;
                    const isExpanded = expandedCategory === category;
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "category-section", children: [(0, jsx_runtime_1.jsxs)("div", { className: "category-header", onClick: () => setExpandedCategory(isExpanded ? null : category), children: [(0, jsx_runtime_1.jsxs)("h3", { className: "category-title", children: [category, (0, jsx_runtime_1.jsxs)("span", { className: "category-count", children: [selectedInCategory, "/", categoryCapabilities.length] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "category-actions", children: [(0, jsx_runtime_1.jsx)("button", { className: "action-btn", onClick: (e) => {
                                                    e.stopPropagation();
                                                    selectAll(category);
                                                }, children: "Select All" }), (0, jsx_runtime_1.jsx)("button", { className: "action-btn", onClick: (e) => {
                                                    e.stopPropagation();
                                                    clearAll(category);
                                                }, children: "Clear" })] })] }), isExpanded && ((0, jsx_runtime_1.jsx)("div", { className: "capability-grid", children: categoryCapabilities.map((capability) => {
                                    const Icon = capability.icon;
                                    const isSelected = selectedCapabilities.includes(capability.id);
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: `capability-card ${isSelected ? 'selected' : ''} ${capability.premium ? 'premium' : ''}`, onClick: () => toggleCapability(capability.id), children: [capability.premium && (0, jsx_runtime_1.jsx)("span", { className: "premium-badge", children: "Premium" }), capability.requiresConfig && ((0, jsx_runtime_1.jsx)("span", { className: "config-badge", children: "Requires Setup" })), (0, jsx_runtime_1.jsx)("div", { className: "capability-icon", children: (0, jsx_runtime_1.jsx)(Icon, { className: "w-5 h-5" }) }), (0, jsx_runtime_1.jsx)("h4", { className: "capability-label", children: capability.label }), (0, jsx_runtime_1.jsx)("p", { className: "capability-description", children: capability.description }), (0, jsx_runtime_1.jsx)("div", { className: "capability-checkbox", children: (0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: isSelected, onChange: () => toggleCapability(capability.id), onClick: (e) => e.stopPropagation() }) })] }, capability.id));
                                }) }))] }, category));
                }) }), (0, jsx_runtime_1.jsxs)("div", { className: "step-tips", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Tips" }), (0, jsx_runtime_1.jsxs)("ul", { children: [(0, jsx_runtime_1.jsx)("li", { children: "Start with core capabilities and add more as needed" }), (0, jsx_runtime_1.jsx)("li", { children: "Premium capabilities require a paid plan" }), (0, jsx_runtime_1.jsx)("li", { children: "Some capabilities need additional configuration after creation" })] })] })] }));
};
exports.AgentCapabilities = AgentCapabilities;
//# sourceMappingURL=AgentCapabilities.js.map