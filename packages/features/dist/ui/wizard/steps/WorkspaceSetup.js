"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceSetup = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Workspace Setup - Workspace creation step
 */
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const WORKSPACE_TYPES = [
    {
        id: 'personal',
        label: 'Personal',
        description: 'For individual projects and experimentation',
        icon: lucide_react_1.User,
        recommended: true,
    },
    {
        id: 'team',
        label: 'Team',
        description: 'Collaborate with a small team',
        icon: lucide_react_1.Users,
    },
    {
        id: 'organization',
        label: 'Organization',
        description: 'For larger organizations with multiple teams',
        icon: lucide_react_1.Briefcase,
    },
    {
        id: 'enterprise',
        label: 'Enterprise',
        description: 'Advanced features and dedicated support',
        icon: lucide_react_1.Rocket,
    },
];
const PRIVACY_OPTIONS = [
    {
        id: 'private',
        label: 'Private',
        description: 'Only you and invited members can access',
        icon: lucide_react_1.Lock,
    },
    {
        id: 'team',
        label: 'Team',
        description: 'Accessible to your organization',
        icon: lucide_react_1.Users,
    },
    {
        id: 'public',
        label: 'Public',
        description: 'Anyone can view (for open-source projects)',
        icon: lucide_react_1.Globe,
    },
];
const WorkspaceSetup = ({ context, onDataChange, validationErrors = [], }) => {
    const [workspaceName, setWorkspaceName] = (0, react_1.useState)(context.data.workspaceName || '');
    const [workspaceType, setWorkspaceType] = (0, react_1.useState)(context.data.workspaceType || 'personal');
    const [privacy, setPrivacy] = (0, react_1.useState)(context.data.privacy || 'private');
    const [description, setDescription] = (0, react_1.useState)(context.data.workspaceDescription || '');
    const handleNameChange = (value) => {
        setWorkspaceName(value);
        onDataChange({ workspaceName: value });
    };
    const handleTypeChange = (value) => {
        setWorkspaceType(value);
        onDataChange({ workspaceType: value });
    };
    const handlePrivacyChange = (value) => {
        setPrivacy(value);
        onDataChange({ privacy: value });
    };
    const handleDescriptionChange = (value) => {
        setDescription(value);
        onDataChange({ workspaceDescription: value });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-workspace-setup", children: [(0, jsx_runtime_1.jsxs)("div", { className: "workspace-header", children: [(0, jsx_runtime_1.jsx)("h2", { className: "step-title", children: "Create Your Workspace" }), (0, jsx_runtime_1.jsx)("p", { className: "step-description", children: "Workspaces help you organize agents, projects, and team members" })] }), validationErrors.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "validation-errors", children: validationErrors.map((error, index) => ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error }, index))) })), (0, jsx_runtime_1.jsxs)("div", { className: "workspace-form", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { htmlFor: "workspace-name", className: "form-label", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Folder, { className: "w-4 h-4" }), "Workspace Name *"] }), (0, jsx_runtime_1.jsx)("input", { id: "workspace-name", type: "text", className: "form-input", placeholder: "My Workspace", value: workspaceName, onChange: (e) => handleNameChange(e.target.value), required: true }), (0, jsx_runtime_1.jsx)("p", { className: "form-hint", children: "Choose a name that describes your project or team" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Workspace Type *" }), (0, jsx_runtime_1.jsx)("div", { className: "type-grid", children: WORKSPACE_TYPES.map((type) => {
                                    const Icon = type.icon;
                                    const isSelected = workspaceType === type.id;
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: `type-card ${isSelected ? 'selected' : ''} ${type.recommended ? 'recommended' : ''}`, onClick: () => handleTypeChange(type.id), children: [type.recommended && (0, jsx_runtime_1.jsx)("div", { className: "recommended-badge", children: "Recommended" }), (0, jsx_runtime_1.jsx)("div", { className: "type-icon", children: (0, jsx_runtime_1.jsx)(Icon, { className: "w-6 h-6" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "type-label", children: type.label }), (0, jsx_runtime_1.jsx)("p", { className: "type-description", children: type.description })] }, type.id));
                                }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { className: "form-label", children: "Privacy Settings" }), (0, jsx_runtime_1.jsx)("div", { className: "privacy-options", children: PRIVACY_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    const isSelected = privacy === option.id;
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: `privacy-option ${isSelected ? 'selected' : ''}`, onClick: () => handlePrivacyChange(option.id), children: [(0, jsx_runtime_1.jsx)("div", { className: "privacy-icon", children: (0, jsx_runtime_1.jsx)(Icon, { className: "w-5 h-5" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "privacy-content", children: [(0, jsx_runtime_1.jsx)("h3", { className: "privacy-label", children: option.label }), (0, jsx_runtime_1.jsx)("p", { className: "privacy-description", children: option.description })] }), (0, jsx_runtime_1.jsx)("input", { type: "radio", name: "privacy", checked: isSelected, onChange: () => handlePrivacyChange(option.id), onClick: (e) => e.stopPropagation() })] }, option.id));
                                }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "description", className: "form-label", children: "Description (Optional)" }), (0, jsx_runtime_1.jsx)("textarea", { id: "description", className: "form-textarea", placeholder: "Describe what this workspace is for...", rows: 3, value: description, onChange: (e) => handleDescriptionChange(e.target.value) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "workspace-footer", children: (0, jsx_runtime_1.jsxs)("div", { className: "info-box", children: [(0, jsx_runtime_1.jsx)("p", { className: "info-title", children: "What's Next?" }), (0, jsx_runtime_1.jsxs)("ul", { className: "info-list", children: [(0, jsx_runtime_1.jsx)("li", { children: "Create your first AI agent" }), (0, jsx_runtime_1.jsx)("li", { children: "Invite team members to collaborate" }), (0, jsx_runtime_1.jsx)("li", { children: "Set up integrations and tools" })] })] }) })] }));
};
exports.WorkspaceSetup = WorkspaceSetup;
//# sourceMappingURL=WorkspaceSetup.js.map