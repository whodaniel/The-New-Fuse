import {
  Check,
  Edit,
  Eye,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Unlock,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'moderator' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  lastLogin: Date;
  emailVerified: boolean;
  workspaces: number;
  agents: number;
}

interface ApiUserResponse {
  id: string;
  email: string;
  name?: string;
  username?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  emailVerified?: boolean;
  workspaceCount: number;
  agentCount: number;
}

export default function UserManagementFull() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState({ active: 0, inactive: 0, admins: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?page=${page}&limit=${limit}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform API response to match UI interface
      const transformedUsers: User[] = (data.data as ApiUserResponse[]).map((apiUser) => ({
        id: apiUser.id,
        email: apiUser.email,
        name: apiUser.name || apiUser.username || 'Unknown',
        role: apiUser.role.toLowerCase() as User['role'],
        status: apiUser.isActive ? 'active' : 'inactive',
        createdAt: new Date(apiUser.createdAt),
        lastLogin: apiUser.lastLogin ? new Date(apiUser.lastLogin) : new Date(apiUser.createdAt),
        emailVerified: apiUser.emailVerified || false,
        workspaces: apiUser.workspaceCount ?? 0,
        agents: apiUser.agentCount ?? 0,
      }));

      setUsers(transformedUsers);
      setTotalUsers(data.pagination?.total || transformedUsers.length);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, limit]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: User['role']) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      moderator: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800',
    };
    return badges[role];
  };

  const getStatusBadge = (status: User['status']) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return badges[status];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatLastLogin = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete user: ${response.statusText}`);
        }

        // Remove from local state
        setUsers(users.filter((u) => u.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.size === 0) return;
    setIsProcessing(true);
    try {
      const ids = Array.from(selectedUsers);
      let response;

      if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ${ids.length} users?`)) return;
        response = await fetch('/api/admin/users/bulk-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ ids }),
        });
      } else if (action === 'activate' || action === 'suspend') {
        const isActive = action === 'activate';
        response = await fetch('/api/admin/users/bulk-status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ ids, isActive }),
        });
      }

      if (response && response.ok) {
        await loadUsers();
        setSelectedUsers(new Set());
      } else {
        throw new Error('Bulk action failed');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Failed to perform action. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) throw new Error('Failed to create user');

      setShowCreateModal(false);
      await loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) throw new Error('Failed to update user');

      setShowEditModal(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 max-w-[1600px] mx-auto bg-transparent min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Users className="h-8 w-8 mr-3 text-blue-600" />
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage users, roles, and permissions across the platform
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadUsers}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-muted/20 flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm p-6 transition-all hover:shadow-md hover:translate-y-[-2px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Total Users
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalUsers}</p>
            </div>
            <div className="h-14 w-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm p-6 transition-all hover:shadow-md hover:translate-y-[-2px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Active
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.active}</p>
            </div>
            <div className="h-14 w-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm p-6 transition-all hover:shadow-md hover:translate-y-[-2px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Admins
              </p>
              <p className="text-3xl font-extrabold text-violet-600 mt-1">{stats.admins}</p>
            </div>
            <div className="h-14 w-14 bg-violet-500/10 rounded-2xl flex items-center justify-center">
              <Shield className="h-8 w-8 text-violet-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm p-6 transition-all hover:shadow-md hover:translate-y-[-2px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Inactive
              </p>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">{stats.inactive}</p>
            </div>
            <div className="h-14 w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center">
              <UserX className="h-8 w-8 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-transparent rounded-md shadow-none p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-foreground">
                {selectedUsers.size} user(s) selected
              </span>
              <button
                onClick={() => handleBulkAction('activate')}
                className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Unlock className="h-3 w-3 inline mr-1" />
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="text-sm px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                <Lock className="h-3 w-3 inline mr-1" />
                Suspend
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                <Trash2 className="h-3 w-3 inline mr-1" />
                Delete
              </button>
            </div>
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="text-sm text-muted-foreground hover:text-gray-800"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-transparent rounded-md shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border/50">
            <thead className="bg-transparent">
              <tr>
                <th className="px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.size === filteredUsers.length && filteredUsers.length > 0
                    }
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Workspaces/Agents
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading users...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-muted-foreground">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {user.name}
                            {user.emailVerified && (
                              <Check className="h-4 w-4 text-green-500 ml-1" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(user.status)}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground">
                      {user.workspaces} / {user.agents}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground">
                      {formatLastLogin(user.lastLogin)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-transparent px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <span className="text-sm text-muted-foreground font-medium">
            Showing <span className="text-foreground font-bold">{filteredUsers.length}</span> of{' '}
            <span className="text-foreground font-bold">{totalUsers}</span> users
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(5, Math.ceil(totalUsers / limit)))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3.5 py-2 text-sm font-bold rounded-lg transition-all ${
                      page === pageNum
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(totalUsers / limit)}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <UserModal
          title="Create New User"
          isProcessing={isProcessing}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateUser}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <UserModal
          title="Edit User"
          user={selectedUser}
          isProcessing={isProcessing}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSave={(data) => handleUpdateUser(selectedUser.id, data)}
        />
      )}
    </div>
  );
}

interface UserModalProps {
  title: string;
  user?: User;
  onClose: () => void;
  onSave: (data: any) => void;
  isProcessing: boolean;
}

function UserModal({ title, user, onClose, onSave, isProcessing }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'user',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="john@example.com"
            />
          </div>
          {!user && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Initial Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">
              System Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="pt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center"
            >
              {isProcessing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {user ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
