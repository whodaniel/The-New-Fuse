import { useToast } from '@/hooks/useToast';
import { Permission } from '@the-new-fuse/types';
import React from 'react';
import { useRoles } from '../../hooks/useRoles';

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
    <div className="overflow-x-auto bg-transparent dark:bg-transparent rounded-md shadow-none-none">
      <table className="min-w-full divide-y divide-border/50 dark:divide-border/40">
        <thead className="bg-transparent dark:bg-neutral-900">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Role
            </th>
            {permissions.map((perm) => (
              <th
                key={perm}
                className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider"
              >
                {perm}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-transparent dark:bg-transparent divide-y divide-border/50 dark:divide-border/40">
          {roles.map((role: any) => (
            <tr key={role.id} className="hover:bg-transparent dark:hover:bg-muted/20">
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {role.name}
              </td>
              {permissions.map((perm) => (
                <td key={`${role.id}-${perm}`} className="px-3 py-2 whitespace-nowrap">
                  <button
                    onClick={() => handlePermissionToggle(role.id, perm)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      role.permissions.includes(perm)
                        ? 'bg-primary-600'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-transparent transition-transform ${
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
