import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Calendar,
  User,
  Tag,
  ChevronLeft,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Lightbulb,
  History
} from 'lucide-react';

// Mock data for suggestion details
const mockSuggestionDetails = {
  id: 1,
  title: 'Implement AI-powered code review',
  description: 'Create an AI agent that can automatically review code and provide suggestions for improvements. The agent should be able to identify common issues, suggest optimizations, and follow best practices for different programming languages.\n\nThis would save developers time and help maintain code quality across projects. The agent could integrate with existing version control systems like GitHub and GitLab.',
  status: 'Under Review',
  category: 'Development',
  votes: {
    upvotes: 42,
    downvotes: 5,
    userVote: 'up' // 'up', 'down', or null
  },
  comments: [
    {
      id: 1,
      author: 'John Doe',
      authorAvatar: 'JD',
      content: 'This would be a great addition to our toolset. I spend a lot of time on code reviews.',
      timestamp: '2023-05-16T10:30:00Z',
      votes: 8
    },
    {
      id: 2,
      author: 'Sarah Williams',
      authorAvatar: 'SW',
      content: 'I agree, but we should make sure it supports all the languages we use.',
      timestamp: '2023-05-16T14:15:00Z',
      votes: 5
    },
    {
      id: 3,
      author: 'Mike Johnson',
      authorAvatar: 'MJ',
      content: 'Could we also add the ability to automatically fix simple issues?',
      timestamp: '2023-05-17T09:45:00Z',
      votes: 12
    },
    {
      id: 4,
      author: 'Emily Davis',
      authorAvatar: 'ED',
      content: 'This would be especially useful for junior developers who are still learning best practices.',
      timestamp: '2023-05-18T11:20:00Z',
      votes: 7
    }
  ],
  submittedBy: 'John Doe',
  submittedAt: '2023-05-15',
  tags: ['AI', 'Code Quality', 'Automation'],
  history: [
    {
      action: 'Submitted',
      timestamp: '2023-05-15T14:30:00Z',
      user: 'John Doe'
    },
    {
      action: 'Status changed to Under Review',
      timestamp: '2023-05-16T09:15:00Z',
      user: 'Admin'
    },
    {
      action: 'Added tag: Automation',
      timestamp: '2023-05-16T09:20:00Z',
      user: 'Admin'
    }
  ],
  relatedSuggestions: [
    {
      id: 3,
      title: 'Create a visual workflow builder',
      status: 'Implemented',
      votes: 65
    },
    {
      id: 7,
      title: 'Add support for custom agent templates',
      status: 'Approved',
      votes: 45
    }
  ]
};

/**
 * Suggestion Detail page component
 */
const SuggestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(mockSuggestionDetails.votes.userVote as 'up' | 'down' | null);
  
  // In a real app, we would fetch the suggestion details based on the ID
  const suggestion = mockSuggestionDetails;
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            {status}
          </Badge>
        );
      case 'Under Review':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            {status}
          </Badge>
        );
      case 'Approved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            {status}
          </Badge>
        );
      case 'Implemented':
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            {status}
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            {status}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
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
  
  // Handle comment submission
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    console.log('New comment:', newComment);
    // In a real app, we would send this to the server
    // and update the comments list
    setNewComment('');
  };
  
  // Handle voting
  const handleVote = (voteType: 'up' | 'down') => {
    // Toggle vote if clicking the same button
    if (userVote === voteType) {
      setUserVote(null);
    } else {
      setUserVote(voteType);
    }
    
    // In a real app, we would send this to the server
    console.log('Vote:', voteType);
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
              onClick={() => navigate('/suggestions')}
              className="mr-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Suggestions
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Suggestion Details</h1>
              <p className="text-muted-foreground">View and discuss feature suggestions</p>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            <div className="lg:w-2/3">
              <Card className="mb-6">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold">{suggestion.title}</h2>
                    <div className="flex items-center">
                      {getStatusBadge(suggestion.status)}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                    <p className="whitespace-pre-line">{suggestion.description}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {suggestion.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Submitted By</p>
                      <p className="font-medium flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {suggestion.submittedBy}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Submitted On</p>
                      <p className="font-medium flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(suggestion.submittedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{suggestion.category}</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-muted/50 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <button 
                      className={`flex items-center ${userVote === 'up' ? 'text-green-600' : 'text-gray-500'} hover:text-green-700`}
                      onClick={() => handleVote('up')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Upvote ({suggestion.votes.upvotes})
                    </button>
                    <button 
                      className={`flex items-center ${userVote === 'down' ? 'text-red-600' : 'text-gray-500'} hover:text-red-700`}
                      onClick={() => handleVote('down')}
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      Downvote ({suggestion.votes.downvotes})
                    </button>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground mr-2">
                      Net votes: {suggestion.votes.upvotes - suggestion.votes.downvotes}
                    </span>
                  </div>
                </div>
              </Card>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="comments">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments ({suggestion.comments.length})
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-6">
                  <Card>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Related Suggestions</h3>
                      <div className="space-y-2">
                        {suggestion.relatedSuggestions.map((related) => (
                          <div key={related.id} className="flex justify-between items-center p-2 border rounded-md">
                            <div>
                              <div className="font-medium">{related.title}</div>
                              <div className="text-xs text-muted-foreground flex items-center">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                {related.votes} votes
                              </div>
                            </div>
                            <div className="flex items-center">
                              {getStatusBadge(related.status)}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/suggestions/${related.id}`)}
                                className="ml-2"
                              >
                                View
                              </Button>
                            </div>
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
                        {suggestion.comments.map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                              {comment.authorAvatar}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <span className="font-medium mr-2">{comment.author}</span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {formatTimestamp(comment.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm mb-2">{comment.content}</p>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <button className="flex items-center hover:text-green-600 mr-2">
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                </button>
                                <span>{comment.votes}</span>
                                <button className="flex items-center hover:text-red-600 ml-2">
                                  <ThumbsDown className="h-3 w-3" />
                                </button>
                              </div>
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
                      <h3 className="text-lg font-semibold mb-4">Suggestion History</h3>
                      <div className="space-y-4">
                        {suggestion.history.map((event, index) => (
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
                    <Button className="w-full justify-start" onClick={() => navigate(`/suggestions/${id}/edit`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Suggestion
                    </Button>
                    
                    {suggestion.status === 'Under Review' && (
                      <>
                        <Button className="w-full justify-start" variant="outline">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Suggestion
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Suggestion
                        </Button>
                      </>
                    )}
                    
                    {suggestion.status === 'Approved' && (
                      <Button className="w-full justify-start" variant="outline">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Implemented
                      </Button>
                    )}
                    
                    <Button className="w-full justify-start" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Suggestion
                    </Button>
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Status Timeline</h3>
                  <div className="space-y-8 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gray-200 before:ml-0.5">
                    <div className="relative flex items-start">
                      <div className="h-7 w-7 rounded-full border-2 border-green-500 bg-white flex items-center justify-center z-10">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium">Submitted</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(suggestion.submittedAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative flex items-start">
                      <div className="h-7 w-7 rounded-full border-2 border-yellow-500 bg-white flex items-center justify-center z-10">
                        <Clock className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium">Under Review</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(suggestion.history[1].timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative flex items-start opacity-50">
                      <div className="h-7 w-7 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center z-10">
                        <CheckCircle className="h-4 w-4 text-gray-300" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium">Approved</div>
                        <div className="text-sm text-muted-foreground">
                          Pending
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative flex items-start opacity-50">
                      <div className="h-7 w-7 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center z-10">
                        <CheckCircle className="h-4 w-4 text-gray-300" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium">Implemented</div>
                        <div className="text-sm text-muted-foreground">
                          Pending
                        </div>
                      </div>
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

export default SuggestionDetail;
