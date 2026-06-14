"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureSuggestionList = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const types_1 = require("../types");
const FeatureSuggestionCard = ({ suggestion, onVote, onConvert, onAddTodo, onAddComment, currentUserId }) => {
    const [newComment, setNewComment] = (0, react_1.useState)('');
    const [newTodoTitle, setNewTodoTitle] = (0, react_1.useState)('');
    const handleVote = () => onVote(suggestion.id);
    const handleConvert = () => onConvert(suggestion.id);
    const handleAddComment = (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(newComment);
            setNewComment('');
        }
    };
    const handleAddTodo = (e) => {
        e.preventDefault();
        if (newTodoTitle.trim()) {
            onAddTodo({
                title: newTodoTitle,
                suggestionId: suggestion.id
            });
            setNewTodoTitle('');
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "border rounded-lg p-4 mb-4 bg-white shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-start mb-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold", children: suggestion.title }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600", children: suggestion.description })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: handleVote, className: "px-3 py-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200", children: ["\u2B06\uFE0F ", suggestion.votes] }), suggestion.status !== types_1.SuggestionStatus.CONVERTED && ((0, jsx_runtime_1.jsx)("button", { onClick: handleConvert, className: "px-3 py-1 bg-green-100 text-green-600 rounded-full hover:bg-green-200", children: "Convert to Feature" }))] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-2 mt-2 mb-3", children: suggestion.tags.map((tag) => ((0, jsx_runtime_1.jsx)("span", { className: "px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full", children: tag }, tag))) }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-sm font-medium mb-2", children: "Add a comment" }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleAddComment, className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", value: newComment, onChange: (e) => setNewComment(e.target.value), className: "flex-1 px-3 py-2 border rounded-md", placeholder: "Write a comment..." }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "px-3 py-2 bg-blue-500 text-white rounded-md", children: "Add" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-sm font-medium mb-2", children: "Add a todo" }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleAddTodo, className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", value: newTodoTitle, onChange: (e) => setNewTodoTitle(e.target.value), className: "flex-1 px-3 py-2 border rounded-md", placeholder: "Create a todo item..." }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "px-3 py-2 bg-green-500 text-white rounded-md", children: "Add" })] })] })] }));
};
const FeatureSuggestionList = ({ suggestionService, suggestions, onUpdateStatus, onConvertToFeature, onRefresh, }) => {
    return ((0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: suggestions.map((suggestion) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow-sm p-4 border border-gray-200", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-start", children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-medium text-gray-900", children: suggestion.title }), (0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => onUpdateStatus(suggestion.id, types_1.SuggestionStatus.UNDER_REVIEW), className: "px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200", children: "Review" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => onConvertToFeature(suggestion.id), className: "px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200", children: "Convert" })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-gray-600", children: suggestion.description }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4 flex items-center space-x-4 text-sm text-gray-500", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["\uD83D\uDC4D ", suggestion.votes, " votes"] }), (0, jsx_runtime_1.jsxs)("span", { children: ["Status: ", suggestion.status] })] })] }, suggestion.id))) }));
};
exports.FeatureSuggestionList = FeatureSuggestionList;
//# sourceMappingURL=FeatureSuggestionList.js.map