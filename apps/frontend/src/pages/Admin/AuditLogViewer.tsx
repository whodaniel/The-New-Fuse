import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  User,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: Date;
  type: 'user' | 'system' | 'security' | 'admin';
  action: string;
  user: string;
  ipAddress: string;
  resource: string;
  status: 'success' | 'warning' | 'error';
  details: string;
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, [dateRange, selectedType, selectedStatus]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: new Date(),
          type: 'security',
          action: 'Failed login attempt',
          user: 'unknown@example.com',
          ipAddress: '192.168.1.100',
          resource: '/api/auth/login',
          status: 'warning',
          details: 'Invalid credentials provided',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 5 * 60000),
          type: 'admin',
          action: 'User role updated',
          user: 'admin@example.com',
          ipAddress: '192.168.1.50',
          resource: '/api/admin/users/123',
          status: 'success',
          details: 'Changed user role from user to moderator',
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 10 * 60000),
          type: 'user',
          action: 'Password changed',
          user: 'john@example.com',
          ipAddress: '192.168.1.75',
          resource: '/api/users/profile',
          status: 'success',
          details: 'User successfully changed password',
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 15 * 60000),
          type: 'system',
          action: 'Database backup completed',
          user: 'system',
          ipAddress: '127.0.0.1',
          resource: '/backup/daily',
          status: 'success',
          details: 'Automated daily backup completed successfully',
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 30 * 60000),
          type: 'security',
          action: 'API rate limit exceeded',
          user: 'api-user@example.com',
          ipAddress: '203.0.113.42',
          resource: '/api/chat/messages',
          status: 'error',
          details: 'Rate limit exceeded: 1000 requests in 1 hour',
        },
      ];

      setLogs(mockLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || log.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: AuditLog['type']) => {
    const badges = {
      user: { bg: 'bg-blue-100', text: 'text-blue-800', icon: User },
      system: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Activity },
      security: { bg: 'bg-red-100', text: 'text-red-800', icon: Shield },
      admin: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Shield },
    };
    return badges[type];
  };

  const getStatusIcon = (status: AuditLog['status']) => {
    const icons = {
      success: <CheckCircle className="h-5 w-5 text-green-500" />,
      warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      error: <XCircle className="h-5 w-5 text-red-500" />,
    };
    return icons[status];
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <FileText className="h-8 w-8 mr-3 text-blue-600" />
              Audit Log Viewer
            </h1>
            <p className="text-gray-600">Track and monitor system activity and user actions</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadLogs}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Events</div>
          <div className="text-3xl font-bold text-gray-900">{logs.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Security Events</div>
          <div className="text-3xl font-bold text-red-600">
            {logs.filter((l) => l.type === 'security').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Admin Actions</div>
          <div className="text-3xl font-bold text-purple-600">
            {logs.filter((l) => l.type === 'admin').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Errors</div>
          <div className="text-3xl font-bold text-red-600">
            {logs.filter((l) => l.status === 'error').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="user">User</option>
              <option value="system">System</option>
              <option value="security">Security</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">Loading logs...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No logs found</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const typeBadge = getTypeBadge(log.type);
                  const TypeIcon = typeBadge.icon;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${typeBadge.bg} ${typeBadge.text}`}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {log.resource}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusIcon(log.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm">
              Previous
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Log Details</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Timestamp</div>
                <div className="text-lg font-medium">{selectedLog.timestamp.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Action</div>
                <div className="text-lg font-medium">{selectedLog.action}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">User</div>
                <div className="text-lg font-medium">{selectedLog.user}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">IP Address</div>
                <div className="text-lg font-mono">{selectedLog.ipAddress}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Resource</div>
                <div className="text-lg font-mono">{selectedLog.resource}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Details</div>
                <div className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedLog.details}</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
