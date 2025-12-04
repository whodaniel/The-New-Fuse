import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, AlertTriangle, Calendar, Bot, MessageSquare, History, Edit, Trash2, Play, Pause, ChevronLeft, Send, FileText, Code, Link, Paperclip } from 'lucide-react';
// Mock data for task details
var mockTaskDetails = {
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
var TaskDetail = function () {
    var id = useParams().id;
    var navigate = useNavigate();
    var _a = useState('details'), activeTab = _a[0], setActiveTab = _a[1];
    var _b = useState(''), newComment = _b[0], setNewComment = _b[1];
    // In a real app, we would fetch the task details based on the ID
    var task = mockTaskDetails;
    // Get status badge
    var getStatusBadge = function (status) {
        switch (status) {
            case 'Completed':
                return (_jsxs(Badge, { className: "bg-green-100 text-green-800 hover:bg-green-100", children: [_jsx(CheckCircle, { className: "w-3 h-3 mr-1" }), status] }));
            case 'In Progress':
                return (_jsxs(Badge, { className: "bg-blue-100 text-blue-800 hover:bg-blue-100", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), status] }));
            case 'Pending Review':
                return (_jsxs(Badge, { className: "bg-purple-100 text-purple-800 hover:bg-purple-100", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), status] }));
            case 'Not Started':
                return (_jsxs(Badge, { className: "bg-gray-100 text-gray-800 hover:bg-gray-100", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), status] }));
            default:
                return _jsx(Badge, { children: status });
        }
    };
    // Get priority badge
    var getPriorityBadge = function (priority) {
        switch (priority) {
            case 'Critical':
                return (_jsxs(Badge, { className: "bg-red-100 text-red-800 hover:bg-red-100", children: [_jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }), priority] }));
            case 'High':
                return (_jsxs(Badge, { className: "bg-orange-100 text-orange-800 hover:bg-orange-100", children: [_jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }), priority] }));
            case 'Medium':
                return (_jsxs(Badge, { className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100", children: [_jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }), priority] }));
            case 'Normal':
                return (_jsxs(Badge, { className: "bg-blue-100 text-blue-800 hover:bg-blue-100", children: [_jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }), priority] }));
            case 'Low':
                return (_jsxs(Badge, { className: "bg-green-100 text-green-800 hover:bg-green-100", children: [_jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }), priority] }));
            default:
                return _jsx(Badge, { children: priority });
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
    // Calculate days remaining
    var getDaysRemaining = function (dueDate) {
        var today = new Date();
        var due = new Date(dueDate);
        var diffTime = due.getTime() - today.getTime();
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return _jsxs("span", { className: "text-red-600", children: ["Overdue by ", Math.abs(diffDays), " days"] });
        }
        else if (diffDays === 0) {
            return _jsx("span", { className: "text-orange-600", children: "Due today" });
        }
        else {
            return _jsxs("span", { children: [diffDays, " days remaining"] });
        }
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
    // Get file icon based on type
    var getFileIcon = function (type) {
        switch (type) {
            case 'document':
                return _jsx(FileText, { className: "h-4 w-4" });
            case 'code':
                return _jsx(Code, { className: "h-4 w-4" });
            case 'link':
                return _jsx(Link, { className: "h-4 w-4" });
            default:
                return _jsx(Paperclip, { className: "h-4 w-4" });
        }
    };
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 p-6 overflow-auto", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "flex items-center mb-6", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: function () { return navigate('/tasks'); }, className: "mr-4", children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), "Back to Tasks"] }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Task Details" }), _jsx("p", { className: "text-muted-foreground", children: "View and manage task information" })] })] }), _jsxs("div", { className: "flex flex-col lg:flex-row gap-6 mb-6", children: [_jsxs("div", { className: "lg:w-2/3", children: [_jsx(Card, { className: "mb-6", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("h2", { className: "text-2xl font-bold", children: task.title }), _jsxs("div", { className: "flex items-center space-x-2", children: [getStatusBadge(task.status), getPriorityBadge(task.priority)] })] }), _jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-sm font-medium text-muted-foreground mb-2", children: "Description" }), _jsx("p", { className: "whitespace-pre-line", children: task.description })] }), _jsx("div", { className: "flex flex-wrap gap-2 mb-6", children: task.tags.map(function (tag, index) { return (_jsx(Badge, { variant: "outline", children: tag }, index)); }) }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Assigned To" }), _jsxs("p", { className: "font-medium flex items-center", children: [_jsx("span", { className: "w-5 h-5 rounded-full bg-".concat(task.assignedColor, "-100 text-").concat(task.assignedColor, "-600 flex items-center justify-center text-xs mr-1"), children: task.assignedAvatar }), task.assignedTo] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Due Date" }), _jsxs("p", { className: "font-medium flex items-center", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), formatDate(task.dueDate)] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Time Remaining" }), _jsx("p", { className: "font-medium", children: getDaysRemaining(task.dueDate) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Category" }), _jsx("p", { className: "font-medium", children: task.category })] })] })] }) }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "mb-6", children: [_jsxs(TabsList, { className: "mb-4", children: [_jsxs(TabsTrigger, { value: "details", children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "Details"] }), _jsxs(TabsTrigger, { value: "comments", children: [_jsx(MessageSquare, { className: "h-4 w-4 mr-2" }), "Comments (", task.comments.length, ")"] }), _jsxs(TabsTrigger, { value: "history", children: [_jsx(History, { className: "h-4 w-4 mr-2" }), "History"] })] }), _jsxs(TabsContent, { value: "details", className: "space-y-6", children: [_jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Task Progress" }), _jsxs("div", { className: "mb-2 flex justify-between items-center", children: [_jsxs("span", { className: "text-sm font-medium", children: [task.progress, "% Complete"] }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [task.actualHours, " / ", task.estimatedHours, " hours"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2.5", children: _jsx("div", { className: "bg-blue-600 h-2.5 rounded-full", style: { width: "".concat(task.progress, "%") } }) })] }) }), _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Attachments" }), _jsx("div", { className: "space-y-2", children: task.attachments.map(function (attachment, index) { return (_jsxs("div", { className: "flex items-center p-2 border rounded-md", children: [_jsx("div", { className: "p-2 rounded-md bg-gray-100 mr-3", children: getFileIcon(attachment.type) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium", children: attachment.name }), _jsx("div", { className: "text-xs text-muted-foreground", children: attachment.size })] }), _jsx(Button, { variant: "ghost", size: "sm", children: "Download" })] }, index)); }) })] }) }), _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Related Tasks" }), _jsx("div", { className: "space-y-2", children: task.relatedTasks.map(function (relatedTask) { return (_jsxs("div", { className: "flex justify-between items-center p-2 border rounded-md", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: relatedTask.title }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["Assigned to: ", relatedTask.assignedTo] })] }), _jsx(Badge, { className: relatedTask.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                                                        relatedTask.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                                                            'bg-gray-100 text-gray-800', children: relatedTask.status })] }, relatedTask.id)); }) })] }) })] }), _jsx(TabsContent, { value: "comments", className: "space-y-6", children: _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Comments" }), _jsx("div", { className: "space-y-4 mb-6", children: task.comments.map(function (comment) { return (_jsxs("div", { className: "flex space-x-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full ".concat(comment.authorIsAgent ? "bg-blue-100 text-blue-600" : 'bg-gray-100 text-gray-600', " flex items-center justify-center shrink-0"), children: comment.authorAvatar }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center mb-1", children: [_jsx("span", { className: "font-medium mr-2", children: comment.author }), comment.authorIsAgent && (_jsxs(Badge, { className: "bg-blue-100 text-blue-800 hover:bg-blue-100", children: [_jsx(Bot, { className: "w-3 h-3 mr-1" }), "Agent"] })), _jsx("span", { className: "text-xs text-muted-foreground ml-auto", children: formatTimestamp(comment.timestamp) })] }), _jsx("p", { className: "text-sm", children: comment.content })] })] }, comment.id)); }) }), _jsxs("form", { onSubmit: handleCommentSubmit, children: [_jsx("div", { className: "mb-2", children: _jsx(Textarea, { placeholder: "Add a comment...", value: newComment, onChange: function (e) { return setNewComment(e.target.value); }, rows: 3 }) }), _jsx("div", { className: "flex justify-end", children: _jsxs(Button, { type: "submit", disabled: !newComment.trim(), children: [_jsx(Send, { className: "h-4 w-4 mr-2" }), "Post Comment"] }) })] })] }) }) }), _jsx(TabsContent, { value: "history", className: "space-y-6", children: _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Task History" }), _jsx("div", { className: "space-y-4", children: task.history.map(function (event, index) { return (_jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mr-3", children: _jsx(History, { className: "h-5 w-5 text-gray-600" }) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: event.action }), _jsxs("div", { className: "text-sm text-muted-foreground", children: ["By ", event.user, " on ", formatTimestamp(event.timestamp)] })] })] }, index)); }) })] }) }) })] })] }), _jsxs("div", { className: "lg:w-1/3", children: [_jsx(Card, { className: "mb-6", children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Actions" }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Button, { className: "w-full justify-start", onClick: function () { return navigate("/tasks/".concat(id, "/edit")); }, children: [_jsx(Edit, { className: "h-4 w-4 mr-2" }), "Edit Task"] }), task.status !== 'Completed' ? (_jsxs(Button, { className: "w-full justify-start", variant: "outline", children: [_jsx(CheckCircle, { className: "h-4 w-4 mr-2" }), "Mark as Completed"] })) : (_jsxs(Button, { className: "w-full justify-start", variant: "outline", children: [_jsx(Clock, { className: "h-4 w-4 mr-2" }), "Reopen Task"] })), task.status === 'In Progress' ? (_jsxs(Button, { className: "w-full justify-start", variant: "outline", children: [_jsx(Pause, { className: "h-4 w-4 mr-2" }), "Pause Task"] })) : (_jsxs(Button, { className: "w-full justify-start", variant: "outline", children: [_jsx(Play, { className: "h-4 w-4 mr-2" }), "Start Task"] })), _jsxs(Button, { className: "w-full justify-start", variant: "destructive", children: [_jsx(Trash2, { className: "h-4 w-4 mr-2" }), "Delete Task"] })] })] }) }), _jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Task Information" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Created By" }), _jsx("p", { className: "font-medium", children: task.createdBy })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Created On" }), _jsx("p", { className: "font-medium", children: formatDate(task.createdAt) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Estimated Hours" }), _jsxs("p", { className: "font-medium", children: [task.estimatedHours, " hours"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Actual Hours" }), _jsxs("p", { className: "font-medium", children: [task.actualHours, " hours"] })] })] })] }) })] })] })] }) })] }));
};
export default TaskDetail;
