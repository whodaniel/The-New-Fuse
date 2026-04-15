import React from 'react';
import { useRoles } from '../../hooks/useRoles';
import { Permission } from '@the-new-fuse/types';
import { useToast } from '@/hooks/useToast';

export const RoleManager: React.FC = () => {
  const { roles, permissions, updateRolePermissions } = useRoles();
  const { toast } = useToast();

  const handlePermissionToggle = async (roleId: string, permission: Permission) => {
    try {
      await updateRolePermissions(roleId, permission);
      toast({
        title: 'Permission updated',
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error updating permission',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  return (
    <div className="overflow-x-auto bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
        <thead className="bg-neutral-50 dark:bg-neutral-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Role
            </th>
            {permissions.map((perm) => (
              <th
                key={perm}
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
              >
                {perm}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
          {roles.map((role: any) => (
            <tr key={role.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {role.name}
              </td>
              {permissions.map((perm) => (
                <td key={`${role.id}-${perm}`} className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handlePermissionToggle(role.id, perm)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      role.permissions.includes(perm)
                        ? 'bg-primary-600'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        role.permissions.includes(perm) ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

