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
    <div className="bg-transparent dark:bg-transparent rounded-md shadow-none-none overflow-hidden">
      <table className="min-w-full divide-y divide-border/50 dark:divide-border/40">
        <thead className="bg-transparent dark:bg-neutral-900">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              User
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Email
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Role
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-transparent dark:bg-transparent divide-y divide-border/50 dark:divide-border/40">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-transparent dark:hover:bg-muted/20">
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {user.name}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                {user.email}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <Badge variant="secondary">{user.role}</Badge>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                {user.status}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
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
