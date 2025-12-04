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
import { Save, X, ChevronLeft, Plus, Tag, Lightbulb } from 'lucide-react';
/**
 * New Suggestion page component
 */
var NewSuggestion = function () {
    var navigate = useNavigate();
    // Form state
    var _a = useState({
        title: '',
        description: '',
        category: 'development',
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
        // For now, just navigate back to the suggestions list
        navigate('/suggestions');
    };
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 p-6 overflow-auto", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "flex items-center mb-6", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: function () { return navigate('/suggestions'); }, className: "mr-4", children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), "Back"] }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Submit New Suggestion" }), _jsx("p", { className: "text-muted-foreground", children: "Share your ideas for new features" })] })] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx(Card, { className: "mb-6", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center mb-6", children: [_jsx("div", { className: "p-3 rounded-lg bg-primary/10 mr-4", children: _jsx(Lightbulb, { className: "h-6 w-6 text-primary" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: "Feature Suggestion" }), _jsx("p", { className: "text-muted-foreground", children: "Your suggestions help us improve the platform. Be as detailed as possible." })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "title", children: "Suggestion Title" }), _jsx(Input, { id: "title", name: "title", value: formData.title, onChange: handleInputChange, placeholder: "Enter a clear, concise title for your suggestion", required: true })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Textarea, { id: "description", name: "description", value: formData.description, onChange: handleInputChange, placeholder: "Describe your suggestion in detail. What problem does it solve? How would it work? Who would benefit from it?", rows: 8, required: true })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "category", children: "Category" }), _jsxs(Select, { id: "category", name: "category", value: formData.category, onChange: handleInputChange, required: true, children: [_jsx("option", { value: "development", children: "Development" }), _jsx("option", { value: "ui", children: "User Interface" }), _jsx("option", { value: "ux", children: "User Experience" }), _jsx("option", { value: "integration", children: "Integration" }), _jsx("option", { value: "analytics", children: "Analytics" }), _jsx("option", { value: "collaboration", children: "Collaboration" }), _jsx("option", { value: "mobile", children: "Mobile" }), _jsx("option", { value: "customization", children: "Customization" }), _jsx("option", { value: "other", children: "Other" })] })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "newTag", className: "flex items-center", children: [_jsx(Tag, { className: "h-4 w-4 mr-1" }), "Tags"] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Input, { id: "newTag", name: "newTag", value: formData.newTag, onChange: handleInputChange, onKeyDown: handleTagKeyDown, placeholder: "Add tags and press Enter", className: "mr-2" }), _jsx(Button, { type: "button", variant: "outline", onClick: function () {
                                                                            if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
                                                                                setFormData(function (prev) { return (__assign(__assign({}, prev), { tags: __spreadArray(__spreadArray([], prev.tags, true), [prev.newTag.trim()], false), newTag: '' })); });
                                                                            }
                                                                        }, disabled: !formData.newTag.trim() || formData.tags.includes(formData.newTag.trim()), children: _jsx(Plus, { className: "h-4 w-4" }) })] }), formData.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: formData.tags.map(function (tag, index) { return (_jsxs(Badge, { variant: "outline", className: "flex items-center", children: [tag, _jsx("button", { type: "button", className: "ml-1 text-gray-500 hover:text-gray-700", onClick: function () { return removeTag(tag); }, children: _jsx(X, { className: "h-3 w-3" }) })] }, index)); }) }))] })] })] }) }), _jsx(Card, { className: "mb-6", children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Guidelines for Good Suggestions" }), _jsxs("ul", { className: "space-y-2 list-disc pl-5", children: [_jsx("li", { children: "Be specific about the problem your suggestion solves" }), _jsx("li", { children: "Consider how your suggestion would benefit other users" }), _jsx("li", { children: "Provide examples of how the feature would work" }), _jsx("li", { children: "Check if a similar suggestion already exists before submitting" }), _jsx("li", { children: "Use clear, concise language" })] })] }) }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsxs(Button, { type: "button", variant: "outline", onClick: function () { return navigate('/suggestions'); }, children: [_jsx(X, { className: "h-4 w-4 mr-2" }), "Cancel"] }), _jsxs(Button, { type: "submit", children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Submit Suggestion"] })] })] })] }) })] }));
};
export default NewSuggestion;
