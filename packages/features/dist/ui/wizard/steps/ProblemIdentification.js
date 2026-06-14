"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProblemIdentification = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Problem Identification Step
 *
 * Help users identify and describe their issue
 */
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const PROBLEM_CATEGORIES = [
    {
        id: 'agent',
        label: 'Agent Issues',
        description: 'Problems with AI agent behavior or performance',
        icon: lucide_react_1.Bug,
        subcategories: [
            'Agent not responding',
            'Incorrect responses',
            'Slow performance',
            'Context issues',
            'Tool failures',
        ],
    },
    {
        id: 'connection',
        label: 'Connection Problems',
        description: 'Issues connecting to services or APIs',
        icon: lucide_react_1.Zap,
        subcategories: [
            'API connection failed',
            'WebSocket disconnects',
            'Timeout errors',
            'Authentication failures',
        ],
    },
    {
        id: 'database',
        label: 'Database Issues',
        description: 'Problems with data storage or retrieval',
        icon: lucide_react_1.Database,
        subcategories: [
            'Connection errors',
            'Query failures',
            'Data not saving',
            'Migration issues',
            'Performance problems',
        ],
    },
    {
        id: 'deployment',
        label: 'Deployment Issues',
        description: 'Problems deploying or running services',
        icon: lucide_react_1.Cloud,
        subcategories: [
            'Build failures',
            'Container issues',
            'Environment variables',
            'Health check failures',
            'Scaling problems',
        ],
    },
    {
        id: 'access',
        label: 'Access & Permissions',
        description: 'Issues with user access or permissions',
        icon: lucide_react_1.Users,
        subcategories: [
            'Permission denied',
            'Login issues',
            'Role problems',
            'Token expired',
            'Rate limiting',
        ],
    },
];
const COMMON_ISSUES = [
    { id: 'agent-timeout', label: 'Agent requests timing out', category: 'agent' },
    { id: 'api-401', label: 'Getting 401 Unauthorized errors', category: 'connection' },
    { id: 'db-connection', label: 'Cannot connect to database', category: 'database' },
    { id: 'deploy-fail', label: 'CloudRuntime deployment failing', category: 'deployment' },
    { id: 'permission-denied', label: 'Permission denied errors', category: 'access' },
];
const ProblemIdentification = ({ context, onDataChange, validationErrors = [], }) => {
    const [selectedCategory, setSelectedCategory] = (0, react_1.useState)(context.data.problemCategory || null);
    const [selectedSubcategory, setSelectedSubcategory] = (0, react_1.useState)(context.data.problemSubcategory || null);
    const [description, setDescription] = (0, react_1.useState)(context.data.problemDescription || '');
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const handleCategorySelect = (categoryId) => {
        setSelectedCategory(categoryId);
        setSelectedSubcategory(null);
        onDataChange({ problemCategory: categoryId, problemSubcategory: null });
    };
    const handleSubcategorySelect = (subcategory) => {
        setSelectedSubcategory(subcategory);
        onDataChange({ problemSubcategory: subcategory });
    };
    const handleDescriptionChange = (value) => {
        setDescription(value);
        onDataChange({ problemDescription: value });
    };
    const handleQuickSelect = (issue) => {
        setSelectedCategory(issue.category);
        setDescription(issue.label);
        onDataChange({
            problemCategory: issue.category,
            problemDescription: issue.label,
            quickIssueId: issue.id,
        });
    };
    const filteredIssues = COMMON_ISSUES.filter((issue) => issue.label.toLowerCase().includes(searchQuery.toLowerCase()));
    const selectedCategoryData = PROBLEM_CATEGORIES.find((c) => c.id === selectedCategory);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-problem-id", children: [(0, jsx_runtime_1.jsxs)("div", { className: "step-header", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-8 h-8 text-primary" }), (0, jsx_runtime_1.jsx)("h2", { className: "step-title", children: "What's the Problem?" }), (0, jsx_runtime_1.jsx)("p", { className: "step-description", children: "Tell us what you're experiencing so we can help you fix it" })] }), validationErrors.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "validation-errors", children: validationErrors.map((error, index) => ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error }, index))) })), (0, jsx_runtime_1.jsxs)("div", { className: "problem-content", children: [(0, jsx_runtime_1.jsxs)("div", { className: "quick-search", children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search for your issue...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }), searchQuery && filteredIssues.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "search-results", children: filteredIssues.map((issue) => ((0, jsx_runtime_1.jsxs)("div", { className: "search-result", onClick: () => handleQuickSelect(issue), children: [(0, jsx_runtime_1.jsx)("span", { children: issue.label }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: "w-4 h-4" })] }, issue.id))) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "category-selection", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Select a Category" }), (0, jsx_runtime_1.jsx)("div", { className: "categories-grid", children: PROBLEM_CATEGORIES.map((category) => {
                                    const Icon = category.icon;
                                    const isSelected = selectedCategory === category.id;
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: `category-card ${isSelected ? 'selected' : ''}`, onClick: () => handleCategorySelect(category.id), children: [(0, jsx_runtime_1.jsx)(Icon, { className: "w-6 h-6" }), (0, jsx_runtime_1.jsx)("h4", { children: category.label }), (0, jsx_runtime_1.jsx)("p", { children: category.description })] }, category.id));
                                }) })] }), selectedCategoryData && ((0, jsx_runtime_1.jsxs)("div", { className: "subcategory-selection", children: [(0, jsx_runtime_1.jsx)("h3", { children: "What specifically?" }), (0, jsx_runtime_1.jsx)("div", { className: "subcategories", children: selectedCategoryData.subcategories.map((sub) => ((0, jsx_runtime_1.jsx)("button", { className: `subcategory-btn ${selectedSubcategory === sub ? 'selected' : ''}`, onClick: () => handleSubcategorySelect(sub), children: sub }, sub))) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "description-section", children: [(0, jsx_runtime_1.jsxs)("h3", { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.HelpCircle, { className: "w-4 h-4" }), "Describe the Problem"] }), (0, jsx_runtime_1.jsx)("textarea", { placeholder: "Please describe what's happening, including any error messages...", value: description, onChange: (e) => handleDescriptionChange(e.target.value), rows: 4 }), (0, jsx_runtime_1.jsxs)("div", { className: "description-tips", children: [(0, jsx_runtime_1.jsx)("p", { children: "Helpful details to include:" }), (0, jsx_runtime_1.jsxs)("ul", { children: [(0, jsx_runtime_1.jsx)("li", { children: "When did the problem start?" }), (0, jsx_runtime_1.jsx)("li", { children: "What were you trying to do?" }), (0, jsx_runtime_1.jsx)("li", { children: "Any error messages you see" }), (0, jsx_runtime_1.jsx)("li", { children: "Steps to reproduce the issue" })] })] })] })] })] }));
};
exports.ProblemIdentification = ProblemIdentification;
//# sourceMappingURL=ProblemIdentification.js.map