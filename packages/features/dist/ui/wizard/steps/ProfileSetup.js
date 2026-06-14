"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileSetup = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Profile Setup - User profile configuration step
 */
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const GOAL_OPTIONS = [
    {
        id: 'automation',
        label: 'Process Automation',
        description: 'Automate repetitive tasks and workflows',
        icon: lucide_react_1.Code,
    },
    {
        id: 'customer-support',
        label: 'Customer Support',
        description: 'Build AI-powered support agents',
        icon: lucide_react_1.User,
    },
    {
        id: 'data-analysis',
        label: 'Data Analysis',
        description: 'Analyze and extract insights from data',
        icon: lucide_react_1.Database,
    },
    {
        id: 'deployment',
        label: 'Cloud Deployment',
        description: 'Deploy and manage cloud services',
        icon: lucide_react_1.Cloud,
    },
    {
        id: 'security',
        label: 'Security & Compliance',
        description: 'Implement security and access controls',
        icon: lucide_react_1.Shield,
    },
    {
        id: 'integration',
        label: 'System Integration',
        description: 'Connect and integrate different systems',
        icon: lucide_react_1.Building,
    },
];
const ProfileSetup = ({ context, onDataChange, validationErrors = [], }) => {
    const [name, setName] = (0, react_1.useState)(context.data.name || '');
    const [email, setEmail] = (0, react_1.useState)(context.data.email || '');
    const [organization, setOrganization] = (0, react_1.useState)(context.data.organization || '');
    const [selectedGoals, setSelectedGoals] = (0, react_1.useState)(context.data.goals || []);
    const handleNameChange = (value) => {
        setName(value);
        onDataChange({ name: value });
    };
    const handleEmailChange = (value) => {
        setEmail(value);
        onDataChange({ email: value });
    };
    const handleOrganizationChange = (value) => {
        setOrganization(value);
        onDataChange({ organization: value });
    };
    const handleGoalToggle = (goalId) => {
        const newGoals = selectedGoals.includes(goalId)
            ? selectedGoals.filter((g) => g !== goalId)
            : [...selectedGoals, goalId];
        setSelectedGoals(newGoals);
        onDataChange({ goals: newGoals });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-profile-setup", children: [(0, jsx_runtime_1.jsxs)("div", { className: "profile-header", children: [(0, jsx_runtime_1.jsx)("h2", { className: "step-title", children: "Set Up Your Profile" }), (0, jsx_runtime_1.jsx)("p", { className: "step-description", children: "Tell us about yourself so we can personalize your experience" })] }), validationErrors.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "validation-errors", children: validationErrors.map((error, index) => ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error }, index))) })), (0, jsx_runtime_1.jsxs)("div", { className: "profile-form", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { htmlFor: "name", className: "form-label", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.User, { className: "w-4 h-4" }), "Full Name *"] }), (0, jsx_runtime_1.jsx)("input", { id: "name", type: "text", className: "form-input", placeholder: "Enter your full name", value: name, onChange: (e) => handleNameChange(e.target.value), required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { htmlFor: "email", className: "form-label", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "w-4 h-4" }), "Email Address *"] }), (0, jsx_runtime_1.jsx)("input", { id: "email", type: "email", className: "form-input", placeholder: "your.email@example.com", value: email, onChange: (e) => handleEmailChange(e.target.value), required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { htmlFor: "organization", className: "form-label", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Building, { className: "w-4 h-4" }), "Organization (Optional)"] }), (0, jsx_runtime_1.jsx)("input", { id: "organization", type: "text", className: "form-input", placeholder: "Your company or organization", value: organization, onChange: (e) => handleOrganizationChange(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "form-label", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Target, { className: "w-4 h-4" }), "Your Goals *"] }), (0, jsx_runtime_1.jsx)("p", { className: "form-hint", children: "Select all that apply" }), (0, jsx_runtime_1.jsx)("div", { className: "goals-grid", children: GOAL_OPTIONS.map((goal) => {
                                    const Icon = goal.icon;
                                    const isSelected = selectedGoals.includes(goal.id);
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: `goal-card ${isSelected ? 'selected' : ''}`, onClick: () => handleGoalToggle(goal.id), children: [(0, jsx_runtime_1.jsx)("div", { className: "goal-icon", children: (0, jsx_runtime_1.jsx)(Icon, { className: "w-6 h-6" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "goal-content", children: [(0, jsx_runtime_1.jsx)("h3", { className: "goal-label", children: goal.label }), (0, jsx_runtime_1.jsx)("p", { className: "goal-description", children: goal.description })] }), (0, jsx_runtime_1.jsx)("div", { className: "goal-checkbox", children: (0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: isSelected, onChange: () => handleGoalToggle(goal.id), onClick: (e) => e.stopPropagation() }) })] }, goal.id));
                                }) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "profile-footer", children: (0, jsx_runtime_1.jsx)("p", { className: "footer-note", children: "Your information is kept private and secure. You can update it anytime in Settings." }) })] }));
};
exports.ProfileSetup = ProfileSetup;
//# sourceMappingURL=ProfileSetup.js.map