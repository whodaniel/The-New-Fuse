import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Bot,
  MessageSquare,
  History,
  Edit,
  Trash2,
  Play,
  Pause,
  ChevronLeft,
  Send,
  FileText,
  Code,
  Link,
  Paperclip
} from 'lucide-react';

// Mock data for task details
const mockTaskDetails = {
  id: 1,
  title: 'Implement new API endpoint',
  description: 'Create a new REST API endpoint for user authentication that supports both username/password and OAuth flows. The endpoint should validate inputs, handle errors appropriately, and return standardized responses.',
  status: 'In Progress',
  priority: 'High',
  dueDate: '2023-06-15',
  assignedTo: 'CodeAssistant',
  assignedAvatar: 'CA',
  assignedColor: 'blue',
  category: 'Development',
  createdAt: '2023-06-01',
  createdBy: 'John Doe',
  estimatedHours: 4,
  actualHours: 2.5,
  progress: 60,
  tags: ['API', 'Authentication', 'Backend'],
  attachments: [
    { name: 'api-spec.md', type: 'document', size: '24KB', url: '#' },
    { name: 'auth-flow.png', type: 'image', size: '156KB', url: '#' }
  ],
  comments: [
    {
      id: 1,
      author: 'John Doe',
      authorAvatar: 'JD',
      content: 'Make sure to follow the API design guidelines for error responses.',
      timestamp: '2023-06-02T10:30:00Z'
    },
    {
      id: 2,
      author: 'CodeAssistant',
      authorAvatar: 'CA',
      authorIsAgent: true,
      content: 'I\'ve started implementing the endpoint. I\'ll make sure to follow the guidelines for error responses.',
      timestamp: '2023-06-02T11:15:00Z'
    },
    {
      id: 3,
      author: 'Sarah Williams',
      authorAvatar: 'SW',
      content: 'Don\'t forget to add rate limiting to prevent abuse.',
      timestamp: '2023-06-03T09:45:00Z'
    },
    {
      id: 4,
      author: 'CodeAssistant',
      authorAvatar: 'CA',
      authorIsAgent: true,
      content: 'Good point. I\'ve added rate limiting with a configurable threshold.',
      timestamp: '2023-06-03T10:20:00Z'
    }
  ],
  history: [
    {
      action: 'Created',
      timestamp: '2023-06-01T14:30:00Z',
      user: 'John Doe'
    },
    {
      action: 'Assigned to CodeAssistant',
      timestamp: '2023-06-01T14:35:00Z',
      user: 'John Doe'
    },
    {
      action: 'Status changed to In Progress',
      timestamp: '2023-06-02T09:15:00Z',
      user: 'CodeAssistant'
    },
    {
      action: 'Progress updated to 30%',
      timestamp: '2023-06-02T16:45:00Z',
      user: 'CodeAssistant'
    },
    {
      action: 'Progress updated to 60%',
      timestamp: '2023-06-03T11:30:00Z',
      user: 'CodeAssistant'
    }
  ],
  relatedTasks: [
    {
      id: 5,
      title: 'Update API documentation',
      status: 'Not Started',
      assignedTo: 'ContentWriter'
    },
    {
      id: 8,
      title: 'Write tests for new API endpoint',
      status: 'Not Started',
      assignedTo: 'CodeAssistant'
    }
  ]
};

/**
 * Task Detail page component
 */
