import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/design-system';
import { User, UserService } from '@/services/UserService';
import { Users } from 'lucide-react';
import { useEffect, useState } from 'react';

// Simple Table Component if shared DataTable is complex to integrate without viewing,
// but let's try to build a clean Tailwind table here directly for guaranteed function.
const UserTable = ({
  users,
  onEdit,
  onDelete,
}: {
  users: User[];
  onEdit: (u: User) => void;
  onDelete: (id: string) => void;
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            User
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Role
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Created
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {users.map((user) => (
          <tr key={user.id}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {user.name.charAt(0)}
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                {user.role}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                  user.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {user.status}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {new Date(user.createdAt).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                onClick={() => onEdit(user)}
                className="text-indigo-600 hover:text-indigo-900 mr-4"
              >
                Edit
              </button>
              <button onClick={() => onDelete(user.id)} className="text-red-600 hover:text-red-900">
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await UserService.getUsers();
      setUsers(data ?? []);
    } catch (error) {
      console.error('Failed to load users', error);
      setUsers([]);
      setError('Failed to load users from the API.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await UserService.deleteUser(id);
      loadUsers();
    }
  };

  const handleEdit = (user: User) => {
    // Placeholder for edit modal
    console.log('Edit user', user);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            User Management
          </h1>
          <p className="text-gray-500">Manage system users and permissions</p>
        </div>
        <Button>Add User</Button>
      </div>

      <Card className="overflow-hidden">
        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-50 border-b border-red-100">{error}</div>
        )}
        {users.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No users returned by the API.</div>
        ) : (
          <UserTable users={users} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </Card>
    </div>
  );
};

export default UserManagement;
