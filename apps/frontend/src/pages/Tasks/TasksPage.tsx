import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  assigneeAvatar?: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  progress: number;
  workspaceId: string;
  workspaceName: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');

  // Mock data - replace with API call
  useEffect(() => {
    setTimeout(() => {
      setTasks([
        {
          id: '1',
          title: 'Implement user authentication system',
          description: 'Create a secure authentication system with JWT tokens and password hashing',
          status: 'in-progress',
          priority: 'high',
          assignee: 'John Doe',
          assigneeAvatar: '👤',
          dueDate: '2024-01-20T00:00:00Z',
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          tags: ['backend', 'security', 'authentication'],
          progress: 65,
          workspaceId: 'ws1',
          workspaceName: 'Development Team'
        },
        {
          id: '2',
          title: 'Design new landing page',
          description: 'Create a modern, responsive landing page design with improved conversion rates',
          status: 'pending',
          priority: 'medium',
          assignee: 'Jane Smith',
          assigneeAvatar: '👩',
          dueDate: '2024-01-25T00:00:00Z',
          createdAt: '2024-01-12T00:00:00Z',
          updatedAt: '2024-01-14T00:00:00Z',
          tags: ['design', 'frontend', 'ui/ux'],
          progress: 0,
          workspaceId: 'ws2',
          workspaceName: 'Design Team'
        },
        {
          id: '3',
          title: 'Setup CI/CD pipeline',
          description: 'Configure automated testing and deployment pipeline using GitHub Actions',
          status: 'completed',
          priority: 'high',
          assignee: 'Bob Wilson',
          assigneeAvatar: '👨',
          dueDate: '2024-01-15T00:00:00Z',
          createdAt: '2024-01-05T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          tags: ['devops', 'automation', 'deployment'],
          progress: 100,
          workspaceId: 'ws1',
          workspaceName: 'Development Team'
        },
        {
          id: '4',
          title: 'Write API documentation',
          description: 'Document all API endpoints with examples and schema definitions',
          status: 'in-progress',
          priority: 'medium',
          assignee: 'Alice Johnson',
          assigneeAvatar: '👩‍💻',
          dueDate: '2024-01-30T00:00:00Z',
          createdAt: '2024-01-08T00:00:00Z',
          updatedAt: '2024-01-16T00:00:00Z',
          tags: ['documentation', 'api', 'backend'],
          progress: 40,
          workspaceId: 'ws1',
          workspaceName: 'Development Team'
        },
        {
          id: '5',
          title: 'Conduct user research',
          description: 'Interview 20 users to understand pain points and feature requests',
          status: 'pending',
          priority: 'urgent',
          assignee: 'Carol Brown',
          assigneeAvatar: '👩‍🎨',
          dueDate: '2024-01-18T00:00:00Z',
          createdAt: '2024-01-14T00:00:00Z',
          updatedAt: '2024-01-16T00:00:00Z',
          tags: ['research', 'user-experience', 'product'],
          progress: 10,
          workspaceId: 'ws3',
          workspaceName: 'Product Team'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚫';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in-progress': return '⚡';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '⚫';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'progress':
        return b.progress - a.progress;
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const tasksByStatus = {
    pending: sortedTasks.filter(t => t.status === 'pending'),
    'in-progress': sortedTasks.filter(t => t.status === 'in-progress'),
    completed: sortedTasks.filter(t => t.status === 'completed'),
    cancelled: sortedTasks.filter(t => t.status === 'cancelled')
  };

  const handleTaskAction = (taskId: string, action: string) => {
    console.log(`Performing ${action} on task ${taskId}`);
    // TODO: Implement API calls for task actions
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Tasks Management</h1>
            <p className="text-gray-600">Organize and track all your tasks and project work</p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/tasks/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Create Task
            </Link>
            <Link
              to="/workflows"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              🔄 Workflows
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="text-2xl text-blue-600 mr-3">📋</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              <p className="text-sm text-gray-600">Total Tasks</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="text-2xl text-yellow-600 mr-3">⏳</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'pending').length}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="text-2xl text-blue-600 mr-3">⚡</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'in-progress').length}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="text-2xl text-green-600 mr-3">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'completed').length}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="progress">Progress</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📊 Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Tasks Content */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {task.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(task.status)}`}>
                        {getStatusIcon(task.status)} {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityBadge(task.priority)}`}>
                        {getPriorityIcon(task.priority)} {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-xl mr-2">{task.assigneeAvatar}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{task.assignee}</div>
                          <div className="text-xs text-gray-500">{task.workspaceName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{task.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 text-xs"
                        >
                          View
                        </Link>
                        <Link
                          to={`/tasks/${task.id}/edit`}
                          className="text-green-600 hover:text-green-900 px-2 py-1 text-xs"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleTaskAction(task.id, 'delete')}
                          className="text-red-600 hover:text-red-900 px-2 py-1 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 capitalize">
                  {getStatusIcon(status as Task['status'])} {status.replace('-', ' ')}
                </h3>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {statusTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {statusTasks.map((task) => (
                  <div key={task.id} className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="font-medium text-sm text-gray-900 mb-1">{task.title}</div>
                    <div className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(task.priority)}`}>
                        {getPriorityIcon(task.priority)}
                      </span>
                      <div className="text-xs text-gray-500">{task.assigneeAvatar}</div>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full" 
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {sortedTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
          <Link
            to="/tasks/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Task
          </Link>
        </div>
      )}
    </div>
  );
}
