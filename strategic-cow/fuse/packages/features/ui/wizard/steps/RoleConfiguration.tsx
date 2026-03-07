/**
 * Role Configuration Step
 *
 * Configure user roles and permissions for RBAC
 */

import { Check, Edit2, Shield, Trash2, UserPlus, Users } from 'lucide-react';
import React, { useState } from 'react';
import { WizardContext } from '../WizardSystem';

export interface RoleConfigurationProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  isCustom?: boolean;
  userCount: number;
}

const DEFAULT_ROLES: Role[] = [
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

export const RoleConfiguration: React.FC<RoleConfigurationProps> = ({
  context,
  onDataChange,
  validationErrors = [],
}) => {
  const [roles, setRoles] = useState<Role[]>((context.data.roles as Role[]) || DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId === selectedRole ? null : roleId);
    onDataChange({ selectedRole: roleId });
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) return;

    const newRole: Role = {
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

  const handleDeleteRole = (roleId: string) => {
    const updatedRoles = roles.filter((r) => r.id !== roleId);
    setRoles(updatedRoles);
    onDataChange({ roles: updatedRoles });
    if (selectedRole === roleId) {
      setSelectedRole(null);
    }
  };

  return (
    <div className="wizard-step-role-config">
      <div className="step-header">
        <Shield className="w-8 h-8 text-primary" />
        <h2 className="step-title">Configure Roles</h2>
        <p className="step-description">Set up user roles for your organization's access control</p>
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

      <div className="roles-container">
        <div className="roles-header">
          <h3>
            <Users className="w-5 h-5" /> Roles ({roles.length})
          </h3>
          <button className="add-role-btn" onClick={() => setIsAddingRole(true)}>
            <UserPlus className="w-4 h-4" />
            Add Custom Role
          </button>
        </div>

        {isAddingRole && (
          <div className="add-role-form">
            <input
              type="text"
              placeholder="Role name"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="form-input"
            />
            <input
              type="text"
              placeholder="Description"
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
              className="form-input"
            />
            <div className="form-actions">
              <button onClick={handleAddRole} className="save-btn">
                <Check className="w-4 h-4" /> Save
              </button>
              <button onClick={() => setIsAddingRole(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="roles-list">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <div className="role-icon">
                <Shield className="w-5 h-5" />
              </div>
              <div className="role-content">
                <div className="role-header">
                  <h4 className="role-name">
                    {role.name}
                    {role.isDefault && <span className="default-badge">Default</span>}
                    {role.isCustom && <span className="custom-badge">Custom</span>}
                  </h4>
                  <span className="user-count">{role.userCount} users</span>
                </div>
                <p className="role-description">{role.description}</p>
              </div>
              <div className="role-actions">
                <button
                  className="action-btn edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Would open edit modal
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {role.isCustom && (
                  <button
                    className="action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRole(role.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="step-tips">
        <h4>Role Hierarchy</h4>
        <p>Roles are hierarchical. Higher roles inherit permissions from lower roles:</p>
        <div className="hierarchy-diagram">
          <span className="hierarchy-level">Super Admin</span>
          <span className="hierarchy-arrow">→</span>
          <span className="hierarchy-level">Admin</span>
          <span className="hierarchy-arrow">→</span>
          <span className="hierarchy-level">Agency Owner</span>
          <span className="hierarchy-arrow">→</span>
          <span className="hierarchy-level">...</span>
          <span className="hierarchy-arrow">→</span>
          <span className="hierarchy-level">User</span>
        </div>
      </div>
    </div>
  );
};