const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  
  // In a real app, we would fetch the task details based on the ID
  const task = mockTaskDetails;
  
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
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
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
  
  // Handle comment submission
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    console.log('New comment:', newComment);
    // In a real app, we would send this to the server
    // and update the comments list
    setNewComment('');
  };
  
  // Get file icon based on type
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      case 'link':
        return <Link className="h-4 w-4" />;
      default:
        return <Paperclip className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tasks')}
              className="mr-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Tasks
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Task Details</h1>
              <p className="text-muted-foreground">View and manage task information</p>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            <div className="lg:w-2/3">
              <Card className="mb-6">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold">{task.title}</h2>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                    <p className="whitespace-pre-line">{task.description}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {task.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Assigned To</p>
                      <p className="font-medium flex items-center">
                        <span className={`w-5 h-5 rounded-full bg-${task.assignedColor}-100 text-${task.assignedColor}-600 flex items-center justify-center text-xs mr-1`}>
                          {task.assignedAvatar}
                        </span>
                        {task.assignedTo}
                      </p>
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
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{task.category}</p>
                    </div>
                  </div>
                </div>
              </Card>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">
                    <FileText className="h-4 w-4 mr-2" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="comments">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments ({task.comments.length})
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-6">
                  <Card>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Task Progress</h3>
                      <div className="mb-2 flex justify-between items-center">
                        <span className="text-sm font-medium">{task.progress}% Complete</span>
                        <span className="text-sm text-muted-foreground">
                          {task.actualHours} / {task.estimatedHours} hours
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Attachments</h3>
                      <div className="space-y-2">
                        {task.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center p-2 border rounded-md">
                            <div className="p-2 rounded-md bg-gray-100 mr-3">
                              {getFileIcon(attachment.type)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{attachment.name}</div>
                              <div className="text-xs text-muted-foreground">{attachment.size}</div>
                            </div>
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Related Tasks</h3>
                      <div className="space-y-2">
                        {task.relatedTasks.map((relatedTask) => (
                          <div key={relatedTask.id} className="flex justify-between items-center p-2 border rounded-md">
                            <div>
                              <div className="font-medium">{relatedTask.title}</div>
                              <div className="text-xs text-muted-foreground">
                                Assigned to: {relatedTask.assignedTo}
                              </div>
                            </div>
                            <Badge
                              className={
                                relatedTask.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                relatedTask.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {relatedTask.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="comments" className="space-y-6">
                  <Card>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Comments</h3>
                      <div className="space-y-4 mb-6">
                        {task.comments.map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <div className={`w-8 h-8 rounded-full ${comment.authorIsAgent ? `bg-blue-100 text-blue-600` : 'bg-gray-100 text-gray-600'} flex items-center justify-center shrink-0`}>
                              {comment.authorAvatar}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <span className="font-medium mr-2">{comment.author}</span>
                                {comment.authorIsAgent && (
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                    <Bot className="w-3 h-3 mr-1" />
                                    Agent
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {formatTimestamp(comment.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <form onSubmit={handleCommentSubmit}>
                        <div className="mb-2">
                          <Textarea
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit" disabled={!newComment.trim()}>
                            <Send className="h-4 w-4 mr-2" />
                            Post Comment
                          </Button>
                        </div>
                      </form>
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="history" className="space-y-6">
                  <Card>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Task History</h3>
                      <div className="space-y-4">
                        {task.history.map((event, index) => (
                          <div key={index} className="flex items-start">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mr-3">
                              <History className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium">{event.action}</div>
                              <div className="text-sm text-muted-foreground">
                                By {event.user} on {formatTimestamp(event.timestamp)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="lg:w-1/3">
              <Card className="mb-6">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Actions</h3>
                  <div className="space-y-2">
                    <Button className="w-full justify-start" onClick={() => navigate(`/tasks/${id}/edit`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Task
                    </Button>
                    
                    {task.status !== 'Completed' ? (
                      <Button className="w-full justify-start" variant="outline">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </Button>
                    ) : (
                      <Button className="w-full justify-start" variant="outline">
                        <Clock className="h-4 w-4 mr-2" />
                        Reopen Task
                      </Button>
                    )}
                    
                    {task.status === 'In Progress' ? (
                      <Button className="w-full justify-start" variant="outline">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Task
                      </Button>
                    ) : (
                      <Button className="w-full justify-start" variant="outline">
                        <Play className="h-4 w-4 mr-2" />
                        Start Task
                      </Button>
                    )}
                    
                    <Button className="w-full justify-start" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Task
                    </Button>
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Task Information</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Created By</p>
                      <p className="font-medium">{task.createdBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created On</p>
                      <p className="font-medium">{formatDate(task.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Hours</p>
                      <p className="font-medium">{task.estimatedHours} hours</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Actual Hours</p>
                      <p className="font-medium">{task.actualHours} hours</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskDetail;
