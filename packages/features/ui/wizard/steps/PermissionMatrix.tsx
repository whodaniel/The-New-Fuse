/**
 * Permission Matrix Step
 *
 * Configure detailed permissions for each role
 */

import { Check, Filter, Lock, Shield, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { WizardContext } from '../WizardSystem.js';

export interface PermissionMatrixProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  dangerous?: boolean;
}

interface RolePermission {
  roleId: string;
  permissionId: string;
  granted: boolean;
}

const PERMISSIONS: Permission[] = [
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
const DEFAULT_GRANTS: Record<string, string[]> = {
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

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  context,
  onDataChange,
  validationErrors = [],
}) => {
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => {
    const stored = context.data.rolePermissions as RolePermission[];
    if (stored) return stored;

    // Initialize from defaults
    const initial: RolePermission[] = [];
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

  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showDangerousOnly, setShowDangerousOnly] = useState(false);

  const filteredPermissions = useMemo(() => {
    let filtered = PERMISSIONS;
    if (filterCategory) {
      filtered = filtered.filter((p) => p.category === filterCategory);
    }
    if (showDangerousOnly) {
      filtered = filtered.filter((p) => p.dangerous);
    }
    return filtered;
  }, [filterCategory, showDangerousOnly]);

  const togglePermission = (roleId: string, permissionId: string) => {
    setRolePermissions((prev) => {
      const existing = prev.find((rp) => rp.roleId === roleId && rp.permissionId === permissionId);
      let updated: RolePermission[];

      if (existing) {
        updated = prev.map((rp) =>
          rp.roleId === roleId && rp.permissionId === permissionId
            ? { ...rp, granted: !rp.granted }
            : rp
        );
      } else {
        updated = [...prev, { roleId, permissionId, granted: true }];
      }

      onDataChange({ rolePermissions: updated });
      return updated;
    });
  };

  const isPermissionGranted = (roleId: string, permissionId: string): boolean => {
    const rp = rolePermissions.find(
      (rp) => rp.roleId === roleId && rp.permissionId === permissionId
    );
    return rp?.granted || false;
  };

  const grantAllToRole = (roleId: string) => {
    setRolePermissions((prev) => {
      const updated = [...prev];
      filteredPermissions.forEach((permission) => {
        const existing = updated.find(
          (rp) => rp.roleId === roleId && rp.permissionId === permission.id
        );
        if (existing) {
          existing.granted = true;
        } else {
          updated.push({ roleId, permissionId: permission.id, granted: true });
        }
      });
      onDataChange({ rolePermissions: updated });
      return updated;
    });
  };

  const revokeAllFromRole = (roleId: string) => {
    setRolePermissions((prev) => {
      const updated = prev.map((rp) =>
        rp.roleId === roleId && filteredPermissions.some((p) => p.id === rp.permissionId)
          ? { ...rp, granted: false }
          : rp
      );
      onDataChange({ rolePermissions: updated });
      return updated;
    });
  };

  return (
    <div className="wizard-step-permission-matrix">
      <div className="step-header">
        <Lock className="w-8 h-8 text-primary" />
        <h2 className="step-title">Permission Matrix</h2>
        <p className="step-description">Configure detailed permissions for each role</p>
      </div>

      {validationErrors.length > 0 && (
        <div className="validation-errors">
          {validationErrors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}

      <div className="matrix-controls">
        <div className="filter-group">
          <Filter className="w-4 h-4" />
          <select
            value={filterCategory || ''}
            onChange={(e) => setFilterCategory(e.target.value || null)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <label className="toggle-filter">
          <input
            type="checkbox"
            checked={showDangerousOnly}
            onChange={(e) => setShowDangerousOnly(e.target.checked)}
          />
          <Shield className="w-4 h-4" />
          Dangerous Only
        </label>
      </div>

      <div className="matrix-container">
        <table className="permission-table">
          <thead>
            <tr>
              <th className="permission-header">Permission</th>
              {DEFAULT_ROLES.map((role) => (
                <th key={role} className="role-header">
                  <span className="role-name">{role.replace(/_/g, ' ')}</span>
                  <div className="role-actions">
                    <button onClick={() => grantAllToRole(role)} title="Grant all">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={() => revokeAllFromRole(role)} title="Revoke all">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredPermissions.map((permission) => (
              <tr key={permission.id} className={permission.dangerous ? 'dangerous' : ''}>
                <td className="permission-cell">
                  <div className="permission-info">
                    <span className="permission-name">
                      {permission.name}
                      {permission.dangerous && <Shield className="w-3 h-3 danger-icon" />}
                    </span>
                    <span className="permission-category">{permission.category}</span>
                  </div>
                </td>
                {DEFAULT_ROLES.map((role) => (
                  <td
                    key={role}
                    className={`grant-cell ${isPermissionGranted(role, permission.id) ? 'granted' : 'denied'}`}
                    onClick={() => togglePermission(role, permission.id)}
                  >
                    {isPermissionGranted(role, permission.id) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="step-tips">
        <h4>Permission Guidelines</h4>
        <ul>
          <li>🔴 Dangerous permissions are marked with a shield icon</li>
          <li>Higher roles should have more permissions than lower roles</li>
          <li>Shell command access should be restricted to admins only</li>
          <li>Review permissions regularly to maintain security</li>
        </ul>
      </div>
    </div>
  );
};
