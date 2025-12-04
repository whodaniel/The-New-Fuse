var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export default function WorkflowTemplates() {
    var _this = this;
    var _a = useState([]), templates = _a[0], setTemplates = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState('all'), selectedCategory = _c[0], setSelectedCategory = _c[1];
    var _d = useState(''), searchTerm = _d[0], setSearchTerm = _d[1];
    useEffect(function () {
        // Fetch workflow templates from backend
        var fetchTemplates = function () { return __awaiter(_this, void 0, void 0, function () {
            var response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, 6, 7]);
                        return [4 /*yield*/, fetch('/api/workflows/templates')];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        setTemplates(data);
                        return [3 /*break*/, 4];
                    case 3:
                        // Fallback to mock data if API not available
                        setTemplates(mockTemplates);
                        _a.label = 4;
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        error_1 = _a.sent();
                        console.error('Error fetching workflow templates:', error_1);
                        setTemplates(mockTemplates);
                        return [3 /*break*/, 7];
                    case 6:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        }); };
        fetchTemplates();
    }, []);
    var mockTemplates = [
        {
            id: '1',
            name: 'Data Analysis Pipeline',
            description: 'Automated data collection, cleaning, analysis, and reporting workflow',
            category: 'Analytics',
            tags: ['data', 'analysis', 'reporting'],
            complexity: 'Intermediate',
            estimatedTime: '2-4 hours',
            agentCount: 3,
            isPopular: true
        },
        {
            id: '2',
            name: 'Customer Support Automation',
            description: 'Multi-agent system for handling customer inquiries and support tickets',
            category: 'Customer Service',
            tags: ['support', 'automation', 'customer'],
            complexity: 'Advanced',
            estimatedTime: '1-2 hours',
            agentCount: 4,
            isPopular: true
        },
        {
            id: '3',
            name: 'Content Creation Workflow',
            description: 'Collaborative content creation, review, and publishing process',
            category: 'Content',
            tags: ['content', 'creation', 'publishing'],
            complexity: 'Simple',
            estimatedTime: '30 minutes',
            agentCount: 2,
            isPopular: false
        },
        {
            id: '4',
            name: 'Code Review Assistant',
            description: 'Automated code review, testing, and deployment workflow',
            category: 'Development',
            tags: ['code', 'review', 'testing'],
            complexity: 'Advanced',
            estimatedTime: '3-5 hours',
            agentCount: 5,
            isPopular: true
        }
    ];
    var categories = ['all', 'Analytics', 'Customer Service', 'Content', 'Development'];
    var filteredTemplates = templates.filter(function (template) {
        var matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
        var matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.tags.some(function (tag) { return tag.toLowerCase().includes(searchTerm.toLowerCase()); });
        return matchesCategory && matchesSearch;
    });
    var handleUseTemplate = function (templateId) { return __awaiter(_this, void 0, void 0, function () {
        var response, newWorkflow, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, fetch("/api/workflows/templates/".concat(templateId, "/use"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    newWorkflow = _a.sent();
                    // Redirect to workflow editor or show success message
                    window.location.href = "/workflows/".concat(newWorkflow.id);
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error('Error using template:', error_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-3xl font-bold", children: "Workflow Templates" }), _jsx("button", { className: "px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90", children: "Create Custom Template" })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsx("div", { className: "flex-1", children: _jsx("input", { type: "text", placeholder: "Search templates...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" }) }), _jsx("select", { value: selectedCategory, onChange: function (e) { return setSelectedCategory(e.target.value); }, className: "px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary", title: "Filter by category", children: categories.map(function (category) { return (_jsx("option", { value: category, children: category === 'all' ? 'All Categories' : category }, category)); }) })] }), selectedCategory === 'all' && (_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Popular Templates" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: templates.filter(function (t) { return t.isPopular; }).map(function (template) { return (_jsx(TemplateCard, { template: template, onUse: handleUseTemplate, isPopular: true }, template.id)); }) })] })), _jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: selectedCategory === 'all' ? 'All Templates' : "".concat(selectedCategory, " Templates") }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredTemplates.map(function (template) { return (_jsx(TemplateCard, { template: template, onUse: handleUseTemplate }, template.id)); }) })] }), filteredTemplates.length === 0 && (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-muted-foreground", children: "No templates found matching your criteria." }) }))] }));
}
function TemplateCard(_a) {
    var template = _a.template, onUse = _a.onUse, _b = _a.isPopular, isPopular = _b === void 0 ? false : _b;
    var complexityColors = {
        Simple: 'bg-green-100 text-green-800',
        Intermediate: 'bg-yellow-100 text-yellow-800',
        Advanced: 'bg-red-100 text-red-800'
    };
    return (_jsxs("div", { className: "bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow relative", children: [isPopular && (_jsx("div", { className: "absolute top-2 right-2", children: _jsx("span", { className: "px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full", children: "Popular" }) })), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg", children: template.name }), _jsx("p", { className: "text-muted-foreground text-sm mt-1", children: template.description })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: template.tags.map(function (tag) { return (_jsx("span", { className: "px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded", children: tag }, tag)); }) }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "px-2 py-1 text-xs rounded ".concat(complexityColors[template.complexity]), children: template.complexity }), _jsxs("span", { className: "text-muted-foreground", children: [template.agentCount, " agents"] })] }), _jsx("div", { className: "flex items-center justify-between text-sm", children: _jsxs("span", { className: "text-muted-foreground", children: ["Est. time: ", template.estimatedTime] }) }), _jsxs("div", { className: "flex gap-2 pt-2", children: [_jsx("button", { onClick: function () { return onUse(template.id); }, className: "flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm", children: "Use Template" }), _jsx("button", { className: "px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm", children: "Preview" })] })] })] }));
}
