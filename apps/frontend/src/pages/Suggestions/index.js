var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, MoreVertical, ThumbsUp, ThumbsDown, MessageSquare, Lightbulb, Calendar, User, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Mock data for suggestions
var mockSuggestions = [
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
var Suggestions = function () {
    var navigate = useNavigate();
    var _a = useState(''), searchQuery = _a[0], setSearchQuery = _a[1];
    var _b = useState('All'), filterStatus = _b[0], setFilterStatus = _b[1];
    var _c = useState('All'), filterCategory = _c[0], setFilterCategory = _c[1];
    var _d = useState('votes'), sortBy = _d[0], setSortBy = _d[1];
    // Filter suggestions based on search query and filters
    var filteredSuggestions = mockSuggestions.filter(function (suggestion) {
        var matchesSearch = suggestion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            suggestion.description.toLowerCase().includes(searchQuery.toLowerCase());
        var matchesStatus = filterStatus === 'All' || suggestion.status === filterStatus;
        var matchesCategory = filterCategory === 'All' || suggestion.category === filterCategory;
        return matchesSearch && matchesStatus && matchesCategory;
    });
    // Sort suggestions
    var sortedSuggestions = __spreadArray([], filteredSuggestions, true).sort(function (a, b) {
        if (sortBy === 'votes') {
            return b.votes - a.votes;
        }
        else if (sortBy === 'comments') {
            return b.comments - a.comments;
        }
        else if (sortBy === 'newest') {
            return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        }
        else if (sortBy === 'oldest') {
            return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        }
        return 0;
    });
    // Get unique suggestion statuses for filter
    var suggestionStatuses = __spreadArray(['All'], new Set(mockSuggestions.map(function (suggestion) { return suggestion.status; })), true);
    // Get unique suggestion categories for filter
    var suggestionCategories = __spreadArray(['All'], new Set(mockSuggestions.map(function (suggestion) { return suggestion.category; })), true);
    // Get status badge
    var getStatusBadge = function (status) {
        switch (status) {
            case 'Submitted':
                return (_jsx(Badge, { className: "bg-blue-100 text-blue-800 hover:bg-blue-100", children: status }));
            case 'Under Review':
                return (_jsx(Badge, { className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100", children: status }));
            case 'Approved':
                return (_jsx(Badge, { className: "bg-green-100 text-green-800 hover:bg-green-100", children: status }));
            case 'Implemented':
                return (_jsx(Badge, { className: "bg-purple-100 text-purple-800 hover:bg-purple-100", children: status }));
            case 'Rejected':
                return (_jsx(Badge, { className: "bg-red-100 text-red-800 hover:bg-red-100", children: status }));
            default:
                return _jsx(Badge, { children: status });
        }
    };
    // Format date
    var formatDate = function (dateString) {
        var date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 p-6 overflow-auto", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Feature Suggestions" }), _jsx("p", { className: "text-muted-foreground", children: "Browse and submit feature suggestions" })] }), _jsxs(Button, { onClick: function () { return navigate('/suggestions/new'); }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " Submit Suggestion"] })] }), _jsxs("div", { className: "flex flex-col md:flex-row gap-4 mb-6", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" }), _jsx(Input, { placeholder: "Search suggestions...", className: "pl-10", value: searchQuery, onChange: function (e) { return setSearchQuery(e.target.value); } })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs("div", { className: "relative", children: [_jsx("select", { className: "h-10 px-3 py-2 rounded-md border border-input bg-background text-sm", value: filterStatus, onChange: function (e) { return setFilterStatus(e.target.value); }, children: suggestionStatuses.map(function (status) { return (_jsx("option", { value: status, children: status }, status)); }) }), _jsx(Filter, { className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" })] }), _jsxs("div", { className: "relative", children: [_jsx("select", { className: "h-10 px-3 py-2 rounded-md border border-input bg-background text-sm", value: filterCategory, onChange: function (e) { return setFilterCategory(e.target.value); }, children: suggestionCategories.map(function (category) { return (_jsx("option", { value: category, children: category }, category)); }) }), _jsx(Filter, { className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" })] }), _jsx("div", { className: "relative", children: _jsxs("select", { className: "h-10 px-3 py-2 rounded-md border border-input bg-background text-sm", value: sortBy, onChange: function (e) { return setSortBy(e.target.value); }, children: [_jsx("option", { value: "votes", children: "Most Votes" }), _jsx("option", { value: "comments", children: "Most Comments" }), _jsx("option", { value: "newest", children: "Newest First" }), _jsx("option", { value: "oldest", children: "Oldest First" })] }) })] })] }), _jsx("div", { className: "space-y-4", children: sortedSuggestions.map(function (suggestion) { return (_jsxs(Card, { className: "overflow-hidden", children: [_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("h3", { className: "text-xl font-semibold", children: suggestion.title }), _jsxs("div", { className: "flex items-center", children: [getStatusBadge(suggestion.status), _jsx("button", { className: "ml-2 text-gray-500 hover:text-gray-700", children: _jsx(MoreVertical, { className: "h-4 w-4" }) })] })] }), _jsx("p", { className: "text-muted-foreground mb-4", children: suggestion.description }), _jsx("div", { className: "flex flex-wrap gap-2 mb-4", children: suggestion.tags.map(function (tag, index) { return (_jsxs(Badge, { variant: "outline", className: "flex items-center", children: [_jsx(Tag, { className: "h-3 w-3 mr-1" }), tag] }, index)); }) }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Submitted By" }), _jsxs("p", { className: "font-medium flex items-center", children: [_jsx(User, { className: "h-3 w-3 mr-1" }), suggestion.submittedBy] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Submitted On" }), _jsxs("p", { className: "font-medium flex items-center", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), formatDate(suggestion.submittedAt)] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Category" }), _jsx("p", { className: "font-medium", children: suggestion.category })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Votes" }), _jsxs("p", { className: "font-medium flex items-center", children: [_jsx(ThumbsUp, { className: "h-3 w-3 mr-1" }), suggestion.votes] })] })] })] }), _jsxs("div", { className: "px-6 py-4 bg-muted/50 flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("button", { className: "flex items-center text-green-600 hover:text-green-700", children: [_jsx(ThumbsUp, { className: "h-4 w-4 mr-1" }), "Upvote"] }), _jsxs("button", { className: "flex items-center text-red-600 hover:text-red-700", children: [_jsx(ThumbsDown, { className: "h-4 w-4 mr-1" }), "Downvote"] }), _jsxs("button", { className: "flex items-center text-blue-600 hover:text-blue-700", children: [_jsx(MessageSquare, { className: "h-4 w-4 mr-1" }), "Comments (", suggestion.comments, ")"] })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: function () { return navigate("/suggestions/".concat(suggestion.id)); }, children: "View Details" })] })] }, suggestion.id)); }) }), sortedSuggestions.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx(Lightbulb, { className: "mx-auto h-12 w-12 text-muted-foreground mb-4" }), _jsx("h3", { className: "text-lg font-medium mb-2", children: "No suggestions found" }), _jsx("p", { className: "text-muted-foreground mb-4", children: searchQuery || filterStatus !== 'All' || filterCategory !== 'All'
                                        ? "Try adjusting your search or filters"
                                        : "Submit your first feature suggestion to get started" }), _jsxs(Button, { onClick: function () { return navigate('/suggestions/new'); }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " Submit Suggestion"] })] }))] }) })] }));
};
export default Suggestions;
