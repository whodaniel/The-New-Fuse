import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileTemplate, Plus, ArrowRight } from 'lucide-react';
// Template categories
var TEMPLATE_CATEGORIES = [
    'Basic',
    'Agent Collaboration',
    'Data Processing',
    'Integration',
    'Custom'
];
// Template definitions
var WORKFLOW_TEMPLATES = [
    {
        id: 'simple-agent-task',
        name: 'Simple Agent Task',
        description: 'A simple workflow with an input, agent, and output node.',
        category: 'Basic',
        nodes: [
            {
                id: 'input-1',
                type: 'input',
                position: { x: 100, y: 100 },
                data: { name: 'Input', type: 'input' }
            },
            {
                id: 'agent-1',
                type: 'agent',
                position: { x: 300, y: 100 },
                data: { name: 'Agent', type: 'agent' }
            },
            {
                id: 'output-1',
                type: 'output',
                position: { x: 500, y: 100 },
                data: { name: 'Output', type: 'output' }
            }
        ],
        edges: [
            { id: 'e1-2', source: 'input-1', target: 'agent-1' },
            { id: 'e2-3', source: 'agent-1', target: 'output-1' }
        ]
    },
    {
        id: 'agent-collaboration',
        name: 'Agent Collaboration',
        description: 'A workflow with two agents collaborating via A2A communication.',
        category: 'Agent Collaboration',
        nodes: [
            {
                id: 'input-1',
                type: 'input',
                position: { x: 100, y: 100 },
                data: { name: 'Input', type: 'input' }
            },
            {
                id: 'agent-1',
                type: 'agent',
                position: { x: 300, y: 50 },
                data: { name: 'Agent 1', type: 'agent' }
            },
            {
                id: 'agent-2',
                type: 'agent',
                position: { x: 300, y: 150 },
                data: { name: 'Agent 2', type: 'agent' }
            },
            {
                id: 'a2a-1',
                type: 'a2a',
                position: { x: 500, y: 100 },
                data: { name: 'A2A Communication', type: 'a2a' }
            },
            {
                id: 'output-1',
                type: 'output',
                position: { x: 700, y: 100 },
                data: { name: 'Output', type: 'output' }
            }
        ],
        edges: [
            { id: 'e1-2', source: 'input-1', target: 'agent-1' },
            { id: 'e1-3', source: 'input-1', target: 'agent-2' },
            { id: 'e2-4', source: 'agent-1', target: 'a2a-1' },
            { id: 'e3-4', source: 'agent-2', target: 'a2a-1' },
            { id: 'e4-5', source: 'a2a-1', target: 'output-1' }
        ]
    },
    {
        id: 'data-processing',
        name: 'Data Processing Pipeline',
        description: 'A workflow for processing and transforming data.',
        category: 'Data Processing',
        nodes: [
            {
                id: 'input-1',
                type: 'input',
                position: { x: 100, y: 100 },
                data: { name: 'Data Input', type: 'input' }
            },
            {
                id: 'transform-1',
                type: 'transform',
                position: { x: 300, y: 100 },
                data: { name: 'Data Transformation', type: 'transform' }
            },
            {
                id: 'mcpTool-1',
                type: 'mcpTool',
                position: { x: 500, y: 100 },
                data: { name: 'Data Processing Tool', type: 'mcpTool' }
            },
            {
                id: 'output-1',
                type: 'output',
                position: { x: 700, y: 100 },
                data: { name: 'Processed Output', type: 'output' }
            }
        ],
        edges: [
            { id: 'e1-2', source: 'input-1', target: 'transform-1' },
            { id: 'e2-3', source: 'transform-1', target: 'mcpTool-1' },
            { id: 'e3-4', source: 'mcpTool-1', target: 'output-1' }
        ]
    },
    {
        id: 'conditional-workflow',
        name: 'Conditional Workflow',
        description: 'A workflow with conditional branching based on input data.',
        category: 'Basic',
        nodes: [
            {
                id: 'input-1',
                type: 'input',
                position: { x: 100, y: 100 },
                data: { name: 'Input', type: 'input' }
            },
            {
                id: 'condition-1',
                type: 'condition',
                position: { x: 300, y: 100 },
                data: { name: 'Condition', type: 'condition' }
            },
            {
                id: 'agent-1',
                type: 'agent',
                position: { x: 500, y: 50 },
                data: { name: 'Agent A', type: 'agent' }
            },
            {
                id: 'agent-2',
                type: 'agent',
                position: { x: 500, y: 150 },
                data: { name: 'Agent B', type: 'agent' }
            },
            {
                id: 'output-1',
                type: 'output',
                position: { x: 700, y: 100 },
                data: { name: 'Output', type: 'output' }
            }
        ],
        edges: [
            { id: 'e1-2', source: 'input-1', target: 'condition-1' },
            { id: 'e2-3', source: 'condition-1', target: 'agent-1', sourceHandle: 'true', targetHandle: 'default' },
            { id: 'e2-4', source: 'condition-1', target: 'agent-2', sourceHandle: 'false', targetHandle: 'default' },
            { id: 'e3-5', source: 'agent-1', target: 'output-1' },
            { id: 'e4-5', source: 'agent-2', target: 'output-1' }
        ]
    },
    {
        id: 'api-integration',
        name: 'API Integration',
        description: 'A workflow for integrating with external APIs.',
        category: 'Integration',
        nodes: [
            {
                id: 'input-1',
                type: 'input',
                position: { x: 100, y: 100 },
                data: { name: 'Request Input', type: 'input' }
            },
            {
                id: 'transform-1',
                type: 'transform',
                position: { x: 300, y: 100 },
                data: { name: 'Request Transformation', type: 'transform' }
            },
            {
                id: 'mcpTool-1',
                type: 'mcpTool',
                position: { x: 500, y: 100 },
                data: { name: 'API Client', type: 'mcpTool' }
            },
            {
                id: 'transform-2',
                type: 'transform',
                position: { x: 700, y: 100 },
                data: { name: 'Response Transformation', type: 'transform' }
            },
            {
                id: 'output-1',
                type: 'output',
                position: { x: 900, y: 100 },
                data: { name: 'API Response', type: 'output' }
            }
        ],
        edges: [
            { id: 'e1-2', source: 'input-1', target: 'transform-1' },
            { id: 'e2-3', source: 'transform-1', target: 'mcpTool-1' },
            { id: 'e3-4', source: 'mcpTool-1', target: 'transform-2' },
            { id: 'e4-5', source: 'transform-2', target: 'output-1' }
        ]
    }
];
export var WorkflowTemplates = function (_a) {
    var onApplyTemplate = _a.onApplyTemplate;
    var _b = useState(false), isOpen = _b[0], setIsOpen = _b[1];
    var _c = useState('Basic'), selectedCategory = _c[0], setSelectedCategory = _c[1];
    // Filter templates by category
    var filteredTemplates = WORKFLOW_TEMPLATES.filter(function (template) {
        return template.category === selectedCategory;
    });
    // Apply template and close dialog
    var applyTemplate = function (template) {
        onApplyTemplate(template);
        setIsOpen(false);
    };
    return (_jsxs(Dialog, { open: isOpen, onOpenChange: setIsOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", className: "h-8", children: [_jsx(FileTemplate, { className: "h-4 w-4 mr-2" }), "Templates"] }) }), _jsxs(DialogContent, { className: "sm:max-w-[800px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Workflow Templates" }), _jsx(DialogDescription, { children: "Choose a template to quickly create a new workflow." })] }), _jsxs(Tabs, { defaultValue: selectedCategory, onValueChange: setSelectedCategory, children: [_jsx(TabsList, { className: "grid grid-cols-5 mb-4", children: TEMPLATE_CATEGORIES.map(function (category) { return (_jsx(TabsTrigger, { value: category, children: category }, category)); }) }), TEMPLATE_CATEGORIES.map(function (category) { return (_jsx(TabsContent, { value: category, className: "mt-0", children: _jsx(ScrollArea, { className: "h-[400px] pr-4", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: filteredTemplates.map(function (template) { return (_jsxs(Card, { className: "overflow-hidden", children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardTitle, { className: "text-lg", children: template.name }), _jsx(CardDescription, { children: template.description })] }), _jsx(CardContent, { className: "pb-2", children: _jsx("div", { className: "bg-muted rounded-md p-2 h-32 flex items-center justify-center text-muted-foreground text-sm", children: _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "font-mono text-xs mb-1", children: [template.nodes.length, " nodes, ", template.edges.length, " connections"] }), _jsxs("div", { className: "flex items-center justify-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center", children: _jsx(Plus, { className: "h-4 w-4 text-primary" }) }), _jsx(ArrowRight, { className: "h-4 w-4" }), _jsx("div", { className: "w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center", children: template.nodes.length })] })] }) }) }), _jsx(CardFooter, { children: _jsx(Button, { variant: "default", size: "sm", className: "w-full", onClick: function () { return applyTemplate(template); }, children: "Use Template" }) })] }, template.id)); }) }) }) }, category)); })] }), _jsx(DialogFooter, { children: _jsx(Button, { variant: "outline", onClick: function () { return setIsOpen(false); }, children: "Cancel" }) })] })] }));
};
export default WorkflowTemplates;
