import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  Bot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mock data for tasks
const mockTasks = [
  {
    id: 1,
    title: 'Implement new API endpoint',
    description: 'Create a new REST API endpoint for user authentication',
    status: 'In Progress',
    priority: 'High',
    dueDate: '2023-06-15',
    assignedTo: 'CodeAssistant',
    category: 'Development',
    createdAt: '2023-06-01',
  },
  {
    id: 2,
    title: 'Analyze user behavior data',
    description: 'Generate insights from the latest user behavior data',
    status: 'Completed',
    priority: 'Medium',
    dueDate: '2023-06-12',
    assignedTo: 'DataAnalyzer',
    category: 'Analytics',
    createdAt: '2023-06-02',
  },
  {
    id: 3,
    title: 'Write documentation for new features',
    description: 'Create comprehensive documentation for the latest features',
    status: 'Pending Review',
    priority: 'Normal',
    dueDate: '2023-06-18',
    assignedTo: 'ContentWriter',
    category: 'Documentation',
    createdAt: '2023-06-05',
  },
  {
    id: 4,
    title: 'Fix authentication bug',
    description: 'Resolve the issue with user authentication in the mobile app',
    status: 'In Progress',
    priority: 'Critical',
    dueDate: '2023-06-14',
    assignedTo: 'BugHunter',
    category: 'Bug Fixing',
    createdAt: '2023-06-07',
  },
  {
    id: 5,
    title: 'Optimize database queries',
    description: 'Improve performance of slow database queries',
    status: 'Not Started',
    priority: 'Medium',
    dueDate: '2023-06-20',
    assignedTo: 'CodeAssistant',
    category: 'Performance',
    createdAt: '2023-06-08',
  },
  {
    id: 6,
    title: 'Update privacy policy',
    description: 'Update the privacy policy to comply with new regulations',
    status: 'Completed',
    priority: 'High',
    dueDate: '2023-06-10',
    assignedTo: 'ContentWriter',
    category: 'Legal',
    createdAt: '2023-06-03',
  },
  {
    id: 7,
    title: 'Integrate third-party payment gateway',
    description: 'Integrate with the new payment gateway for international transactions',
    status: 'In Progress',
    priority: 'High',
    dueDate: '2023-06-22',
    assignedTo: 'APIIntegrator',
    category: 'Integration',
    createdAt: '2023-06-09',
  },
  {
    id: 8,
    title: 'Create user onboarding flow',
    description: 'Design and implement a new user onboarding experience',
    status: 'Not Started',
    priority: 'Medium',
    dueDate: '2023-06-25',
    assignedTo: 'CodeAssistant',
    category: 'UX',
    createdAt: '2023-06-10',
  },
];

/**
 * Tasks page component
 */
const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');
  
  // Filter tasks based on search query and filters
  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
    const matchesAssignee = filterAssignee === 'All' || task.assignedTo === filterAssignee;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });
  
  // Get unique task statuses for filter
  const taskStatuses = ['All', ...new Set(mockTasks.map(task => task.status))];
  
  // Get unique task priorities for filter
  const taskPriorities = ['All', ...new Set(mockTasks.map(task => task.priority))];
  
  // Get unique assignees for filter
  const taskAssignees = ['All', ...new Set(mockTasks.map(task => task.assignedTo))];
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'In Progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'Pending Review':
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'Not Started':
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {priority}
          </Badge>
        );
      case 'High':
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {priority}
          </Badge>
        );
      case 'Medium':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {priority}
          </Badge>
        );
      case 'Normal':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {priority}
          </Badge>
        );
      case 'Low':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {priority}
          </Badge>
        );
      default:
        return <Badge>{priority}</Badge>;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Calculate days remaining
  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="text-red-600">Overdue by {Math.abs(diffDays)} days</span>;
    } else if (diffDays === 0) {
      return <span className="text-orange-600">Due today</span>;
    } else {
      return <span>{diffDays} days remaining</span>;
    }
  };
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Tasks</h1>
              <p className="text-muted-foreground">Manage and track agent tasks</p>
            </div>
            <Button onClick={() => navigate('/tasks/new')}>
              <Plus className="mr-2 h-4 w-4"/> Create Task
            </Button>
          </div>
          
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tasks..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select
                  className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  {taskStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
              <div className="relative">
                <select
                  className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  {taskPriorities.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
              <div className="relative">
                <select
                  className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                >
                  {taskAssignees.map(assigne(e: any) => (
                    <option key={assignee} value={assignee}>{assignee}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
            </div>
          </div>
          
          {/* Tasks list */}
          <div className="space-y-4">
            {filteredTasks.map(task => (
              <Card key={task.id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{task.title}</h3>
                    <div className="flex items-center">
                      <button className="text-gray-500 hover:text-gray-700">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">{task.description}</p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                      {task.category}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Assigned To</p>
                      <p className="font-medium flex items-center">
                        <Bot className="h-3 w-3 mr-1" />
                        {task.assignedTo}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{formatDate(task.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p className="font-medium flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(task.dueDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time Remaining</p>
                      <p className="font-medium">{getDaysRemaining(task.dueDate)}</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-muted/50 flex justify-end items-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mr-2"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => navigate(`/tasks/${task.id}/edit`)}
                  >
                    Edit Task
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Empty state */}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterStatus !== 'All' || filterPriority !== 'All' || filterAssignee !== 'All'
                  ? "Try adjusting your search or filters"
                  : "Create your first task to get started"}
              </p>
              <Button onClick={() => navigate('/tasks/new')}>
                <Plus className="mr-2 h-4 w-4"/> Create Task
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Tasks;
