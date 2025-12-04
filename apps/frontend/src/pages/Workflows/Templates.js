import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkflow } from '@/hooks';
import { ChevronLeft, Search, Plus, Copy, ArrowRight } from 'lucide-react';
// Mock template data
var mockTemplates = [
    {
        id: 'template-1',
        name: 'Code Review',
        description: 'Automate code review process with AI agents',
        category: 'Development',
        complexity: 'Medium',
        popularity: 'High',
        nodeCount: 5,
        edgeCount: 6
    },
    {
        id: 'template-2',
        name: 'Data Analysis',
        description: 'Process and analyze data with AI agents',
        category: 'Data',
        complexity: 'High',
        popularity: 'Medium',
        nodeCount: 7,
        edgeCount: 9
    },
    {
        id: 'template-3',
        name: 'Content Generation',
        description: 'Generate content with AI agents',
        category: 'Content',
        complexity: 'Low',
        popularity: 'High',
        nodeCount: 3,
        edgeCount: 2
    },
    {
        id: 'template-4',
        name: 'Bug Triage',
        description: 'Automatically triage and categorize bugs',
        category: 'Development',
        complexity: 'Medium',
        popularity: 'Medium',
        nodeCount: 4,
        edgeCount: 5
    },
    {
        id: 'template-5',
        name: 'API Integration',
        description: 'Connect and integrate with external APIs',
        category: 'Integration',
        complexity: 'High',
        popularity: 'Medium',
        nodeCount: 6,
        edgeCount: 8
    },
    {
        id: 'template-6',
        name: 'Documentation Generator',
        description: 'Automatically generate documentation from code',
        category: 'Documentation',
        complexity: 'Medium',
        popularity: 'Low',
        nodeCount: 5,
        edgeCount: 4
    }
];
/**
 * Workflow Templates page component
 */
var WorkflowTemplates = function () {
    var navigate = useNavigate();
    var createWorkflow = useWorkflow().createWorkflow;
    var _a = useState(''), searchQuery = _a[0], setSearchQuery = _a[1];
    var _b = useState(null), selectedCategory = _b[0], setSelectedCategory = _b[1];
    var _c = useState(null), selectedComplexity = _c[0], setSelectedComplexity = _c[1];
    // Filter templates based on search query and filters
    var filteredTemplates = mockTemplates.filter(function (template) {
        var matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        var matchesCategory = selectedCategory ? template.category === selectedCategory : true;
        var matchesComplexity = selectedComplexity ? template.complexity === selectedComplexity : true;
        return matchesSearch && matchesCategory && matchesComplexity;
    });
    // Get unique categories and complexities
    var categories = Array.from(new Set(mockTemplates.map(function (template) { return template.category; })));
    var complexities = Array.from(new Set(mockTemplates.map(function (template) { return template.complexity; })));
    // Handle use template
    var handleUseTemplate = function (templateId) {
        var template = mockTemplates.find(function (t) { return t.id === templateId; });
        if (template) {
            var workflow = createWorkflow("".concat(template.name, " Workflow"), template.description);
            navigate("/workflows/builder?id=".concat(workflow.id));
        }
    };
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "container mx-auto py-6 space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: function () { return navigate('/workflows'); }, className: "mr-4", children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), "Back"] }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Workflow Templates" }), _jsx("p", { className: "text-muted-foreground", children: "Start with a pre-built workflow template" })] })] }), _jsx(Button, { asChild: true, children: _jsxs(Link, { to: "/workflows/builder", children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Create from Scratch"] }) })] }), _jsxs("div", { className: "flex flex-col md:flex-row gap-6", children: [_jsx("div", { className: "md:w-64 space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Filters" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2", children: "Category" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("input", { id: "category-all", type: "radio", name: "category", className: "h-4 w-4 text-primary border-gray-300 focus:ring-primary", checked: selectedCategory === null, onChange: function () { return setSelectedCategory(null); } }), _jsx("label", { htmlFor: "category-all", className: "ml-2 text-sm text-gray-700", children: "All Categories" })] }), categories.map(function (category) { return (_jsxs("div", { className: "flex items-center", children: [_jsx("input", { id: "category-".concat(category), type: "radio", name: "category", className: "h-4 w-4 text-primary border-gray-300 focus:ring-primary", checked: selectedCategory === category, onChange: function () { return setSelectedCategory(category); } }), _jsx("label", { htmlFor: "category-".concat(category), className: "ml-2 text-sm text-gray-700", children: category })] }, category)); })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2", children: "Complexity" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("input", { id: "complexity-all", type: "radio", name: "complexity", className: "h-4 w-4 text-primary border-gray-300 focus:ring-primary", checked: selectedComplexity === null, onChange: function () { return setSelectedComplexity(null); } }), _jsx("label", { htmlFor: "complexity-all", className: "ml-2 text-sm text-gray-700", children: "All Complexities" })] }), complexities.map(function (complexity) { return (_jsxs("div", { className: "flex items-center", children: [_jsx("input", { id: "complexity-".concat(complexity), type: "radio", name: "complexity", className: "h-4 w-4 text-primary border-gray-300 focus:ring-primary", checked: selectedComplexity === complexity, onChange: function () { return setSelectedComplexity(complexity); } }), _jsx("label", { htmlFor: "complexity-".concat(complexity), className: "ml-2 text-sm text-gray-700", children: complexity })] }, complexity)); })] })] })] })] }) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "mb-6", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search templates...", className: "pl-8", value: searchQuery, onChange: function (e) { return setSearchQuery(e.target.value); } })] }) }), filteredTemplates.length === 0 ? (_jsx("div", { className: "bg-gray-50 border border-gray-200 rounded-md p-6 text-center", children: _jsx("p", { className: "text-muted-foreground", children: "No templates match your search criteria." }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredTemplates.map(function (template) { return (_jsxs(Card, { className: "overflow-hidden", children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx(CardTitle, { children: template.name }), _jsx("span", { className: "px-2 py-1 rounded-full text-xs ".concat(template.complexity === 'Low' ? 'bg-green-100 text-green-700' :
                                                                            template.complexity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                                'bg-red-100 text-red-700'), children: template.complexity })] }), _jsx(CardDescription, { className: "line-clamp-2", children: template.description })] }), _jsxs(CardContent, { className: "pb-2", children: [_jsxs("div", { className: "flex items-center text-sm text-muted-foreground", children: [_jsxs("span", { className: "mr-4", children: ["Category: ", template.category] }), _jsxs("span", { children: ["Popularity: ", template.popularity] })] }), _jsxs("div", { className: "flex items-center text-sm text-muted-foreground mt-1", children: [_jsxs("span", { className: "mr-4", children: ["Nodes: ", template.nodeCount] }), _jsxs("span", { children: ["Connections: ", template.edgeCount] })] })] }), _jsxs(CardFooter, { className: "flex justify-between", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: function () { return handleUseTemplate(template.id); }, children: [_jsx(Copy, { className: "h-4 w-4 mr-2" }), "Use Template"] }), _jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: _jsxs(Link, { to: "/workflows/templates/".concat(template.id), children: ["Preview", _jsx(ArrowRight, { className: "h-4 w-4 ml-2" })] }) })] })] }, template.id)); }) }))] })] })] }) })] }));
};
export default WorkflowTemplates;
