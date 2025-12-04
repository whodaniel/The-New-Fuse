var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, X, ChevronLeft, Plus, Calendar, Clock, Tag, Paperclip } from 'lucide-react';
// Mock data for agents
var mockAgents = [
    { id: 1, name: 'CodeAssistant', avatar: 'CA' },
    { id: 2, name: 'DataAnalyzer', avatar: 'DA' },
    { id: 3, name: 'ContentWriter', avatar: 'CW' },
    { id: 4, name: 'BugHunter', avatar: 'BH' },
    { id: 5, name: 'APIIntegrator', avatar: 'AI' }
];
/**
 * New Task page component
 */
var NewTask = function () {
    var navigate = useNavigate();
    // Form state
    var _a = useState({
        title: '',
        description: '',
        status: 'not_started',
        priority: 'medium',
        category: 'development',
        assignedTo: '',
        dueDate: '',
        estimatedHours: '',
        tags: [],
        newTag: ''
    }), formData = _a[0], setFormData = _a[1];
    // Handle input change
    var handleInputChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
        });
    };
    // Handle tag input
    var handleTagKeyDown = function (e) {
        if (e.key === 'Enter' && formData.newTag.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(formData.newTag.trim())) {
                setFormData(function (prev) { return (__assign(__assign({}, prev), { tags: __spreadArray(__spreadArray([], prev.tags, true), [prev.newTag.trim()], false), newTag: '' })); });
            }
        }
    };
    // Remove tag
    var removeTag = function (tagToRemove) {
        setFormData(function (prev) { return (__assign(__assign({}, prev), { tags: prev.tags.filter(function (tag) { return tag !== tagToRemove; }) })); });
    };
    // Handle form submission
    var handleSubmit = function (e) {
        e.preventDefault();
        console.log('Form submitted:', formData);
        // In a real app, we would send this data to the server
        // For now, just navigate back to the tasks list
        navigate('/tasks');
    };
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 p-6 overflow-auto", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "flex items-center mb-6", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: function () { return navigate('/tasks'); }, className: "mr-4", children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), "Back"] }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Create New Task" }), _jsx("p", { className: "text-muted-foreground", children: "Create a new task for an agent" })] })] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx(Card, { className: "mb-6", children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Task Details" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "title", children: "Task Title" }), _jsx(Input, { id: "title", name: "title", value: formData.title, onChange: handleInputChange, placeholder: "Enter task title", required: true })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Textarea, { id: "description", name: "description", value: formData.description, onChange: handleInputChange, placeholder: "Describe the task in detail...", rows: 4, required: true })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "status", children: "Status" }), _jsxs(Select, { id: "status", name: "status", value: formData.status, onChange: handleInputChange, required: true, children: [_jsx("option", { value: "not_started", children: "Not Started" }), _jsx("option", { value: "in_progress", children: "In Progress" }), _jsx("option", { value: "pending_review", children: "Pending Review" }), _jsx("option", { value: "completed", children: "Completed" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "priority", children: "Priority" }), _jsxs(Select, { id: "priority", name: "priority", value: formData.priority, onChange: handleInputChange, required: true, children: [_jsx("option", { value: "low", children: "Low" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "high", children: "High" }), _jsx("option", { value: "critical", children: "Critical" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "category", children: "Category" }), _jsxs(Select, { id: "category", name: "category", value: formData.category, onChange: handleInputChange, required: true, children: [_jsx("option", { value: "development", children: "Development" }), _jsx("option", { value: "design", children: "Design" }), _jsx("option", { value: "documentation", children: "Documentation" }), _jsx("option", { value: "testing", children: "Testing" }), _jsx("option", { value: "bug_fixing", children: "Bug Fixing" }), _jsx("option", { value: "feature", children: "Feature" }), _jsx("option", { value: "maintenance", children: "Maintenance" }), _jsx("option", { value: "other", children: "Other" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "assignedTo", children: "Assign To" }), _jsxs(Select, { id: "assignedTo", name: "assignedTo", value: formData.assignedTo, onChange: handleInputChange, required: true, children: [_jsx("option", { value: "", children: "Select an agent" }), mockAgents.map(function (agent) { return (_jsx("option", { value: agent.id.toString(), children: agent.name }, agent.id)); })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs(Label, { htmlFor: "dueDate", className: "flex items-center", children: [_jsx(Calendar, { className: "h-4 w-4 mr-1" }), "Due Date"] }), _jsx(Input, { id: "dueDate", name: "dueDate", type: "date", value: formData.dueDate, onChange: handleInputChange, required: true })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "estimatedHours", className: "flex items-center", children: [_jsx(Clock, { className: "h-4 w-4 mr-1" }), "Estimated Hours"] }), _jsx(Input, { id: "estimatedHours", name: "estimatedHours", type: "number", min: "0.5", step: "0.5", value: formData.estimatedHours, onChange: handleInputChange, required: true })] })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "newTag", className: "flex items-center", children: [_jsx(Tag, { className: "h-4 w-4 mr-1" }), "Tags"] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Input, { id: "newTag", name: "newTag", value: formData.newTag, onChange: handleInputChange, onKeyDown: handleTagKeyDown, placeholder: "Add tags and press Enter", className: "mr-2" }), _jsx(Button, { type: "button", variant: "outline", onClick: function () {
                                                                            if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
                                                                                setFormData(function (prev) { return (__assign(__assign({}, prev), { tags: __spreadArray(__spreadArray([], prev.tags, true), [prev.newTag.trim()], false), newTag: '' })); });
                                                                            }
                                                                        }, disabled: !formData.newTag.trim() || formData.tags.includes(formData.newTag.trim()), children: _jsx(Plus, { className: "h-4 w-4" }) })] }), formData.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: formData.tags.map(function (tag, index) { return (_jsxs(Badge, { variant: "outline", className: "flex items-center", children: [tag, _jsx("button", { type: "button", className: "ml-1 text-gray-500 hover:text-gray-700", onClick: function () { return removeTag(tag); }, children: _jsx(X, { className: "h-3 w-3" }) })] }, index)); }) }))] }), _jsxs("div", { children: [_jsxs(Label, { className: "flex items-center", children: [_jsx(Paperclip, { className: "h-4 w-4 mr-1" }), "Attachments"] }), _jsxs("div", { className: "mt-2", children: [_jsx(Input, { type: "file", multiple: true, className: "cursor-pointer" }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "You can upload multiple files. Maximum file size: 10MB." })] })] })] })] }) }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsxs(Button, { type: "button", variant: "outline", onClick: function () { return navigate('/tasks'); }, children: [_jsx(X, { className: "h-4 w-4 mr-2" }), "Cancel"] }), _jsxs(Button, { type: "submit", children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Create Task"] })] })] })] }) })] }));
};
export default NewTask;
