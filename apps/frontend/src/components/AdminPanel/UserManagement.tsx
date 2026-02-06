import { Badge, Button } from '@/components/ui/design-system';
import { useToast } from '@/hooks/useToast';
import React from 'react';
import { useUsers } from '../../hooks/useUsers';

export const UserManagement: React.FC = () => {
  const { users, updateUserStatus, loading } = useUsers();
  const { toast } = useToast();

  const handleStatusUpdate = async (userId: string, status: string) => {
    try {
      await updateUserStatus(userId, status);
      toast({ title: 'User status updated', variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to update user', variant: 'destructive' });
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
        <thead className="bg-neutral-50 dark:bg-neutral-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {user.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                {user.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant="secondary">{user.role}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                {user.status}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleStatusUpdate(user.id, user.status === 'active' ? 'inactive' : 'active')
                  }
                  disabled={loading}
                >
                  {user.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
