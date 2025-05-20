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
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Lightbulb,
  Calendar,
  User,
  Tag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mock data for suggestions
const mockSuggestions = [
  {
    id: 1,
    title: 'Implement AI-powered code review',
    description: 'Create an AI agent that can automatically review code and provide suggestions for improvements.',
    status: 'Under Review',
    category: 'Development',
    votes: 42,
    comments: 8,
    submittedBy: 'John Doe',
    submittedAt: '2023-05-15',
    tags: ['AI', 'Code Quality', 'Automation'],
  },
  {
    id: 2,
    title: 'Add natural language search to documentation',
    description: 'Implement a natural language search feature for the documentation to make it easier for users to find what they need.',
    status: 'Approved',
    category: 'Documentation',
    votes: 38,
    comments: 5,
    submittedBy: 'Jane Smith',
    submittedAt: '2023-05-20',
    tags: ['Search', 'Documentation', 'User Experience'],
  },
  {
    id: 3,
    title: 'Create a visual workflow builder',
    description: 'Develop a drag-and-drop interface for creating agent workflows without writing code.',
    status: 'Implemented',
    category: 'User Interface',
    votes: 65,
    comments: 12,
    submittedBy: 'Mike Johnson',
    submittedAt: '2023-04-10',
    tags: ['UI', 'Workflow', 'No-Code'],
  },
  {
    id: 4,
    title: 'Integrate with third-party AI services',
    description: 'Add support for integrating with popular third-party AI services like OpenAI, Anthropic, and Cohere.',
    status: 'Submitted',
    category: 'Integration',
    votes: 27,
    comments: 3,
    submittedBy: 'Sarah Williams',
    submittedAt: '2023-06-01',
    tags: ['Integration', 'AI', 'Third-Party'],
  },
  {
    id: 5,
    title: 'Implement real-time collaboration features',
    description: 'Add real-time collaboration features to allow multiple users to work on the same project simultaneously.',
    status: 'Under Review',
    category: 'Collaboration',
    votes: 31,
    comments: 7,
    submittedBy: 'David Brown',
    submittedAt: '2023-05-25',
    tags: ['Collaboration', 'Real-Time', 'Multi-User'],
  },
  {
    id: 6,
    title: 'Create a mobile app for monitoring agents',
    description: 'Develop a mobile application that allows users to monitor and manage their agents on the go.',
    status: 'Submitted',
    category: 'Mobile',
    votes: 19,
    comments: 2,
    submittedBy: 'Emily Davis',
    submittedAt: '2023-06-05',
    tags: ['Mobile', 'Monitoring', 'Management'],
  },
  {
    id: 7,
    title: 'Add support for custom agent templates',
    description: 'Allow users to create and share custom agent templates to make it easier to create new agents.',
    status: 'Approved',
    category: 'Customization',
    votes: 45,
    comments: 9,
    submittedBy: 'Alex Wilson',
    submittedAt: '2023-05-18',
    tags: ['Templates', 'Customization', 'Sharing'],
  },
  {
    id: 8,
    title: 'Implement advanced analytics dashboard',
    description: 'Create a comprehensive analytics dashboard to provide insights into agent performance and usage.',
    status: 'Under Review',
    category: 'Analytics',
    votes: 33,
    comments: 6,
    submittedBy: 'Chris Taylor',
    submittedAt: '2023-05-30',
    tags: ['Analytics', 'Dashboard', 'Insights'],
  },
];

/**
 * Suggestions page component
 */
const Suggestions: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState('votes');
  
  // Filter suggestions based on search query and filters
  const filteredSuggestions = mockSuggestions.filter(suggestion => {
    const matchesSearch = suggestion.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         suggestion.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || suggestion.status === filterStatus;
    const matchesCategory = filterCategory === 'All' || suggestion.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });
  
  // Sort suggestions
  const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.votes - a.votes;
    } else if (sortBy === 'comments') {
      return b.comments - a.comments;
    } else if (sortBy === 'newest') {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    }
    return 0;
  });
  
  // Get unique suggestion statuses for filter
  const suggestionStatuses = ['All', ...new Set(mockSuggestions.map(suggestion => suggestion.status))];
  
  // Get unique suggestion categories for filter
  const suggestionCategories = ['All', ...new Set(mockSuggestions.map(suggestion => suggestion.category))];
  
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
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Feature Suggestions</h1>
              <p className="text-muted-foreground">Browse and submit feature suggestions</p>
            </div>
            <Button onClick={() => navigate('/suggestions/new')}>
              <Plus className="mr-2 h-4 w-4"/> Submit Suggestion
            </Button>
          </div>
          
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search suggestions..."
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
                  {suggestionStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
              <div className="relative">
                <select
                  className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {suggestionCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
              <div className="relative">
                <select
                  className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="votes">Most Votes</option>
                  <option value="comments">Most Comments</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Suggestions list */}
          <div className="space-y-4">
            {sortedSuggestions.map(suggestion => (
              <Card key={suggestion.id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{suggestion.title}</h3>
                    <div className="flex items-center">
                      {getStatusBadge(suggestion.status)}
                      <button className="ml-2 text-gray-500 hover:text-gray-700">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">{suggestion.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {suggestion.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                    <div>
                      <p className="text-muted-foreground">Votes</p>
                      <p className="font-medium flex items-center">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {suggestion.votes}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-muted/50 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center text-green-600 hover:text-green-700">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Upvote
                    </button>
                    <button className="flex items-center text-red-600 hover:text-red-700">
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      Downvote
                    </button>
                    <button className="flex items-center text-blue-600 hover:text-blue-700">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Comments ({suggestion.comments})
                    </button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/suggestions/${suggestion.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Empty state */}
          {sortedSuggestions.length === 0 && (
            <div className="text-center py-12">
              <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No suggestions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterStatus !== 'All' || filterCategory !== 'All'
                  ? "Try adjusting your search or filters"
                  : "Submit your first feature suggestion to get started"}
              </p>
              <Button onClick={() => navigate('/suggestions/new')}>
                <Plus className="mr-2 h-4 w-4"/> Submit Suggestion
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Suggestions;
