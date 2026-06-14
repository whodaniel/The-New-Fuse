"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionMatrix = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Permission Matrix Step
 *
 * Configure detailed permissions for each role
 */
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const PERMISSIONS = [
    // Agent permissions
    {
        id: 'agent:create',
        name: 'Create Agents',
        category: 'Agents',
        description: 'Create new AI agents',
    },
    {
        id: 'agent:read',
        name: 'View Agents',
        category: 'Agents',
        description: 'View agent configurations',
    },
    {
        id: 'agent:update',
        name: 'Update Agents',
        category: 'Agents',
        description: 'Modify agent settings',
    },
    {
        id: 'agent:delete',
        name: 'Delete Agents',
        category: 'Agents',
        description: 'Remove agents',
        dangerous: true,
    },
    { id: 'agent:execute', name: 'Execute Agents', category: 'Agents', description: 'Run AI agents' },
    // User permissions
    { id: 'user:create', name: 'Create Users', category: 'Users', description: 'Create new users' },
    { id: 'user:read', name: 'View Users', category: 'Users', description: 'View user profiles' },
    {
        id: 'user:update',
        name: 'Update Users',
        category: 'Users',
        description: 'Modify user details',
    },
    {
        id: 'user:delete',
        name: 'Delete Users',
        category: 'Users',
        description: 'Remove users',
        dangerous: true,
    },
    {
        id: 'user:assign_role',
        name: 'Assign Roles',
        category: 'Users',
        description: 'Assign roles to users',
    },
    // Workspace permissions
    {
        id: 'workspace:create',
        name: 'Create Workspaces',
        category: 'Workspaces',
        description: 'Create workspaces',
    },
    {
        id: 'workspace:read',
        name: 'View Workspaces',
        category: 'Workspaces',
        description: 'View workspaces',
    },
    {
        id: 'workspace:update',
        name: 'Update Workspaces',
        category: 'Workspaces',
        description: 'Modify workspaces',
    },
    {
        id: 'workspace:delete',
        name: 'Delete Workspaces',
        category: 'Workspaces',
        description: 'Remove workspaces',
        dangerous: true,
    },
    // Tool permissions
    {
        id: 'tool:browser',
        name: 'Browser Tools',
        category: 'Tools',
        description: 'Use browser automation',
    },
    {
        id: 'tool:filesystem',
        name: 'File System',
        category: 'Tools',
        description: 'Access file system',
    },
    {
        id: 'tool:shell',
        name: 'Shell Commands',
        category: 'Tools',
        description: 'Execute shell commands',
        dangerous: true,
    },
    {
        id: 'tool:database',
        name: 'Database Access',
        category: 'Tools',
        description: 'Query databases',
    },
    // Admin permissions
    {
        id: 'admin:settings',
        name: 'System Settings',
        category: 'Admin',
        description: 'Configure system settings',
    },
    {
        id: 'admin:billing',
        name: 'Billing',
        category: 'Admin',
        description: 'Access billing information',
    },
    { id: 'admin:audit', name: 'Audit Logs', category: 'Admin', description: 'View audit logs' },
    { id: 'admin:deploy', name: 'Deployments', category: 'Admin', description: 'Manage deployments' },
];
const DEFAULT_ROLES = [
    'super_admin',
    'admin',
    'agency_owner',
    'agency_admin',
    'agent_operator',
    'user',
];
const CATEGORIES = [...new Set(PERMISSIONS.map((p) => p.category))];
// Default permission grants
const DEFAULT_GRANTS = {
    super_admin: PERMISSIONS.map((p) => p.id),
    admin: PERMISSIONS.filter((p) => !p.id.startsWith('admin:')).map((p) => p.id),
    agency_owner: [
        'agent:create',
        'agent:read',
        'agent:update',
        'agent:delete',
        'agent:execute',
        'user:read',
        'user:update',
        'workspace:create',
        'workspace:read',
        'workspace:update',
        'workspace:delete',
        'tool:browser',
        'tool:filesystem',
        'tool:database',
    ],
    agency_admin: [
        'agent:create',
        'agent:read',
        'agent:update',
        'agent:execute',
        'user:read',
        'workspace:read',
        'workspace:update',
        'tool:browser',
        'tool:filesystem',
    ],
    agent_operator: ['agent:read', 'agent:execute', 'workspace:read', 'tool:browser'],
    user: ['agent:read', 'workspace:read'],
};
const PermissionMatrix = ({ context, onDataChange, validationErrors = [], }) => {
    const [rolePermissions, setRolePermissions] = (0, react_1.useState)(() => {
        const stored = context.data.rolePermissions;
        if (stored)
            return stored;
        // Initialize from defaults
        const initial = [];
        DEFAULT_ROLES.forEach((roleId) => {
            PERMISSIONS.forEach((permission) => {
                initial.push({
                    roleId,
                    permissionId: permission.id,
                    granted: DEFAULT_GRANTS[roleId]?.includes(permission.id) || false,
                });
            });
        });
        return initial;
    });
    const [filterCategory, setFilterCategory] = (0, react_1.useState)(null);
    const [showDangerousOnly, setShowDangerousOnly] = (0, react_1.useState)(false);
    const filteredPermissions = (0, react_1.useMemo)(() => {
        let filtered = PERMISSIONS;
        if (filterCategory) {
            filtered = filtered.filter((p) => p.category === filterCategory);
        }
        if (showDangerousOnly) {
            filtered = filtered.filter((p) => p.dangerous);
        }
        return filtered;
    }, [filterCategory, showDangerousOnly]);
    const togglePermission = (roleId, permissionId) => {
        setRolePermissions((prev) => {
            const existing = prev.find((rp) => rp.roleId === roleId && rp.permissionId === permissionId);
            let updated;
            if (existing) {
                updated = prev.map((rp) => rp.roleId === roleId && rp.permissionId === permissionId
                    ? { ...rp, granted: !rp.granted }
                    : rp);
            }
            else {
                updated = [...prev, { roleId, permissionId, granted: true }];
            }
            onDataChange({ rolePermissions: updated });
            return updated;
        });
    };
    const isPermissionGranted = (roleId, permissionId) => {
        const rp = rolePermissions.find((rp) => rp.roleId === roleId && rp.permissionId === permissionId);
        return rp?.granted || false;
    };
    const grantAllToRole = (roleId) => {
        setRolePermissions((prev) => {
            const updated = [...prev];
            filteredPermissions.forEach((permission) => {
                const existing = updated.find((rp) => rp.roleId === roleId && rp.permissionId === permission.id);
                if (existing) {
                    existing.granted = true;
                }
                else {
                    updated.push({ roleId, permissionId: permission.id, granted: true });
                }
            });
            onDataChange({ rolePermissions: updated });
            return updated;
        });
    };
    const revokeAllFromRole = (roleId) => {
        setRolePermissions((prev) => {
            const updated = prev.map((rp) => rp.roleId === roleId && filteredPermissions.some((p) => p.id === rp.permissionId)
                ? { ...rp, granted: false }
                : rp);
            onDataChange({ rolePermissions: updated });
            return updated;
        });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-permission-matrix", children: [(0, jsx_runtime_1.jsxs)("div", { className: "step-header", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Lock, { className: "w-8 h-8 text-primary" }), (0, jsx_runtime_1.jsx)("h2", { className: "step-title", children: "Permission Matrix" }), (0, jsx_runtime_1.jsx)("p", { className: "step-description", children: "Configure detailed permissions for each role" })] }), validationErrors.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "validation-errors", children: validationErrors.map((error, index) => ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error }, index))) })), (0, jsx_runtime_1.jsxs)("div", { className: "matrix-controls", children: [(0, jsx_runtime_1.jsxs)("div", { className: "filter-group", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Filter, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsxs)("select", { value: filterCategory || '', onChange: (e) => setFilterCategory(e.target.value || null), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Categories" }), CATEGORIES.map((cat) => ((0, jsx_runtime_1.jsx)("option", { value: cat, children: cat }, cat)))] })] }), (0, jsx_runtime_1.jsxs)("label", { className: "toggle-filter", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: showDangerousOnly, onChange: (e) => setShowDangerousOnly(e.target.checked) }), (0, jsx_runtime_1.jsx)(lucide_react_1.Shield, { className: "w-4 h-4" }), "Dangerous Only"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "matrix-container", children: (0, jsx_runtime_1.jsxs)("table", { className: "permission-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "permission-header", children: "Permission" }), DEFAULT_ROLES.map((role) => ((0, jsx_runtime_1.jsxs)("th", { className: "role-header", children: [(0, jsx_runtime_1.jsx)("span", { className: "role-name", children: role.replace(/_/g, ' ') }), (0, jsx_runtime_1.jsxs)("div", { className: "role-actions", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => grantAllToRole(role), title: "Grant all", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-3 h-3" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => revokeAllFromRole(role), title: "Revoke all", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-3 h-3" }) })] })] }, role)))] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filteredPermissions.map((permission) => ((0, jsx_runtime_1.jsxs)("tr", { className: permission.dangerous ? 'dangerous' : '', children: [(0, jsx_runtime_1.jsx)("td", { className: "permission-cell", children: (0, jsx_runtime_1.jsxs)("div", { className: "permission-info", children: [(0, jsx_runtime_1.jsxs)("span", { className: "permission-name", children: [permission.name, permission.dangerous && (0, jsx_runtime_1.jsx)(lucide_react_1.Shield, { className: "w-3 h-3 danger-icon" })] }), (0, jsx_runtime_1.jsx)("span", { className: "permission-category", children: permission.category })] }) }), DEFAULT_ROLES.map((role) => ((0, jsx_runtime_1.jsx)("td", { className: `grant-cell ${isPermissionGranted(role, permission.id) ? 'granted' : 'denied'}`, onClick: () => togglePermission(role, permission.id), children: isPermissionGranted(role, permission.id) ? ((0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-4 h-4" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-4 h-4" })) }, role)))] }, permission.id))) })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "step-tips", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Permission Guidelines" }), (0, jsx_runtime_1.jsxs)("ul", { children: [(0, jsx_runtime_1.jsx)("li", { children: "\uD83D\uDD34 Dangerous permissions are marked with a shield icon" }), (0, jsx_runtime_1.jsx)("li", { children: "Higher roles should have more permissions than lower roles" }), (0, jsx_runtime_1.jsx)("li", { children: "Shell command access should be restricted to admins only" }), (0, jsx_runtime_1.jsx)("li", { children: "Review permissions regularly to maintain security" })] })] })] }));
};
exports.PermissionMatrix = PermissionMatrix;
//# sourceMappingURL=PermissionMatrix.js.map