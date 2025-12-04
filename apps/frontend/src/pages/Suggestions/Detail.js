import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThumbsUp, ThumbsDown, MessageSquare, Calendar, User, Tag, ChevronLeft, Send, CheckCircle, XCircle, Clock, Edit, Trash2, Lightbulb, History } from 'lucide-react';
// Mock data for suggestion details
var mockSuggestionDetails = {
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
var SuggestionDetail = function () {
    var id = useParams().id;
    var navigate = useNavigate();
    var _a = useState('details'), activeTab = _a[0], setActiveTab = _a[1];
    var _b = useState(''), newComment = _b[0], setNewComment = _b[1];
    var _c = useState(mockSuggestionDetails.votes.userVote), userVote = _c[0], setUserVote = _c[1];
    // In a real app, we would fetch the suggestion details based on the ID
    var suggestion = mockSuggestionDetails;
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
    // Format timestamp
    var formatTimestamp = function (timestamp) {
        var date = new Date(timestamp);
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
    var handleCommentSubmit = function (e) {
        e.preventDefault();
        if (!newComment.trim())
            return;
        console.log('New comment:', newComment);
        // In a real app, we would send this to the server
        // and update the comments list
        setNewComment('');
    };
    // Handle voting
    var handleVote = function (voteType) {
        // Toggle vote if clicking the same button
        if (userVote === voteType) {
            setUserVote(null);
        }
        else {
            setUserVote(voteType);
        }
        // In a real app, we would send this to the server
        console.log('Vote:', voteType);
    };
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 p-6 overflow-auto", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "flex items-center mb-6", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: function () { return navigate('/suggestions'); }, className: "mr-4", children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), "Back to Suggestions"] }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Suggestion Details" }), _jsx("p", { className: "text-muted-foreground", children: "View and discuss feature suggestions" })] })] }), _jsxs("div", { className: "flex flex-col lg:flex-row gap-6 mb-6", children: [_jsxs("div", { className: "lg:w-2/3", children: [_jsxs(Card, { className: "mb-6", children: [_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("h2", { className: "text-2xl font-bold", children: suggestion.title }), _jsx("div", { className: "flex items-center", children: getStatusBadge(suggestion.status) })] }), _jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-sm font-medium text-muted-foreground mb-2", children: "Description" }), _jsx("p", { className: "whitespace-pre-line", children: suggestion.description })] }), _jsx("div", { className: "flex flex-wrap gap-2 mb-6", children: suggestion.tags.map(function (tag, index) { return (_jsxs(Badge, { variant: "outline", className: "flex items-center", children: [_jsx(Tag, { className: "h-3 w-3 mr-1" }), tag] }, index)); }) }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Submitted By" }), _jsxs("p", { className: "font-medium flex items-center", children: [_jsx(User, { className: "h-3 w-3 mr-1" }), suggestion.submittedBy] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Submitted On" }), _jsxs("p", { className: "font-medium flex items-center", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), formatDate(suggestion.submittedAt)] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Category" }), _jsx("p", { className: "font-medium", children: suggestion.category })] })] })] }), _jsxs("div", { className: "px-6 py-4 bg-muted/50 flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("button", { className: "flex items-center ".concat(userVote === 'up' ? 'text-green-600' : 'text-gray-500', " hover:text-green-700"), onClick: function () { return handleVote('up'); }, children: [_jsx(ThumbsUp, { className: "h-4 w-4 mr-1" }), "Upvote (", suggestion.votes.upvotes, ")"] }), _jsxs("button", { className: "flex items-center ".concat(userVote === 'down' ? 'text-red-600' : 'text-gray-500', " hover:text-red-700"), onClick: function () { return handleVote('down'); }, children: [_jsx(ThumbsDown, { className: "h-4 w-4 mr-1" }), "Downvote (", suggestion.votes.downvotes, ")"] })] }), _jsx("div", { className: "flex items-center", children: _jsxs("span", { className: "text-sm text-muted-foreground mr-2", children: ["Net votes: ", suggestion.votes.upvotes - suggestion.votes.downvotes] }) })] })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "mb-6", children: [_jsxs(TabsList, { className: "mb-4", children: [_jsxs(TabsTrigger, { value: "details", children: [_jsx(Lightbulb, { className: "h-4 w-4 mr-2" }), "Details"] }), _jsxs(TabsTrigger, { value: "comments", children: [_jsx(MessageSquare, { className: "h-4 w-4 mr-2" }), "Comments (", suggestion.comments.length, ")"] }), _jsxs(TabsTrigger, { value: "history", children: [_jsx(History, { className: "h-4 w-4 mr-2" }), "History"] })] }), _jsx(TabsContent, { value: "details", className: "space-y-6", children: _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Related Suggestions" }), _jsx("div", { className: "space-y-2", children: suggestion.relatedSuggestions.map(function (related) { return (_jsxs("div", { className: "flex justify-between items-center p-2 border rounded-md", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: related.title }), _jsxs("div", { className: "text-xs text-muted-foreground flex items-center", children: [_jsx(ThumbsUp, { className: "h-3 w-3 mr-1" }), related.votes, " votes"] })] }), _jsxs("div", { className: "flex items-center", children: [getStatusBadge(related.status), _jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return navigate("/suggestions/".concat(related.id)); }, className: "ml-2", children: "View" })] })] }, related.id)); }) })] }) }) }), _jsx(TabsContent, { value: "comments", className: "space-y-6", children: _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Comments" }), _jsx("div", { className: "space-y-4 mb-6", children: suggestion.comments.map(function (comment) { return (_jsxs("div", { className: "flex space-x-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0", children: comment.authorAvatar }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center mb-1", children: [_jsx("span", { className: "font-medium mr-2", children: comment.author }), _jsx("span", { className: "text-xs text-muted-foreground ml-auto", children: formatTimestamp(comment.timestamp) })] }), _jsx("p", { className: "text-sm mb-2", children: comment.content }), _jsxs("div", { className: "flex items-center text-sm text-muted-foreground", children: [_jsx("button", { className: "flex items-center hover:text-green-600 mr-2", children: _jsx(ThumbsUp, { className: "h-3 w-3 mr-1", title: "Upvote comment" }) }), _jsx("span", { className: "sr-only", children: "Upvote comment" }), _jsx("span", { children: comment.votes }), _jsx("button", { className: "flex items-center hover:text-red-600 ml-2", title: "Downvote comment", children: _jsx(ThumbsDown, { className: "h-3 w-3" }) })] })] })] }, comment.id)); }) }), _jsxs("form", { onSubmit: handleCommentSubmit, children: [_jsx("div", { className: "mb-2", children: _jsx(Textarea, { placeholder: "Add a comment...", value: newComment, onChange: function (e) { return setNewComment(e.target.value); }, rows: 3 }) }), _jsx("div", { className: "flex justify-end", children: _jsxs(Button, { type: "submit", disabled: !newComment.trim(), children: [_jsx(Send, { className: "h-4 w-4 mr-2" }), "Post Comment"] }) })] })] }) }) }), _jsx(TabsContent, { value: "history", className: "space-y-6", children: _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Suggestion History" }), _jsx("div", { className: "space-y-4", children: suggestion.history.map(function (event, index) { return (_jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mr-3", children: _jsx(History, { className: "h-5 w-5 text-gray-600" }) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: event.action }), _jsxs("div", { className: "text-sm text-muted-foreground", children: ["By ", event.user, " on ", formatTimestamp(event.timestamp)] })] })] }, index)); }) })] }) }) })] })] }), _jsxs("div", { className: "lg:w-1/3", children: [_jsx(Card, { className: "mb-6", children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Actions" }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Button, { className: "w-full justify-start", onClick: function () { return navigate("/suggestions/".concat(id, "/edit")); }, children: [_jsx(Edit, { className: "h-4 w-4 mr-2" }), "Edit Suggestion"] }), suggestion.status === 'Under Review' && (_jsxs(_Fragment, { children: [_jsxs(Button, { className: "w-full justify-start", variant: "outline", children: [_jsx(CheckCircle, { className: "h-4 w-4 mr-2" }), "Approve Suggestion"] }), _jsxs(Button, { className: "w-full justify-start", variant: "outline", children: [_jsx(XCircle, { className: "h-4 w-4 mr-2" }), "Reject Suggestion"] })] })), suggestion.status === 'Approved' && (_jsxs(Button, { className: "w-full justify-start", variant: "outline", children: [_jsx(CheckCircle, { className: "h-4 w-4 mr-2" }), "Mark as Implemented"] })), _jsxs(Button, { className: "w-full justify-start", variant: "destructive", children: [_jsx(Trash2, { className: "h-4 w-4 mr-2" }), "Delete Suggestion"] })] })] }) }), _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Status Timeline" }), _jsxs("div", { className: "space-y-8 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gray-200 before:ml-0.5", children: [_jsxs("div", { className: "relative flex items-start", children: [_jsx("div", { className: "h-7 w-7 rounded-full border-2 border-green-500 bg-white flex items-center justify-center z-10", children: _jsx(CheckCircle, { className: "h-4 w-4 text-green-500" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("div", { className: "font-medium", children: "Submitted" }), _jsx("div", { className: "text-sm text-muted-foreground", children: formatDate(suggestion.submittedAt) })] })] }), _jsxs("div", { className: "relative flex items-start", children: [_jsx("div", { className: "h-7 w-7 rounded-full border-2 border-yellow-500 bg-white flex items-center justify-center z-10", children: _jsx(Clock, { className: "h-4 w-4 text-yellow-500" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("div", { className: "font-medium", children: "Under Review" }), _jsx("div", { className: "text-sm text-muted-foreground", children: formatDate(suggestion.history[1].timestamp) })] })] }), _jsxs("div", { className: "relative flex items-start opacity-50", children: [_jsx("div", { className: "h-7 w-7 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center z-10", children: _jsx(CheckCircle, { className: "h-4 w-4 text-gray-300" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("div", { className: "font-medium", children: "Approved" }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Pending" })] })] }), _jsxs("div", { className: "relative flex items-start opacity-50", children: [_jsx("div", { className: "h-7 w-7 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center z-10", children: _jsx(CheckCircle, { className: "h-4 w-4 text-gray-300" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("div", { className: "font-medium", children: "Implemented" }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Pending" })] })] })] })] }) })] })] })] }) })] }));
};
export default SuggestionDetail;
