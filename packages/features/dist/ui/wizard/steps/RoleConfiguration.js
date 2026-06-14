"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleConfiguration = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Role Configuration Step
 *
 * Configure user roles and permissions for RBAC
 */
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const DEFAULT_ROLES = [
    {
        id: 'super_admin',
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        isDefault: true,
        userCount: 1,
    },
    {
        id: 'admin',
        name: 'Admin',
        description: 'Manage users, agents, and settings',
        isDefault: true,
        userCount: 2,
    },
    {
        id: 'agency_owner',
        name: 'Agency Owner',
        description: 'Full access to agency resources and billing',
        isDefault: true,
        userCount: 3,
    },
    {
        id: 'agency_admin',
        name: 'Agency Admin',
        description: 'Manage agency users and agents',
        isDefault: true,
        userCount: 5,
    },
    {
        id: 'agency_manager',
        name: 'Agency Manager',
        description: 'Manage team and projects within agency',
        isDefault: true,
        userCount: 8,
    },
    {
        id: 'agent_operator',
        name: 'Agent Operator',
        description: 'Operate and monitor AI agents',
        isDefault: true,
        userCount: 15,
    },
    {
        id: 'user',
        name: 'User',
        description: 'Basic access to assigned resources',
        isDefault: true,
        userCount: 42,
    },
];
const RoleConfiguration = ({ context, onDataChange, validationErrors = [], }) => {
    const [roles, setRoles] = (0, react_1.useState)(context.data.roles || DEFAULT_ROLES);
    const [selectedRole, setSelectedRole] = (0, react_1.useState)(null);
    const [isAddingRole, setIsAddingRole] = (0, react_1.useState)(false);
    const [newRoleName, setNewRoleName] = (0, react_1.useState)('');
    const [newRoleDescription, setNewRoleDescription] = (0, react_1.useState)('');
    const handleRoleSelect = (roleId) => {
        setSelectedRole(roleId === selectedRole ? null : roleId);
        onDataChange({ selectedRole: roleId });
    };
    const handleAddRole = () => {
        if (!newRoleName.trim())
            return;
        const newRole = {
            id: newRoleName.toLowerCase().replace(/\s+/g, '_'),
            name: newRoleName,
            description: newRoleDescription,
            isCustom: true,
            userCount: 0,
        };
        const updatedRoles = [...roles, newRole];
        setRoles(updatedRoles);
        onDataChange({ roles: updatedRoles });
        setNewRoleName('');
        setNewRoleDescription('');
        setIsAddingRole(false);
    };
    const handleDeleteRole = (roleId) => {
        const updatedRoles = roles.filter((r) => r.id !== roleId);
        setRoles(updatedRoles);
        onDataChange({ roles: updatedRoles });
        if (selectedRole === roleId) {
            setSelectedRole(null);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-role-config", children: [(0, jsx_runtime_1.jsxs)("div", { className: "step-header", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Shield, { className: "w-8 h-8 text-primary" }), (0, jsx_runtime_1.jsx)("h2", { className: "step-title", children: "Configure Roles" }), (0, jsx_runtime_1.jsx)("p", { className: "step-description", children: "Set up user roles for your organization's access control" })] }), validationErrors.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "validation-errors", children: validationErrors.map((error, index) => ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error }, index))) })), (0, jsx_runtime_1.jsxs)("div", { className: "roles-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: "roles-header", children: [(0, jsx_runtime_1.jsxs)("h3", { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "w-5 h-5" }), " Roles (", roles.length, ")"] }), (0, jsx_runtime_1.jsxs)("button", { className: "add-role-btn", onClick: () => setIsAddingRole(true), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserPlus, { className: "w-4 h-4" }), "Add Custom Role"] })] }), isAddingRole && ((0, jsx_runtime_1.jsxs)("div", { className: "add-role-form", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Role name", value: newRoleName, onChange: (e) => setNewRoleName(e.target.value), className: "form-input" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Description", value: newRoleDescription, onChange: (e) => setNewRoleDescription(e.target.value), className: "form-input" }), (0, jsx_runtime_1.jsxs)("div", { className: "form-actions", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: handleAddRole, className: "save-btn", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-4 h-4" }), " Save"] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsAddingRole(false), className: "cancel-btn", children: "Cancel" })] })] })), (0, jsx_runtime_1.jsx)("div", { className: "roles-list", children: roles.map((role) => ((0, jsx_runtime_1.jsxs)("div", { className: `role-card ${selectedRole === role.id ? 'selected' : ''}`, onClick: () => handleRoleSelect(role.id), children: [(0, jsx_runtime_1.jsx)("div", { className: "role-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Shield, { className: "w-5 h-5" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "role-content", children: [(0, jsx_runtime_1.jsxs)("div", { className: "role-header", children: [(0, jsx_runtime_1.jsxs)("h4", { className: "role-name", children: [role.name, role.isDefault && (0, jsx_runtime_1.jsx)("span", { className: "default-badge", children: "Default" }), role.isCustom && (0, jsx_runtime_1.jsx)("span", { className: "custom-badge", children: "Custom" })] }), (0, jsx_runtime_1.jsxs)("span", { className: "user-count", children: [role.userCount, " users"] })] }), (0, jsx_runtime_1.jsx)("p", { className: "role-description", children: role.description })] }), (0, jsx_runtime_1.jsxs)("div", { className: "role-actions", children: [(0, jsx_runtime_1.jsx)("button", { className: "action-btn edit", onClick: (e) => {
                                                e.stopPropagation();
                                                // Would open edit modal
                                            }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { className: "w-4 h-4" }) }), role.isCustom && ((0, jsx_runtime_1.jsx)("button", { className: "action-btn delete", onClick: (e) => {
                                                e.stopPropagation();
                                                handleDeleteRole(role.id);
                                            }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "w-4 h-4" }) }))] })] }, role.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "step-tips", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Role Hierarchy" }), (0, jsx_runtime_1.jsx)("p", { children: "Roles are hierarchical. Higher roles inherit permissions from lower roles:" }), (0, jsx_runtime_1.jsxs)("div", { className: "hierarchy-diagram", children: [(0, jsx_runtime_1.jsx)("span", { className: "hierarchy-level", children: "Super Admin" }), (0, jsx_runtime_1.jsx)("span", { className: "hierarchy-arrow", children: "\u2192" }), (0, jsx_runtime_1.jsx)("span", { className: "hierarchy-level", children: "Admin" }), (0, jsx_runtime_1.jsx)("span", { className: "hierarchy-arrow", children: "\u2192" }), (0, jsx_runtime_1.jsx)("span", { className: "hierarchy-level", children: "Agency Owner" }), (0, jsx_runtime_1.jsx)("span", { className: "hierarchy-arrow", children: "\u2192" }), (0, jsx_runtime_1.jsx)("span", { className: "hierarchy-level", children: "..." }), (0, jsx_runtime_1.jsx)("span", { className: "hierarchy-arrow", children: "\u2192" }), (0, jsx_runtime_1.jsx)("span", { className: "hierarchy-level", children: "User" })] })] })] }));
};
exports.RoleConfiguration = RoleConfiguration;
//# sourceMappingURL=RoleConfiguration.js.map